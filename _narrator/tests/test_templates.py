"""Verify NARRATIVE_TEMPLATES and QUESTION_BLOCKS parse cleanly and stay in sync."""

import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import templates as templates_module  # noqa: E402
from templates import (  # noqa: E402
    label_to_key_lookup,
    legacy_label_aliases,
    load_content_data,
)


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
        # One panel block, three threshold limbs and the seven CAG 12.9 factors.
        self.assertEqual(len(data["question_blocks"]), 11)

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
        # 32 live labels plus all 28 distinct pre-v1.11 labels.
        self.assertEqual(len(lookup), 60)

    def test_all_legacy_aliases_are_loaded_and_renderable(self) -> None:
        aliases = legacy_label_aliases()
        narrative_templates = load_content_data()["narrative_templates"]
        self.assertEqual(len(aliases), 28)
        self.assertEqual(set(aliases.values()) - set(narrative_templates), set())

    def test_retired_legacy_keys_remain_in_narrative_templates(self) -> None:
        data = load_content_data()
        live_keys = {
            checkbox["key"]
            for block in data["question_blocks"]
            for checkbox in block.get("checkboxes", [])
        }
        retired_keys = set(legacy_label_aliases().values()) - live_keys
        self.assertEqual(len(retired_keys), 12)
        self.assertLessEqual(retired_keys, set(data["narrative_templates"]))

    def test_a_live_legacy_collision_names_both_keys(self) -> None:
        live_label = (
            "Applied unusually detailed knowledge of the law or procedure "
            "relevant to this case"
        )
        legacy_key = "s1_cse_difficult_argument"
        with mock.patch.object(
            templates_module,
            "legacy_label_aliases",
            return_value={live_label: legacy_key},
        ):
            with self.assertRaises(ValueError) as raised:
                label_to_key_lookup()
        message = str(raised.exception)
        self.assertIn("s1_cse_detailed_knowledge", message)
        self.assertIn(legacy_key, message)

    def test_an_agreeing_legacy_duplicate_keeps_the_live_mapping(self) -> None:
        live_label = (
            "Applied unusually detailed knowledge of the law or procedure "
            "relevant to this case"
        )
        live_key = "s1_cse_detailed_knowledge"
        with mock.patch.object(
            templates_module,
            "legacy_label_aliases",
            return_value={live_label: live_key},
        ):
            self.assertEqual(label_to_key_lookup()[live_label], live_key)


if __name__ == "__main__":
    unittest.main()
