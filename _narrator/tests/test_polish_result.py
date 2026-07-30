"""Verify the pipeline's verdict aggregation and report.

Independent review on 30 July 2026 found that an LLM second opinion reporting
NEEDS REVISION had no effect: the CLI still exited 0 and the GUI still showed
green, because the verdict came from the citation count alone. The report file
could therefore contain two contradictory verdicts.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import checks  # noqa: E402
import polish  # noqa: E402

CLEAN = checks.CheckResult(skeleton_citations=["CPR 44.4(3)"])
DIRTY = checks.CheckResult(
    skeleton_citations=["CPR 44.4(3)"], dropped_citations=["CPR 44.4(3)"]
)

LLM_CLEAN = "## Verdict\n\nSAFE TO REVIEW\n"
LLM_FLAGGED = "## Fact check\n\nDate changed.\n\n## Verdict\n\nNEEDS REVISION\n"


def _result(check, llm="", error="", requested=None):
    return polish.PolishResult(
        polished="a narrative", model="m", check=check,
        llm_verification=llm, verification_error=error,
        verification_was_requested=bool(llm or error) if requested is None else requested,
    )


class TestVerdict(unittest.TestCase):
    def test_both_clean_is_safe(self):
        self.assertTrue(_result(CLEAN, LLM_CLEAN).ok)
        self.assertEqual(_result(CLEAN, LLM_CLEAN).verdict, "SAFE TO REVIEW")

    def test_a_semantic_finding_overrides_a_clean_citation_count(self):
        result = _result(CLEAN, LLM_FLAGGED)
        self.assertTrue(result.deterministic_ok)
        self.assertFalse(result.semantic_ok)
        self.assertFalse(result.ok)
        self.assertEqual(result.verdict, "NEEDS REVISION")

    def test_a_dropped_citation_fails_regardless_of_the_llm(self):
        self.assertFalse(_result(DIRTY, LLM_CLEAN).ok)

    def test_a_requested_verification_that_failed_is_not_a_pass(self):
        # Preserving the narrative and passing it are separate decisions. An
        # earlier version kept the narrative (right) and also called it SAFE TO
        # REVIEW (wrong) when verification errored.
        result = _result(CLEAN, "", error="LMStudioError: server stopped", requested=True)
        self.assertFalse(result.semantic_ok)
        self.assertFalse(result.ok)
        self.assertIn("FAILED to run", result.verdict_detail)
        self.assertEqual(result.polished, "a narrative")  # still preserved

    def test_skipped_verification_leaves_the_deterministic_verdict(self):
        # --no-verify: the user chose not to ask, which is not a finding.
        self.assertTrue(_result(CLEAN).ok)

    def test_an_unreadable_llm_verdict_fails_closed(self):
        self.assertFalse(_result(CLEAN, "some prose with no verdict section",
                                 requested=True).ok)

    def test_a_self_contradictory_report_fails_closed(self):
        contradictory = "## Verdict\n\nSAFE TO REVIEW and also NEEDS REVISION\n"
        self.assertFalse(_result(CLEAN, contradictory, requested=True).ok)

    def test_a_discussion_of_the_phrase_outside_the_verdict_is_ignored(self):
        report = (
            "## Fact check\n\nNothing that would justify NEEDS REVISION.\n"
            "\n## Verdict\n\nSAFE TO REVIEW\n"
        )
        self.assertTrue(_result(CLEAN, report, requested=True).ok)

    def test_an_empty_narrative_is_never_ok(self):
        result = polish.PolishResult(polished="", check=CLEAN)
        self.assertFalse(result.ok)

    def test_verdict_detail_names_the_llm_finding(self):
        self.assertIn("LLM review flagged", _result(CLEAN, LLM_FLAGGED).verdict_detail)


class TestFullReport(unittest.TestCase):
    def test_the_overall_verdict_comes_last(self):
        report = polish.format_full_report(_result(CLEAN, LLM_FLAGGED))
        self.assertLess(report.index("LLM second opinion"), report.index("Overall verdict"))

    def test_a_flagged_review_produces_a_needs_revision_overall(self):
        report = polish.format_full_report(_result(CLEAN, LLM_FLAGGED))
        self.assertIn("## Overall verdict", report)
        self.assertTrue(report.rstrip().endswith(
            f"NEEDS REVISION — {_result(CLEAN, LLM_FLAGGED).verdict_detail}"
        ))

    def test_a_failed_review_is_recorded_rather_than_hidden(self):
        report = polish.format_full_report(_result(CLEAN, "", error="ValueError: bad markers"))
        self.assertIn("Did not run: ValueError: bad markers", report)


if __name__ == "__main__":
    unittest.main()
