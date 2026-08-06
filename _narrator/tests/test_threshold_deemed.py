"""The deemed-threshold route: Spec Para 7.23(a) with nothing ticked at Stage 1.

A fee earner on one of the three family panels may claim an enhancement without
asserting any Stage 1 threshold factor, because Spec Para 7.23(a) provides that
for a relevant panel member "the threshold test at Paragraph 6.13 shall be
deemed to be satisfied in respect of that work". Added 6 August 2026, when the
tool was changed to handle that situation internally instead of telling the
solicitor to telephone the firm.

What makes it dangerous, and what most of this file is about: it turns
"Stage 1 section is empty" from a shape the form refused to produce into a
*legitimate* document. Before that change, `extract.extract_criteria` returned
`{}` both for the empty-Stage-1 sentinel and for a Stage 1 section that was
missing entirely, `extraction_is_empty` passed on Stage 2 alone, and
`skeleton.build_skeleton` appended its Stage 1 section only if there was one —
so a narrative with Stage 2 factors and no threshold statement of any kind
rendered without complaint. Harmless while no such PDF could exist; a silent
route to an unfounded claim the moment one could.

So "deemed" is never inferred from absence. It is read from a line that must be
present, and cross-checked against two other things the document says.
"""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from extract import (  # noqa: E402
    deemed_threshold_support,
    extract_threshold_deemed,
    load_formdata_json,
    threshold_coherence_error,
)
from skeleton import build_skeleton  # noqa: E402

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_formdata.json"

DEEMED_LINE = "Threshold test: deemed satisfied by panel membership (Spec Para 7.23(a))."

PANEL = {
    "panel_membership_resolution": {
        "checked": True,
        "label": "Resolution Accredited Specialist Panel",
    }
}

STAGE2 = {
    "s2_resp_no_counsel_advocacy": {
        "checked": True,
        "label": "Advocacy without counsel",
        "categoryTitle": "Degree of responsibility",
        "explanation": (
            "The fee earner conducted the advocacy at the contested interim "
            "hearing, which would ordinarily have been briefed to counsel."
        ),
    }
}

STAGE1 = {
    "s1_circ_legal_issues": {
        "checked": True,
        "label": "The legal, expert or other evidential issues were exceptionally complex",
        "categoryTitle": "Threshold limb (c): exceptional circumstances or complexity",
    }
}


def _formdata(**overrides) -> dict:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    data.setdefault("caseDetails", {})["feeEarnerName"] = "A. Solicitor"
    data["panelMembership"] = PANEL
    data["stage1"] = {}
    data["stage2"] = STAGE2
    data["thresholdDeemed"] = True
    data.update(overrides)
    return data


class ExtractDeemedLineTests(unittest.TestCase):
    """Reading the line, and refusing to read it from the wrong place."""

    def _pdf_text(self, stage1_body: str) -> str:
        # The section headings extract.py keys on, in document order.
        return (
            "CASE DETAILS\n"
            "Fee Earner: A. Solicitor\n\n"
            "PANEL MEMBERSHIP\n"
            "•  Resolution Accredited Specialist Panel\n\n"
            "STAGE 1: THRESHOLD TEST SELECTIONS\n"
            f"{stage1_body}\n\n"
            "STAGE 2: LEVEL OF ENHANCEMENT FACTORS\n"
            "•  Advocacy without counsel\n"
            "Degree of responsibility\n"
            "Explanation: The fee earner conducted the advocacy.\n\n"
            "PROPOSED UPLIFT\n"
            "Proposed Uplift Percentage: 40 %\n"
        )

    def test_reads_the_line_when_present(self) -> None:
        text = self._pdf_text(
            f"No Stage 1 threshold factors selected.\n{DEEMED_LINE}"
        )
        self.assertTrue(extract_threshold_deemed(text))

    def test_absent_line_reads_as_not_deemed(self) -> None:
        text = self._pdf_text("No Stage 1 threshold factors selected.")
        self.assertFalse(extract_threshold_deemed(text))

    def test_tolerates_the_wrap_the_generator_may_introduce(self) -> None:
        """jsPDF broke a line at the column width and marked it in no way at all.

        Legacy-PDF path. The line measured 363.2pt against a 495.28pt column
        (per the retired measure_pdf_labels.js) and so should not wrap — but
        "should not" is what was believed about the vulnerable-client label
        too, and that produced a PDF the narrator refused to process for every
        claim ticking it. PDFs already in live matters keep this tolerance
        forever; the .docx format cannot wrap at all.
        """
        wrapped = DEEMED_LINE.replace("by panel", "by\npanel")
        text = self._pdf_text(f"No Stage 1 threshold factors selected.\n{wrapped}")
        self.assertTrue(extract_threshold_deemed(text))

    def test_ignores_the_line_pasted_into_a_stage_2_explanation(self) -> None:
        """Bounded to Stage 1, for the reason EVIDENCE ON FILE had to be.

        A solicitor who pastes a previous summary into an explanation box must
        not thereby assert a contractual entitlement they never claimed.
        """
        text = (
            "CASE DETAILS\n"
            "Fee Earner: A. Solicitor\n\n"
            "PANEL MEMBERSHIP\n"
            "•  Resolution Accredited Specialist Panel\n\n"
            "STAGE 1: THRESHOLD TEST SELECTIONS\n"
            "No Stage 1 threshold factors selected.\n\n"
            "STAGE 2: LEVEL OF ENHANCEMENT FACTORS\n"
            "•  Advocacy without counsel\n"
            "Degree of responsibility\n"
            f"Explanation: Note to file - {DEEMED_LINE}\n\n"
            "PROPOSED UPLIFT\n"
            "Proposed Uplift Percentage: 40 %\n"
        )
        self.assertFalse(extract_threshold_deemed(text))


class DeemedSupportTests(unittest.TestCase):
    """Three statements must agree. Any one of them alone is not enough."""

    def test_all_three_present_is_supported(self) -> None:
        self.assertIsNone(deemed_threshold_support(_formdata()))

    def test_line_without_a_panel_tick_is_refused(self) -> None:
        """The worst shape this guard exists for.

        A document whose panel section is empty but whose deemed line survived
        would otherwise produce a narrative asserting panel membership for a fee
        earner on no panel. The LAA can check that against the public registers,
        so it is a checkable false statement over the solicitor's name — and it
        is the same failure as the PANEL MEMBERSHIP section guard, which is the
        costliest defect this project has had.
        """
        reason = deemed_threshold_support(_formdata(panelMembership={}))
        self.assertIsNotNone(reason)
        self.assertIn("no panel is ticked", reason)

    def test_line_without_a_fee_earner_name_is_refused(self) -> None:
        """CAG 12.22: the narrative "must clearly state the fee-earner for whom
        the enhancement is claimed and the basis for the enhancement"."""
        data = _formdata()
        data["caseDetails"]["feeEarnerName"] = "   "
        reason = deemed_threshold_support(data)
        self.assertIsNotNone(reason)
        self.assertIn("names no fee earner", reason)

    def test_panel_and_name_without_the_line_is_refused(self) -> None:
        """Deemed is never inferred from panel membership plus an empty Stage 1.

        This is the inference that would make an absent or damaged Stage 1
        section look like an entitlement.
        """
        reason = deemed_threshold_support(_formdata(thresholdDeemed=False))
        self.assertIsNotNone(reason)
        self.assertIn("does not carry the deemed-threshold line", reason)


class CoherenceStopTests(unittest.TestCase):
    def test_stage2_with_no_threshold_basis_stops(self) -> None:
        reason = threshold_coherence_error(_formdata(thresholdDeemed=False))
        self.assertIsNotNone(reason)
        self.assertIn("no threshold basis", reason)

    def test_a_supported_deemed_claim_proceeds(self) -> None:
        self.assertIsNone(threshold_coherence_error(_formdata()))

    def test_an_ordinary_stage1_claim_proceeds(self) -> None:
        data = _formdata(stage1=STAGE1, thresholdDeemed=False, panelMembership={})
        self.assertIsNone(threshold_coherence_error(data))

    def test_an_empty_document_is_left_to_extraction_is_empty(self) -> None:
        """Two stops competing over one document produce the worse message."""
        data = _formdata(stage2={}, thresholdDeemed=False)
        self.assertIsNone(threshold_coherence_error(data))


class SkeletonTests(unittest.TestCase):
    def test_build_skeleton_refuses_the_incoherent_shape(self) -> None:
        """The rule lives in build_skeleton, not only in the two front ends.

        Every entry point passes through here — the CLI, --from-json, the GUI's
        independent pipeline, and skeleton.py's own __main__. Guarding the front
        ends instead means guarding four places and finding out later that it
        went into three, which has happened twice in this project.
        """
        with self.assertRaises(ValueError) as caught:
            build_skeleton(_formdata(thresholdDeemed=False))
        self.assertIn("no threshold basis", str(caught.exception))

    def test_deemed_narrative_states_the_basis_and_names_the_fee_earner(self) -> None:
        md = build_skeleton(_formdata())
        self.assertIn("deemed to be satisfied", md)
        self.assertIn("Spec Para 7.23(a)", md)
        self.assertIn("A. Solicitor", md)
        self.assertIn("Resolution Accredited Specialist Panel", md)

    def test_deemed_narrative_opens_on_the_entitlement(self) -> None:
        """Not on the admission that no factor is asserted.

        Both are true; leading with the admission is bad advocacy for no gain in
        honesty, since the absence is evident the moment an assessor looks for
        the list. The absence is still stated, later in the paragraph.
        """
        md = build_skeleton(_formdata())
        # Past the bold heading, which carries its own "Spec Para 6.13" and so
        # cannot be split on a full stop.
        body = md.split("**LAA Threshold Test", 1)[1].split("\n", 1)[1]
        opening, _, rest = body.partition(". ")
        self.assertIn("deemed to be satisfied", opening)
        self.assertNotIn("not on any", opening)
        self.assertIn("not on any of the threshold factors", rest)

    def test_deemed_intro_confines_the_claim_to_the_named_fee_earner(self) -> None:
        """Spec Para 7.23's chapeau confines the deeming to that person's work,
        and CAG 12.22 excludes supervision and other fee earners outright. On a
        bill with a second fee earner an unqualified claim would cover work the
        deeming never reached."""
        md = build_skeleton(_formdata())
        self.assertIn("carried out by A. Solicitor", md)

    def test_ticked_stage1_uses_the_ordinary_threshold_paragraph(self) -> None:
        """A document with both a deemed line and ticked factors states its
        threshold the ordinary way. Asserted factors beat a contractual
        presumption in front of an assessor, so the stronger paragraph wins."""
        md = build_skeleton(_formdata(stage1=STAGE1))
        self.assertIn("The work meets the threshold for enhancement because", md)
        self.assertNotIn("deemed to be satisfied", md)
        self.assertNotIn("carried out by A. Solicitor", md)


class FromJsonFailClosedTests(unittest.TestCase):
    """`--from-json` on a hand-edited file is a supported recovery workflow, so
    these are ordinary typo paths rather than hostile input."""

    def _write(self, data: dict) -> Path:
        import tempfile

        tmp = Path(tempfile.mkdtemp()) / "narrative-input.json"
        tmp.write_text(json.dumps(data), encoding="utf-8")
        return tmp

    def test_a_bogus_stage1_entry_is_rejected(self) -> None:
        """Until 6 August 2026 only the section wrapper was checked, so
        {"stage1": {"anything": "at all"}} was a *truthy* Stage 1 section and
        every "is Stage 1 empty?" test in the narrator read it as a threshold."""
        data = _formdata(stage1={"s1_circ_legal_issues": "yes"})
        with self.assertRaises(ValueError) as caught:
            load_formdata_json(self._write(data))
        self.assertIn("not an object", str(caught.exception))

    def test_an_entry_without_a_label_is_rejected(self) -> None:
        data = _formdata(stage1={"s1_circ_legal_issues": {"checked": True}})
        with self.assertRaises(ValueError) as caught:
            load_formdata_json(self._write(data))
        self.assertIn("no usable 'label'", str(caught.exception))

    def test_a_non_boolean_deemed_flag_is_rejected(self) -> None:
        """Truthiness would let the string "false" assert an entitlement."""
        data = _formdata(thresholdDeemed="false")
        with self.assertRaises(ValueError) as caught:
            load_formdata_json(self._write(data))
        self.assertIn("must be true or false", str(caught.exception))

    def test_a_well_formed_file_still_loads(self) -> None:
        loaded = load_formdata_json(self._write(_formdata()))
        self.assertTrue(loaded["thresholdDeemed"])
        self.assertIsNone(deemed_threshold_support(loaded))


if __name__ == "__main__":
    unittest.main()
