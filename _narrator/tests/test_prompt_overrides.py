"""Verify the two-layer prompt system: shipped defaults vs committed overrides.

Every test restores the original state, so a run never leaves a stray override
behind in prompts/custom/ — which, being committed, would otherwise become a
silent change to how every future case is polished.
"""

import shutil
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import prompts  # noqa: E402


class PromptOverrideTestCase(unittest.TestCase):
    def setUp(self):
        self._backup = None
        if prompts.CUSTOM_DIR.exists():
            self._backup = prompts.CUSTOM_DIR.with_name("custom.testbackup")
            shutil.rmtree(self._backup, ignore_errors=True)
            shutil.move(str(prompts.CUSTOM_DIR), str(self._backup))

    def tearDown(self):
        shutil.rmtree(prompts.CUSTOM_DIR, ignore_errors=True)
        if self._backup:
            shutil.move(str(self._backup), str(prompts.CUSTOM_DIR))


class TestResolution(PromptOverrideTestCase):
    def test_defaults_are_used_when_no_override_exists(self):
        self.assertFalse(prompts.is_customised())
        self.assertEqual(prompts.template_path("system.md").parent, prompts.PROMPTS_DIR)

    def test_override_wins_when_present(self):
        prompts.enable_customisation()
        (prompts.CUSTOM_DIR / "system.md").write_text("MY RULES", encoding="utf-8")

        self.assertTrue(prompts.is_customised())
        self.assertEqual(prompts.template_path("system.md").parent, prompts.CUSTOM_DIR)
        self.assertEqual(prompts.system_prompt(), "MY RULES")

    def test_shipped_default_is_never_modified(self):
        original = (prompts.PROMPTS_DIR / "system.md").read_text(encoding="utf-8")
        prompts.enable_customisation()
        (prompts.CUSTOM_DIR / "system.md").write_text("MY RULES", encoding="utf-8")
        self.assertEqual((prompts.PROMPTS_DIR / "system.md").read_text(encoding="utf-8"), original)


class TestEnableAndRestore(PromptOverrideTestCase):
    def test_enable_seeds_copies_of_both_editable_templates(self):
        paths = prompts.enable_customisation()
        self.assertEqual(len(paths), len(prompts.EDITABLE_TEMPLATES))
        for path in paths:
            self.assertTrue(path.is_file())
            self.assertEqual(
                path.read_text(encoding="utf-8"),
                (prompts.PROMPTS_DIR / path.name).read_text(encoding="utf-8"),
            )

    def test_enable_never_clobbers_existing_edits(self):
        prompts.enable_customisation()
        (prompts.CUSTOM_DIR / "system.md").write_text("MY RULES", encoding="utf-8")
        prompts.enable_customisation()  # re-opening for editing must not reset
        self.assertEqual(prompts.system_prompt(), "MY RULES")

    def test_restore_removes_overrides_and_returns_to_defaults(self):
        prompts.enable_customisation()
        (prompts.CUSTOM_DIR / "system.md").write_text("MY RULES", encoding="utf-8")

        removed = prompts.restore_defaults()

        self.assertIn("system.md", removed)
        self.assertFalse(prompts.is_customised())
        self.assertNotEqual(prompts.system_prompt(), "MY RULES")

    def test_restore_is_safe_when_nothing_is_customised(self):
        self.assertEqual(prompts.restore_defaults(), [])


class TestAssembly(PromptOverrideTestCase):
    CASE = {
        "feeEarnerName": "Jane Doe",
        "matterType": "Care & Supervision",
        "caseMatterName": "Re X",
        "finalUpliftPercent": "75",
    }

    def test_user_message_substitutes_case_fields_and_skeleton(self):
        message = prompts.user_message("SKELETON BODY", self.CASE)
        for expected in ("Jane Doe", "Care & Supervision", "Re X", "75", "SKELETON BODY"):
            self.assertIn(expected, message)
        self.assertNotIn("{{", message)

    def test_missing_case_fields_degrade_to_labels(self):
        message = prompts.user_message("BODY", {})
        self.assertIn("[fee earner]", message)
        self.assertNotIn("{{", message)

    def test_assembled_audit_prompt_reflects_the_override(self):
        prompts.enable_customisation()
        (prompts.CUSTOM_DIR / "system.md").write_text("MY RULES", encoding="utf-8")
        # The audit record must show what was actually sent, not the default.
        self.assertIn("MY RULES", prompts.assemble_prompt("BODY", self.CASE))

    def test_verification_prompt_excludes_the_surrounding_documentation(self):
        system = prompts.verification_system_prompt()
        self.assertIn("forensic checker", system.lower())
        self.assertNotIn("Use this prompt as a *separate* chat", system)

    def test_verification_user_message_delimits_both_documents(self):
        message = prompts.verification_user_message("SKEL", "POLISHED")
        self.assertIn("---SKELETON---", message)
        self.assertIn("---POLISHED NARRATIVE---", message)
        self.assertIn("SKEL", message)
        self.assertIn("POLISHED", message)


if __name__ == "__main__":
    unittest.main()
