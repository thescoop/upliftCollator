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

    def test_the_heading_inside_a_solicitors_explanation_is_not_the_section(
        self,
    ) -> None:
        """A heading a solicitor pasted into their own prose must not be
        mistaken for the real one. It has no status line under it, so the
        search passes over it and finds the genuine section further down —
        where, before this was fixed, it would have stopped and reported a
        real confirmation as absent."""
        pasted = (
            "STAGE 2: LEVEL OF ENHANCEMENT FACTORS\n"
            "• Evidence marshalled with unusual skill\n"
            "Care\n"
            "Explanation: My working note was headed as follows.\n"
            "EVIDENCE ON FILE\n"
            "That note listed the material relied on.\n"
            "PROPOSED UPLIFT\n"
            "Proposed Uplift Percentage: 40%\n"
        ) + self.CONFIRMED
        self.assertTrue(extract_evidence_confirmation(pasted))

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
        short = next(label for label in self.label_keys if len(label) < 60)
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
