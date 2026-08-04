"""Verify the assembled skeleton contains every citation and verbatim explanation."""

import json
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from skeleton import build_skeleton  # noqa: E402

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_formdata.json"


class SkeletonContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.formdata = json.loads(FIXTURE.read_text())
        cls.markdown = build_skeleton(cls.formdata)

    def test_intro_substitutes_uplift_and_matter(self) -> None:
        self.assertIn("75%", self.markdown)
        self.assertIn("Public Law Children", self.markdown)

    def test_panel_section_lists_both_panels(self) -> None:
        self.assertIn("Resolution Accredited Specialist Panel", self.markdown)
        self.assertIn("Law Society Children Panel", self.markdown)

    def test_stage1_is_tick_only_and_has_no_blank_blockquotes(self) -> None:
        self.assertTrue(
            all("explanation" not in item for item in self.formdata["stage1"].values())
        )
        self.assertNotIn("\n>\n", self.markdown)
        self.assertNotIn("{USER_EXPLANATION}", self.markdown)

    def test_every_stage2_explanation_appears_verbatim(self) -> None:
        for item in self.formdata["stage2"].values():
            self.assertIn(item["explanation"], self.markdown)

    def test_all_expected_citations_present(self) -> None:
        for citation in [
            "CPR 44.4(3)",
            "CAG Section 12.20-12.23",
            "Spec Para 6.13",
            "CAG Section 12.4",
            "Spec Para 6.13(a)",
            "CAG Section 12.8(a)",
            "Spec Para 6.13(c)",
            "CAG Section 12.8(c)",
            "Spec Para 6.15",
            "CAG 12.9(a)",
            "CAG 12.9(b)(i)",
        ]:
            self.assertIn(citation, self.markdown, f"missing citation: {citation}")

    def test_blockquote_format(self) -> None:
        # Stage 2 still carries each solicitor explanation as a blockquote;
        # Stage 1 is now tick-only and must contribute none.
        self.assertEqual(
            len(re.findall(r"^> ", self.markdown, re.MULTILINE)),
            len(self.formdata["stage2"]),
        )

    def test_concluding_paragraph_present(self) -> None:
        self.assertIn("made the work exceptional", self.markdown)
        self.assertIn("Evidence supporting these assertions", self.markdown)

    def test_optional_responsibility_block_can_be_absent(self) -> None:
        formdata = json.loads(FIXTURE.read_text())
        formdata["stage2"].pop("s2_resp_no_counsel_drafting")
        markdown = build_skeleton(formdata)

        self.assertNotIn("Degree of responsibility accepted", markdown)
        self.assertIn("**Care** (CAG 12.9(b)(i))", markdown)
        self.assertTrue(
            markdown.endswith(
                "Evidence supporting these assertions can be found within the case file."
            )
        )


if __name__ == "__main__":
    unittest.main()
