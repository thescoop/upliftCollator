"""Verify the deterministic citation/placeholder check.

This is the safety net that does not depend on the LLM or on the (editable)
prompt, so it carries the most weight of anything in the suite.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import checks  # noqa: E402

SKELETON = (
    "An enhancement of 75% is claimed reflecting CPR 44.4(3).\n"
    "**Panel Membership (CAG Section 12.20-12.23):**\n"
    "Exceptional competence (Spec Para 6.13(a) / CAG Section 12.8.1) was shown.\n"
    "Complexity (Spec Para 6.13(c) / CAG Section 12.8.3) arose.\n"
    "Responsibility (CAG 12.9(a)) and care, speed and economy (CAG 12.9(b)).\n"
    "- Knowledge of [SPECIFY AREA OF KNOWLEDGE/CASE ASPECT] was applied.\n"
    "> Argued Re B-S (Children) [2013] EWCA Civ 1146 should govern.\n"
)


class TestExtractCitations(unittest.TestCase):
    def test_finds_every_citation_form(self):
        found = checks.extract_citations(SKELETON)
        for expected in (
            "CPR 44.4(3)",
            "CAG Section 12.20-12.23",
            "Spec Para 6.13(a)",
            "CAG Section 12.8.1",
            "Spec Para 6.13(c)",
            "CAG Section 12.8.3",
            "CAG 12.9(a)",
            "CAG 12.9(b)",
        ):
            self.assertIn(expected, found, f"missing {expected}")

    def test_deduplicates(self):
        found = checks.extract_citations("CPR 44.4(3) and again CPR 44.4(3).")
        self.assertEqual(found, ["CPR 44.4(3)"])

    def test_case_citation_year_is_not_a_citation(self):
        # "[2013] EWCA Civ 1146" is a law report reference, not a CAG/Spec/CPR one.
        self.assertEqual(checks.extract_citations("Re B-S [2013] EWCA Civ 1146"), [])


class TestPlaceholders(unittest.TestCase):
    def test_finds_template_placeholders(self):
        found = checks.find_placeholders(
            "Knowledge of [SPECIFY EVIDENCE] and [NUMBER] experts in [FIELD(S)]."
        )
        self.assertEqual(found, ["[SPECIFY EVIDENCE]", "[NUMBER]", "[FIELD(S)]"])

    def test_ignores_law_report_years(self):
        # The regression that matters: a real case citation in a solicitor's
        # explanation must never be reported as an unfilled placeholder.
        self.assertEqual(checks.find_placeholders("Re B-S (Children) [2013] EWCA Civ 1146"), [])

    def test_ignores_ordinary_bracketed_prose(self):
        self.assertEqual(checks.find_placeholders("the mother [and the father] agreed"), [])


class TestCheck(unittest.TestCase):
    def test_clean_polish_passes(self):
        polished = SKELETON.replace("[SPECIFY AREA OF KNOWLEDGE/CASE ASPECT]", "FPR amendments")
        result = checks.check(SKELETON, polished)
        self.assertTrue(result.ok)
        self.assertEqual(result.verdict, "SAFE TO REVIEW")

    def test_dropped_citation_is_caught(self):
        polished = SKELETON.replace("CAG 12.9(b)", "").replace(
            "[SPECIFY AREA OF KNOWLEDGE/CASE ASPECT]", "FPR amendments"
        )
        result = checks.check(SKELETON, polished)
        self.assertFalse(result.ok)
        self.assertIn("CAG 12.9(b)", result.dropped_citations)
        self.assertEqual(result.verdict, "NEEDS REVISION")

    def test_invented_citation_is_caught(self):
        polished = SKELETON.replace(
            "[SPECIFY AREA OF KNOWLEDGE/CASE ASPECT]", "FPR amendments"
        ) + "\nSee also CAG Section 99.1.\n"
        result = checks.check(SKELETON, polished)
        self.assertIn("CAG Section 99.1", result.added_citations)
        self.assertFalse(result.ok)

    def test_unfilled_placeholder_blocks_the_verdict(self):
        result = checks.check(SKELETON, SKELETON)  # placeholder never filled
        self.assertFalse(result.ok)
        self.assertIn("[SPECIFY AREA OF KNOWLEDGE/CASE ASPECT]", result.placeholders)

    def test_whitespace_and_case_differences_are_tolerated(self):
        polished = "cpr  44.4(3)"
        result = checks.check("CPR 44.4(3)", polished)
        self.assertEqual(result.dropped_citations, [])


class TestReport(unittest.TestCase):
    def test_clean_report_states_all_preserved(self):
        polished = SKELETON.replace("[SPECIFY AREA OF KNOWLEDGE/CASE ASPECT]", "FPR")
        report = checks.format_report(checks.check(SKELETON, polished))
        self.assertIn("citations preserved", report)
        self.assertIn("SAFE TO REVIEW", report)

    def test_failing_report_names_the_dropped_citation(self):
        polished = SKELETON.replace("CPR 44.4(3)", "")
        report = checks.format_report(checks.check(SKELETON, polished))
        self.assertIn("CPR 44.4(3)", report)
        self.assertIn("NEEDS REVISION", report)


if __name__ == "__main__":
    unittest.main()
