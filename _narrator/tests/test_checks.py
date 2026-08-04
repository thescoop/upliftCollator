"""Verify the deterministic citation/placeholder check.

This is the safety net that does not depend on the LLM or on the (editable)
prompt, so it carries the most weight of anything in the suite.

The cases are derived from `content-data.js` rather than from examples chosen
by hand. An earlier version of this suite passed 20 tests while the checker
was silently fail-open on `CAG Section 12.5 & 12.9`, because no test used the
citation forms that actually occur in the templates.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import checks  # noqa: E402
import templates  # noqa: E402

SKELETON = (
    "An enhancement of 75% is claimed reflecting CPR 44.4(3).\n"
    "**Panel Membership (CAG Section 12.20-12.23):**\n"
    "Exceptional competence (Spec Para 6.13(a) / CAG Section 12.8(a)) was shown.\n"
    "Level of enhancement (Spec Para 6.15 / CAG Section 12.5 & 12.9).\n"
    "Responsibility (CAG 12.9(a)) and care, speed and economy (CAG 12.9(b)).\n"
    "> Argued Re B-S (Children) [2013] EWCA Civ 1146 should govern.\n"
)


def _template_citations() -> list[str]:
    """Every citation appearing in the shipped narrative templates."""
    data = templates.load_content_data()
    found: list[str] = []
    for value in (data.get("narrative_templates") or {}).values():
        found.extend(checks.extract_citations(str(value)))
    return found


class TestAgainstRealTemplates(unittest.TestCase):
    """The regression that matters: exercise the real citation forms."""

    def test_templates_actually_contain_citations(self):
        # Guards the tests below from silently passing on an empty list.
        self.assertGreater(len(_template_citations()), 10)

    def test_every_template_citation_is_detected_whole(self):
        for citation in _template_citations():
            with self.subTest(citation=citation):
                self.assertEqual(checks.extract_citations(citation), [citation])

    def test_deleting_any_part_of_any_template_citation_is_caught(self):
        # Destructive mutation of each citation in turn: drop the last
        # whitespace-separated token and confirm the check refuses it.
        for citation in set(_template_citations()):
            parts = citation.split()
            if len(parts) < 2:
                continue
            damaged = " ".join(parts[:-1])
            with self.subTest(citation=citation):
                result = checks.check(citation, damaged)
                self.assertFalse(result.ok, f"{citation!r} -> {damaged!r} passed")

    def test_compound_citation_is_one_citation(self):
        # The specific fail-open found in review on 30 July 2026.
        self.assertEqual(
            checks.extract_citations("Spec Para 6.15 / CAG Section 12.5 & 12.9"),
            ["Spec Para 6.15", "CAG Section 12.5 & 12.9"],
        )

    def test_dropping_the_second_half_of_a_compound_is_caught(self):
        result = checks.check(SKELETON, SKELETON.replace(" & 12.9", ""))
        self.assertFalse(result.ok)
        self.assertIn("CAG Section 12.5 & 12.9", result.dropped_citations)
        self.assertIn("CAG Section 12.5", result.added_citations)


class TestExtractCitations(unittest.TestCase):
    def test_finds_every_citation_form(self):
        found = checks.extract_citations(SKELETON)
        for expected in (
            "CPR 44.4(3)",
            "CAG Section 12.20-12.23",
            "Spec Para 6.13(a)",
            "CAG Section 12.8(a)",
            "CAG Section 12.5 & 12.9",
            "CAG 12.9(a)",
            "CAG 12.9(b)",
        ):
            self.assertIn(expected, found, f"missing {expected}")

    def test_repeats_are_kept(self):
        # De-duplicating hid a real loss: a citation attached to one criterion
        # can vanish while the same reference survives elsewhere.
        found = checks.extract_citations("CPR 44.4(3) and again CPR 44.4(3).")
        self.assertEqual(found, ["CPR 44.4(3)", "CPR 44.4(3)"])

    def test_case_citation_year_is_not_a_citation(self):
        self.assertEqual(checks.extract_citations("Re B-S [2013] EWCA Civ 1146"), [])

    def test_sentence_final_full_stop_does_not_break_a_citation(self):
        self.assertEqual(checks.extract_citations("as set out in CAG 12.4."), ["CAG 12.4"])

    def test_base64_noise_is_not_mistaken_for_a_citation(self):
        # content-data.js embeds base64 images; "CPReGn47..." must not match.
        self.assertEqual(checks.extract_citations("CPReGn47dIZ3u2lwh"), [])


class TestBoundaries(unittest.TestCase):
    def test_invented_subparagraph_is_a_different_citation(self):
        result = checks.check("See CAG 12.9(a).", "See CAG 12.9(a)(ii).")
        self.assertFalse(result.ok)
        self.assertIn("CAG 12.9(a)", result.dropped_citations)
        self.assertIn("CAG 12.9(a)(ii)", result.added_citations)

    def test_deeper_section_number_is_a_different_citation(self):
        self.assertFalse(checks.check("CAG Section 12.8", "CAG Section 12.8(a)").ok)

    def test_dropping_one_of_two_occurrences_is_caught(self):
        result = checks.check("CPR 44.4(3) x2: CPR 44.4(3)", "CPR 44.4(3) only once")
        self.assertFalse(result.ok)
        self.assertEqual(result.dropped_citations, ["CPR 44.4(3)"])


class TestPlaceholders(unittest.TestCase):
    def test_template_cues_are_drawn_from_the_templates(self):
        cues = checks.known_placeholders()
        self.assertGreater(len(cues), 5)
        self.assertTrue(all(c.startswith("[") and c.endswith("]") for c in cues))

    def test_an_unfilled_template_cue_is_found(self):
        cue = sorted(checks.known_placeholders())[0]
        self.assertIn(cue, checks.find_placeholders(f"Knowledge of {cue} was applied."))

    def test_lowercase_extraction_fallbacks_are_found(self):
        # Produced by prompts.py when a case field is missing; the earlier
        # all-caps-only pattern missed them and the run passed as safe.
        found = checks.find_placeholders("claimed by [fee earner] in [case] at [uplift %]")
        self.assertEqual(found, ["[fee earner]", "[case]", "[uplift %]"])

    def test_law_report_year_is_not_a_placeholder(self):
        self.assertEqual(checks.find_placeholders("Re B-S (Children) [2013] EWCA Civ 1146"), [])

    def test_anonymised_party_is_not_a_placeholder(self):
        # Real solicitor prose anonymises parties as [A], [B], [X].
        self.assertEqual(checks.find_placeholders("the mother [A] and father [B] agreed"), [])

    def test_ordinary_bracketed_prose_is_not_a_placeholder(self):
        self.assertEqual(checks.find_placeholders("the mother [and the father] agreed"), [])


class TestCheck(unittest.TestCase):
    def test_clean_polish_passes(self):
        result = checks.check(SKELETON, SKELETON)
        self.assertTrue(result.ok, checks.format_report(result))
        self.assertEqual(result.verdict, "SAFE TO REVIEW")

    def test_dropped_citation_is_caught(self):
        result = checks.check(SKELETON, SKELETON.replace("CAG 12.9(b)", ""))
        self.assertFalse(result.ok)
        self.assertIn("CAG 12.9(b)", result.dropped_citations)
        self.assertEqual(result.verdict, "NEEDS REVISION")

    def test_invented_citation_is_caught(self):
        result = checks.check(SKELETON, SKELETON + "\nSee also CAG Section 99.1.\n")
        self.assertIn("CAG Section 99.1", result.added_citations)
        self.assertFalse(result.ok)

    def test_unfilled_placeholder_blocks_the_verdict(self):
        cue = sorted(checks.known_placeholders())[0]
        result = checks.check(SKELETON, SKELETON + f"\n{cue}\n")
        self.assertFalse(result.ok)
        self.assertIn(cue, result.placeholders)

    def test_whitespace_and_case_differences_are_tolerated(self):
        self.assertEqual(checks.check("CPR 44.4(3)", "cpr  44.4(3)").dropped_citations, [])


class TestReport(unittest.TestCase):
    def test_clean_report_states_all_preserved(self):
        report = checks.format_report(checks.check(SKELETON, SKELETON))
        self.assertIn("citations preserved", report)
        self.assertIn("SAFE TO REVIEW", report)

    def test_failing_report_names_the_dropped_citation(self):
        report = checks.format_report(checks.check(SKELETON, SKELETON.replace("CPR 44.4(3)", "")))
        self.assertIn("CPR 44.4(3)", report)
        self.assertIn("NEEDS REVISION", report)


if __name__ == "__main__":
    unittest.main()
