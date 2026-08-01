"""Verify the tool refuses to narrate a PDF it recovered nothing from.

Found in use on 1 August 2026: a PDF that yielded zero criteria still produced
a stub skeleton, still spent a model call on it, and still wrote a
citation-check reporting "1 citation dropped". That reads as a fault in the
narrative when the whole problem was in the PDF — and it buried the one fact
that mattered, which is that nothing was extracted at all.

These tests pin the two halves of the fix: the emptiness test itself, and the
requirement that the explanation names a cause and a remedy without leaking
any client text.
"""

import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import extract  # noqa: E402


def _sections(**matched):
    """A diagnose()-shaped sections dict; kwargs give the matched ones."""
    names = ("case_details", "panel_membership", "stage1", "stage2",
             "proposed_uplift", "disclaimer")
    out = {}
    for name in names:
        if name in matched:
            out[name] = {"matched": True, "bullet_lines": matched[name],
                         "explanation_markers": matched[name],
                         "block_chars": 100, "block_lines": 5, "start_offset": 0}
        else:
            out[name] = {"matched": False}
    return out


def _diag(raw_chars=2000, pages=2, **matched):
    return {
        "pdf": "case.pdf", "pages": pages, "per_page_chars": [raw_chars],
        "raw_chars": raw_chars, "normalised_chars": raw_chars,
        "header_matches": 1, "footer_matches": 1,
        "sections": _sections(**matched),
    }


class TestEmptinessTest(unittest.TestCase):
    def test_no_criteria_at_all_is_empty(self):
        self.assertTrue(extract.extraction_is_empty(
            {"caseDetails": {}, "panelMembership": {}, "stage1": {}, "stage2": {},
             "finalUpliftPercent": ""}
        ))

    def test_panel_and_uplift_alone_are_not_enough(self):
        """The criteria *are* the narrative. Without one there is nothing to say."""
        self.assertTrue(extract.extraction_is_empty(
            {"caseDetails": {"feeEarnerName": "A"}, "panelMembership": {"p": {}},
             "stage1": {}, "stage2": {}, "finalUpliftPercent": "50"}
        ))

    def test_stage1_alone_is_enough(self):
        self.assertFalse(extract.extraction_is_empty(
            {"stage1": {"k": {}}, "stage2": {}}
        ))

    def test_stage2_alone_is_enough(self):
        """Stage 2 without Stage 1 is odd but still has content to narrate."""
        self.assertFalse(extract.extraction_is_empty(
            {"stage1": {}, "stage2": {"k": {}}}
        ))


class TestExplanation(unittest.TestCase):
    """Every branch must name a cause and a fix, and leak no client text."""

    def _explain(self, diag):
        with mock.patch.object(extract, "diagnose", return_value=diag):
            return extract.explain_empty_extraction("case.pdf")

    def test_no_text_layer_is_called_a_scan(self):
        text = self._explain(_diag(raw_chars=0))
        self.assertIn("no text at all", text)
        self.assertIn("scanned", text)
        self.assertIn("Generate PDF Summary", text)

    def test_text_but_no_sections_blames_print_to_pdf(self):
        text = self._explain(_diag(raw_chars=5000))
        self.assertIn("does not look like an Uplift Collator PDF", text)
        self.assertIn("Print-to-PDF", text)

    def test_sections_present_but_nothing_ticked(self):
        text = self._explain(
            _diag(case_details=0, stage1=0, stage2=0, proposed_uplift=0)
        )
        self.assertIn("no criteria were ticked", text)
        self.assertIn("complete the questionnaire", text)

    def test_collator_pdf_without_stage_sections_suggests_an_old_version(self):
        text = self._explain(_diag(case_details=0, panel_membership=0))
        self.assertIn("older version", text)

    def test_ticks_present_but_labels_unmatched(self):
        text = self._explain(_diag(stage1=3, stage2=2))
        self.assertIn("unknown criterion label", text)
        self.assertIn("content-data.js", text)

    def test_every_branch_ends_with_a_fix(self):
        for diag in (
            _diag(raw_chars=0),
            _diag(raw_chars=5000),
            _diag(case_details=0, stage1=0, stage2=0),
            _diag(case_details=0, panel_membership=0),
            _diag(stage1=3, stage2=2),
        ):
            with self.subTest(diag=diag["sections"]):
                self.assertIn("Fix:", self._explain(diag))

    def test_no_client_text_can_reach_the_explanation(self):
        """diagnose() is the only input, and it carries structure alone.

        Guards the property the message rests on: it is printed to terminals
        and pasted into messages while triaging a real, privileged case PDF.
        """
        diag = _diag(raw_chars=5000)
        with mock.patch.object(extract, "diagnose", return_value=diag) as spy:
            extract.explain_empty_extraction("case.pdf")
        spy.assert_called_once()
        # Nothing but structural keys — no values, no explanations, no names.
        self.assertEqual(
            set(diag) - {"pdf", "pages", "per_page_chars", "raw_chars",
                         "normalised_chars", "header_matches", "footer_matches",
                         "sections"},
            set(),
        )


if __name__ == "__main__":
    unittest.main()
