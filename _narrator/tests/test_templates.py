"""Verify NARRATIVE_TEMPLATES and QUESTION_BLOCKS parse cleanly and stay in sync."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from templates import label_to_key_lookup, load_content_data  # noqa: E402


# Keys that intentionally don't have an individual narrative template — they're
# rendered together by the umbrella panel_membership template.
PANEL_KEYS = {
    "panel_membership_resolution",
    "panel_membership_children",
    "panel_membership_advanced",
}


class ContentDataTests(unittest.TestCase):
    def test_loads_both_constants(self) -> None:
        data = load_content_data()
        self.assertIn("narrative_templates", data)
        self.assertIn("question_blocks", data)
        self.assertGreater(len(data["narrative_templates"]), 30)
        self.assertEqual(len(data["question_blocks"]), 7)

    def test_every_explanation_checkbox_has_a_template(self) -> None:
        """Every checkbox flagged ``explanation: true`` must have its own
        NARRATIVE_TEMPLATES entry. Otherwise the skeleton can't render its bullet."""
        data = load_content_data()
        templates = data["narrative_templates"]
        missing = []
        for block in data["question_blocks"]:
            for chk in block.get("checkboxes", []):
                if not chk.get("explanation"):
                    continue
                if chk["key"] not in templates:
                    missing.append(chk["key"])
        self.assertEqual(missing, [], f"Checkboxes missing templates: {missing}")

    def test_panel_keys_share_umbrella_template(self) -> None:
        templates = load_content_data()["narrative_templates"]
        self.assertIn("panel_membership", templates)
        for k in PANEL_KEYS:
            self.assertNotIn(k, templates, f"{k} should not have its own template")

    def test_every_block_with_header_key_resolves(self) -> None:
        data = load_content_data()
        templates = data["narrative_templates"]
        for block in data["question_blocks"]:
            header_key = block.get("narrative_header_key")
            if header_key is None:
                continue
            self.assertIn(
                header_key, templates,
                f"Block {block.get('id')!r} references missing header template {header_key!r}",
            )

    def test_labels_are_unique(self) -> None:
        # label_to_key_lookup raises if a label collides; this just exercises it.
        lookup = label_to_key_lookup()
        # 31 checkboxes total; expect the same number of unique labels.
        self.assertEqual(len(lookup), 31)


if __name__ == "__main__":
    unittest.main()
