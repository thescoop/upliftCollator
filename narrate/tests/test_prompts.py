"""Verify the assembled LM Studio prompt has the expected structure."""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prompts import assemble_prompt  # noqa: E402
from skeleton import build_skeleton  # noqa: E402

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_formdata.json"


class PromptAssemblyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        formdata = json.loads(FIXTURE.read_text())
        skeleton = build_skeleton(formdata)
        case_meta = formdata["caseDetails"] | {
            "finalUpliftPercent": formdata.get("finalUpliftPercent", "")
        }
        cls.prompt = assemble_prompt(skeleton, case_meta)

    def test_has_clearly_marked_blocks(self) -> None:
        self.assertIn("--- SYSTEM PROMPT ---", self.prompt)
        self.assertIn("--- USER MESSAGE ---", self.prompt)

    def test_contains_safety_rules(self) -> None:
        # Critical phrasing from the system prompt
        self.assertIn("Preserve every legal citation exactly", self.prompt)
        self.assertIn("Never invent or alter facts", self.prompt)

    def test_case_meta_substituted(self) -> None:
        self.assertIn("Jane Doe", self.prompt)
        self.assertIn("Public Law Children", self.prompt)
        self.assertIn("Re X (Local Authority care proceedings)", self.prompt)
        self.assertIn("75", self.prompt)

    def test_skeleton_embedded(self) -> None:
        self.assertIn("---SKELETON---", self.prompt)
        self.assertIn("---END SKELETON---", self.prompt)
        # And the actual skeleton content
        self.assertIn("Spec Para 6.13(a)", self.prompt)


if __name__ == "__main__":
    unittest.main()
