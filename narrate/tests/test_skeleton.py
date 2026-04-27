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

    def test_every_solicitor_explanation_appears_verbatim(self) -> None:
        for section in ("stage1", "stage2"):
            for item in self.formdata[section].values():
                explanation = item["explanation"]
                # Compare ignoring leading/trailing whitespace; explanation appears
                # in a Markdown blockquote so each line starts with "> ".
                # The substantive content is preserved as-is.
                self.assertIn(explanation, self.markdown)

    def test_all_expected_citations_present(self) -> None:
        for citation in [
            "CPR 44.4(3)",
            "CAG Section 12.20-12.23",
            "Spec Para 6.13",
            "CAG Section 12.4",
            "Spec Para 6.13(a)",
            "CAG Section 12.8.1",
            "Spec Para 6.13(c)",
            "CAG Section 12.8.3",
            "Spec Para 6.15",
            "CAG 12.9(a)",
            "CAG 12.9(b)",
        ]:
            self.assertIn(citation, self.markdown, f"missing citation: {citation}")

    def test_blockquote_format(self) -> None:
        # At least every solicitor explanation should be preceded by a blockquote marker.
        self.assertGreater(len(re.findall(r"^> ", self.markdown, re.MULTILINE)), 4)

    def test_concluding_paragraph_present(self) -> None:
        self.assertIn("rendered the work exceptionally demanding", self.markdown)
        self.assertIn("Evidence supporting these assertions", self.markdown)


if __name__ == "__main__":
    unittest.main()
