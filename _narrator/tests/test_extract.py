"""End-to-end test: extract our fixture PDF and verify the recovered formData."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from extract import (  # noqa: E402
    extract_case_details,
    extract_criteria,
    extract_evidence_confirmation,
    extract_formdata,
)
from templates import label_to_key_lookup  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures"


class ExtractFromFixturePdfTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.data = extract_formdata(FIXTURES / "sample.pdf")

    def test_case_details(self) -> None:
        cd = self.data["caseDetails"]
        self.assertEqual(cd["feeEarnerName"], "Jane Doe")
        self.assertEqual(cd["matterType"], "Care & Supervision")
        self.assertEqual(cd["caseMatterName"], "Re X (Local Authority care proceedings)")

    def test_panel_membership(self) -> None:
        pm = self.data["panelMembership"]
        self.assertIn("panel_membership_resolution", pm)
        self.assertIn("panel_membership_children", pm)
        self.assertNotIn("panel_membership_advanced", pm)

    def test_stage1_keys_and_explanations(self) -> None:
        s1 = self.data["stage1"]
        self.assertEqual(
            set(s1.keys()),
            {"s1_cse_detailed_knowledge", "s1_cse_marshalling_evidence", "s1_circ_expert_evidence"},
        )
        # Verbatim solicitor text must round-trip exactly.
        self.assertIn("Re B-S (Children) [2013] EWCA Civ 1146", s1["s1_cse_detailed_knowledge"]["explanation"])
        self.assertIn("1,400 pages", s1["s1_cse_marshalling_evidence"]["explanation"])
        # Em-dash preservation
        self.assertIn("—", s1["s1_circ_expert_evidence"]["explanation"])

    def test_stage2_keys(self) -> None:
        s2 = self.data["stage2"]
        self.assertEqual(
            set(s2.keys()),
            {"s2_resp_no_counsel_drafting", "s2_cse_care_vulnerable_client"},
        )
        self.assertIn(
            "Scott Schedule",
            s2["s2_resp_no_counsel_drafting"]["explanation"],
        )

    def test_uplift_percent(self) -> None:
        self.assertEqual(self.data["finalUpliftPercent"], "75")

    def test_a_pdf_from_before_the_question_existed_is_not_a_confirmation(self) -> None:
        """The fixture predates v1.11, so it carries no Evidence on File
        section. It must come back False rather than missing: skeleton.py
        reads the key directly, and the narrative sentence it gates is an
        assertion nobody made on this file."""
        self.assertIs(self.data["evidenceOnFileConfirmed"], False)

    def test_court_is_absent_from_a_pre_v111_pdf_without_breaking_the_rest(self) -> None:
        self.assertEqual(self.data["caseDetails"]["courtLevel"], "")


class EvidenceConfirmationTests(unittest.TestCase):
    """Read at the text level: building a PDF per case would test jsPDF, and
    what is under test is the reading of one line the app is known to print.

    The section body is what ``section_slice`` hands over, so each case here
    is the PDF text as ``extract_formdata`` sees it.
    """

    CONFIRMED = (
        "CASE DETAILS\nFee Earner:  Jane Doe\n"
        "EVIDENCE ON FILE\n"
        "Evidence on file: Confirmed\n"
        "The fee earner confirms that evidence supporting the matters set out "
        "above is held on the case file.\n"
        "DISCLAIMER\n"
    )
    DECLINED = CONFIRMED.replace(
        "Evidence on file: Confirmed",
        "Evidence on file: Not confirmed",
    ).replace(
        "The fee earner confirms that evidence supporting",
        "The fee earner has not confirmed that supporting evidence is held on "
        "the case file. The narrative will not assert that it is. Evidence "
        "supporting",
    )

    def test_a_refusal_that_loses_its_not_is_still_a_refusal(self) -> None:
        """The one-word reversal, and the reason the sentence beneath the
        status line has to agree with it.

        A PDF rebuilt in transit drops characters. Drop "Not " from "Evidence
        on file: Not confirmed" and the status line now says the opposite of
        what the solicitor chose, while the sentence below it still says they
        declined. Reading the status alone would turn a refusal into an
        assertion to the LAA.
        """
        damaged = self.DECLINED.replace(
            "Evidence on file: Not confirmed", "Evidence on file: Confirmed"
        )
        self.assertIn("Evidence on file: Confirmed", damaged)
        self.assertIn("has not confirmed", damaged)
        self.assertFalse(extract_evidence_confirmation(damaged))

    def test_a_status_line_with_no_sentence_beneath_it_is_not_enough(self) -> None:
        stripped = self.CONFIRMED.replace(
            "The fee earner confirms that evidence supporting the matters set "
            "out above is held on the case file.\n",
            "",
        )
        self.assertFalse(extract_evidence_confirmation(stripped))

    def test_the_sentence_may_wrap_where_the_page_puts_the_break(self) -> None:
        """jsPDF wraps at the column width, so the break falls in a different
        place on every document. The sentence must still be found."""
        wrapped = self.CONFIRMED.replace(
            "The fee earner confirms that evidence supporting the matters set "
            "out above is held on the case file.",
            "The fee earner confirms that evidence\nsupporting the matters set "
            "out above is\nheld on the case file.",
        )
        self.assertTrue(extract_evidence_confirmation(wrapped))

    # A bare heading a solicitor pasted into their own prose. Built once and
    # used by two tests, because the damage it does has two halves: the
    # confirmation can be read from the wrong place, and — the half that is
    # easy to miss — the Stage 2 section can end at the pasted line, dropping
    # every criterion after it out of the bill.
    PASTED_BARE_HEADING = (
        "STAGE 2: LEVEL OF ENHANCEMENT FACTORS\n"
        "• Evidence marshalled with unusual skill\n"
        "Care and skill\n"
        "Explanation: My working note was headed as follows.\n"
        "EVIDENCE ON FILE\n"
        "That note listed the material relied on.\n"
        "• Particular care with a vulnerable client\n"
        "Care and skill\n"
        "Explanation: The client required substantial adaptations throughout.\n"
        "PROPOSED UPLIFT\n"
        "Proposed Uplift Percentage: 40%\n"
    )

    def test_the_heading_inside_a_solicitors_explanation_is_not_the_section(
        self,
    ) -> None:
        """A heading a solicitor pasted into their own prose must not be
        mistaken for the real one. It has no status line under it, so the
        search passes over it and finds the genuine section further down —
        where, before this was fixed, it would have stopped and reported a
        real confirmation as absent."""
        self.assertTrue(
            extract_evidence_confirmation(self.PASTED_BARE_HEADING + self.CONFIRMED)
        )

    def test_a_pasted_heading_does_not_cut_the_stage_2_section_short(self) -> None:
        """The other half, and the reason it is `SECTION_PATTERNS` that had to
        change rather than only the confirmation reader: a pasted heading used
        to end the Stage 2 section where it appeared, so every criterion below
        it vanished from the narrative — a weaker claim than the solicitor
        made, with nothing in the finished bill to show it."""
        criteria = extract_criteria(
            self.PASTED_BARE_HEADING + self.CONFIRMED,
            "stage2",
            label_to_key_lookup(),
            [],
        )
        self.assertEqual(len(criteria), 2)
        self.assertIn("s2_care_vulnerable_client", criteria)

    def test_a_damaged_real_section_does_not_fall_back_to_a_pasted_one(
        self,
    ) -> None:
        """Why the heading is found first and read second. Searching for the
        last *well-formed* block skipped a genuine section whose status line
        was damaged and settled on an intact copy higher up — so a refusal the
        solicitor made was overruled by wording they had pasted into a box.
        The last heading is the section; if it does not read cleanly the
        answer is no, not "look further up"."""
        pasted = (
            "STAGE 2: LEVEL OF ENHANCEMENT FACTORS\n"
            "• Evidence marshalled with unusual skill\n"
            "Care and skill\n"
            "Explanation: I copied the standard closing wording, which reads:\n"
            + self.CONFIRMED
        )
        damaged_real = self.DECLINED.replace(
            "Evidence on file: Not confirmed", "Evidence on fi1e: Not confirmed"
        )
        self.assertFalse(extract_evidence_confirmation(pasted + damaged_real))

    def test_a_pasted_confirmation_cannot_outrank_the_real_refusal(self) -> None:
        """Boilerplate or a previous summary pasted into an explanation can
        carry a complete, undamaged confirmation block. The genuine section is
        printed second from last, with only the disclaimer after it, so the
        last block in the document is the real one. Reading the first let a
        pasted "Confirmed" overrule a solicitor who declined."""
        pasted_block = (
            "STAGE 2: LEVEL OF ENHANCEMENT FACTORS\n"
            "• Evidence marshalled with unusual skill\n"
            "Care and skill\n"
            "Explanation: I copied the standard closing wording, which reads:\n"
            + self.CONFIRMED
        )
        document = pasted_block + self.DECLINED
        self.assertIn("Evidence on file: Confirmed", document)
        self.assertFalse(extract_evidence_confirmation(document))

    def test_confirmed_reads_as_true(self) -> None:
        self.assertTrue(extract_evidence_confirmation(self.CONFIRMED))

    def test_not_confirmed_reads_as_false(self) -> None:
        """The hazard the wording creates: 'Not confirmed' contains
        'confirmed', so a looser search would read a declined confirmation as
        a given one — the one direction this must never fail in."""
        self.assertFalse(extract_evidence_confirmation(self.DECLINED))

    def test_a_missing_section_reads_as_false(self) -> None:
        self.assertFalse(
            extract_evidence_confirmation("CASE DETAILS\nFee Earner:  Jane Doe\n")
        )

    def test_a_damaged_line_reads_as_false(self) -> None:
        """A PDF rebuilt in transit can lose or mangle characters. Unlike a
        criterion label, this is not routed to `unrecognised` and does not
        stop the run: a lost confirmation costs one sentence, and stopping
        every damaged file over it would train the reader to ignore stops."""
        damaged = self.CONFIRMED.replace(
            "Evidence on file: Confirmed", "Evidence on fi1e: Confirrned"
        )
        self.assertFalse(extract_evidence_confirmation(damaged))

    def test_the_word_alone_elsewhere_is_not_a_confirmation(self) -> None:
        prose = (
            "EVIDENCE ON FILE\n"
            "The fee earner has not confirmed anything. Confirmed matters are "
            "listed in the case file.\n"
            "DISCLAIMER\n"
        )
        self.assertFalse(extract_evidence_confirmation(prose))


class WrappedLabelTests(unittest.TestCase):
    """A label too long for one line of the PDF.

    Found on 4 August 2026 by ticking every Stage 1 label and extracting the
    result: twelve of thirteen came back, and the thirteenth — the longest —
    stopped the run. jsPDF had wrapped it onto a second line, marking the
    continuation in no way at all, and the reader took only the first line as
    the label and folded the rest into the category title. Any case ticking
    that one factor produced a PDF the narrator refused to process.
    """

    def setUp(self) -> None:
        self.label_keys = label_to_key_lookup()
        self.wrapping_label = next(
            (label for label in self.label_keys if len(label) > 100), ""
        )
        if not self.wrapping_label:
            self.skipTest("no label long enough to wrap")

    def _section(self, first: str, rest: str = "") -> str:
        return (
            "STAGE 1: THRESHOLD TEST SELECTIONS\n"
            f"• {first}\n"
            + (f"{rest}\n" if rest else "")
            + "Threshold limb (a): exceptional competence, skill or expertise\n"
            "PROPOSED UPLIFT\n"
        )

    def test_a_label_split_across_two_lines_is_rejoined(self) -> None:
        head, tail = self.wrapping_label[:98].rsplit(" ", 1)[0], ""
        tail = self.wrapping_label[len(head):].strip()
        unmatched: list[dict] = []
        result = extract_criteria(
            self._section(head, tail), "stage1", self.label_keys, unmatched
        )
        self.assertEqual(unmatched, [])
        self.assertEqual(
            list(result.values())[0]["label"], self.wrapping_label
        )
        # The continuation must not also survive in the category title.
        self.assertNotIn(tail, list(result.values())[0]["categoryTitle"])

    def test_damage_that_lands_on_a_real_label_from_the_other_stage_stops(
        self,
    ) -> None:
        """Exact matching stops a damaged label being repaired into something
        like it — but not from *being* something else. Drop the parenthetical
        from the legacy Stage 1 "Difficulty in taking instructions
        (client/witnesses)" and what remains is the current Stage 2 label word
        for word. Accepted, it would have filed a threshold factor as a level
        factor: a claim under a heading the solicitor never wrote, reported as
        a clean run."""
        stage2_label = next(
            label
            for label, key in self.label_keys.items()
            if key.startswith("s2_") and len(label) < 80
        )
        unmatched: list[dict] = []
        result = extract_criteria(
            self._section(stage2_label), "stage1", self.label_keys, unmatched
        )
        self.assertEqual(result, {})
        self.assertEqual(len(unmatched), 1)
        self.assertEqual(unmatched[0]["section"], "stage1")

    def test_rejoining_cannot_invent_a_label_that_was_never_ticked(self) -> None:
        """Joining is accepted only on an exact match, so a damaged label is
        still unmatched and still stops the run rather than being repaired
        into the nearest thing that fits."""
        head = self.wrapping_label[:98].rsplit(" ", 1)[0].replace("a", "@", 1)
        tail = self.wrapping_label[len(head):].strip()
        unmatched = []
        result = extract_criteria(
            self._section(head, tail), "stage1", self.label_keys, unmatched
        )
        self.assertEqual(result, {})
        self.assertEqual(len(unmatched), 1)

    def test_an_unwrapped_label_is_unaffected(self) -> None:
        short = next(
            label
            for label, key in self.label_keys.items()
            if len(label) < 60 and key.startswith("s1_")
        )
        unmatched = []
        result = extract_criteria(
            self._section(short), "stage1", self.label_keys, unmatched
        )
        self.assertEqual(unmatched, [])
        self.assertEqual(list(result.values())[0]["label"], short)


class CourtLineTests(unittest.TestCase):
    def test_a_case_name_containing_court_does_not_supply_the_court(self) -> None:
        """"Court:" is a substring a real matter name can contain. Before the
        pattern was anchored, this case name answered the court question."""
        block = (
            "CASE DETAILS\n"
            "Fee Earner:  Jane Doe\n"
            "Matter Type:  Care & Supervision\n"
            "Case / Matter Name:  High Court: Re X and Y\n"
            "Court:  Family Court or County Court\n"
            "PANEL MEMBERSHIP\n"
        )
        details = extract_case_details(block)
        self.assertEqual(details["courtLevel"], "Family Court or County Court")
        self.assertEqual(details["caseMatterName"], "High Court: Re X and Y")

    def test_a_case_name_too_long_for_one_line_is_rejoined(self) -> None:
        """Nothing limits the length of a matter name in the form, and it is
        the field that becomes {ITEM_OF_WORK} in the narrative. Read as one
        physical line, a long one put a truncated case identity into a
        document going to the LAA."""
        block = (
            "CASE DETAILS\n"
            "Fee Earner:  Jane Doe\n"
            "Matter Type:  Care & Supervision\n"
            "Case / Matter Name:  Re Y (synthetic) concerning the welfare\n"
            "arrangements of three children and a contested fact-finding\n"
            "hearing listed over five days\n"
            "Court:  High Court\n"
            "PANEL MEMBERSHIP\n"
        )
        details = extract_case_details(block)
        self.assertEqual(
            details["caseMatterName"],
            "Re Y (synthetic) concerning the welfare arrangements of three "
            "children and a contested fact-finding hearing listed over five days",
        )
        # The continuation must not bleed into the field printed after it.
        self.assertEqual(details["courtLevel"], "High Court")
        self.assertEqual(details["matterType"], "Care & Supervision")

    def test_a_wrapped_name_whose_continuation_looks_like_a_field(self) -> None:
        """The hard case, and the reason the fields are parsed in print order.
        A matter name reading "In the High Court: Re X and Y" wraps so that
        its second line opens with the label of a real field. Treating any
        such line as the next field truncated the name to "In the High" and
        made the court "Re X and Y" — the case identity that then appears in
        the narrative as {ITEM_OF_WORK}."""
        block = (
            "CASE DETAILS\n"
            "Fee Earner:  Jane Doe\n"
            "Matter Type:  Care & Supervision\n"
            "Case / Matter Name:  In the High\n"
            "Court: Re X and Y\n"
            "Court:  High Court\n"
            "PANEL MEMBERSHIP\n"
        )
        details = extract_case_details(block)
        self.assertEqual(details["caseMatterName"], "In the High Court: Re X and Y")
        self.assertEqual(details["courtLevel"], "High Court")
        self.assertEqual(details["feeEarnerName"], "Jane Doe")

    def test_a_continuation_cannot_replace_a_field_already_found(self) -> None:
        """The mirror of the case above, and the reason each field is searched
        only after the one before it. A matter name wrapping onto a line that
        begins "Fee Earner:" sits *below* the real fee earner. Taking the last
        candidate for every field emptied the fee earner entirely — losing a
        field that the older, cruder parser had read correctly."""
        block = (
            "CASE DETAILS\n"
            "Fee Earner:  Jane Doe\n"
            "Matter Type:  Care & Supervision\n"
            "Case / Matter Name:  In re the application of\n"
            "Fee Earner: Smith and Jones\n"
            "Court:  High Court\n"
            "PANEL MEMBERSHIP\n"
        )
        details = extract_case_details(block)
        self.assertEqual(details["feeEarnerName"], "Jane Doe")
        self.assertEqual(details["matterType"], "Care & Supervision")
        self.assertEqual(
            details["caseMatterName"],
            "In re the application of Fee Earner: Smith and Jones",
        )
        self.assertEqual(details["courtLevel"], "High Court")

    def test_a_pre_v111_case_name_containing_court_yields_no_court(self) -> None:
        block = (
            "CASE DETAILS\n"
            "Fee Earner:  Jane Doe\n"
            "Case / Matter Name:  High Court: Re X and Y\n"
            "PANEL MEMBERSHIP\n"
        )
        self.assertEqual(extract_case_details(block)["courtLevel"], "")


if __name__ == "__main__":
    unittest.main()
