"""Pre-v1.11 PDFs remain a strict, end-to-end extraction contract.

The browser prints checkbox labels into the PDF, so a wording change is a data
migration even though no database is involved. This fixture is entirely
synthetic and exercises every historical label in LEGACY_LABEL_ALIASES through
the same text extraction, key resolution and skeleton rendering path as a live
submission.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from extract import extract_criteria  # noqa: E402
from skeleton import build_skeleton  # noqa: E402
from templates import (  # noqa: E402
    label_to_key_lookup,
    legacy_label_aliases,
    load_content_data,
)


def _stage_text(stage: str, labels: list[tuple[str, str]]) -> str:
    heading = {
        "stage1": "STAGE 1: THRESHOLD TEST SELECTIONS",
        "stage2": "STAGE 2: LEVEL OF ENHANCEMENT FACTORS",
    }[stage]
    criteria = []
    for label, key in labels:
        criteria.append(
            f"•  {label}\n"
            f"Synthetic pre-v1.11 category for {key}\n"
            f"Explanation: Synthetic explanation for {key}."
        )
    return f"{heading}\n" + "\n".join(criteria) + "\nPROPOSED UPLIFT\n"


class LegacyPdfCompatibilityTests(unittest.TestCase):
    def test_every_pre_v111_label_extracts_and_renders(self) -> None:
        aliases = legacy_label_aliases()
        # 41 since 5 August 2026: the pre-relabel Children Panel string joined
        # the contract when "(and work relates to children)" was dropped.
        self.assertEqual(len(aliases), 41, "the historical contract was truncated")

        label_keys = label_to_key_lookup()
        unrecognised: list[dict] = []
        by_stage = {
            stage: [
                (label, key)
                for label, key in aliases.items()
                if key.startswith(prefix)
            ]
            for stage, prefix in (("stage1", "s1_"), ("stage2", "s2_"))
        }
        extracted = {
            stage: extract_criteria(
                _stage_text(stage, labels), stage, label_keys, unrecognised
            )
            for stage, labels in by_stage.items()
        }

        self.assertEqual(unrecognised, [])
        for stage, labels in by_stage.items():
            self.assertEqual(
                set(extracted[stage]),
                {key for _, key in labels},
                f"not every historical {stage} label resolved",
            )

        formdata = {
            "caseDetails": {
                "feeEarnerName": "Synthetic Fee Earner",
                "matterType": "Synthetic family matter",
                "caseMatterName": "Synthetic case",
            },
            "panelMembership": {},
            "stage1": extracted["stage1"],
            "stage2": extracted["stage2"],
            "finalUpliftPercent": "50",
        }
        narrative = build_skeleton(formdata)
        self.assertIn("Synthetic family matter: Synthetic case", narrative)
        self.assertNotIn("Evidence supporting these assertions", narrative)

        # Resolution alone is not enough: every resolved historical criterion
        # must survive assembly. Retired templates are especially vulnerable
        # because their keys no longer appear in QUESTION_BLOCKS.
        narrative_templates = load_content_data()["narrative_templates"]
        for key in aliases.values():
            # Panel keys are excluded here and covered by the test below
            # instead: they are not Stage 1/Stage 2 criteria, they never appear
            # in these two sections, and all three render through the umbrella
            # `panel_membership` template rather than one of their own.
            if key.startswith("panel_membership_"):
                continue
            expected = narrative_templates[key].replace(
                "{USER_EXPLANATION}",
                f"\n\n> Synthetic explanation for {key}.\n",
            )
            with self.subTest(key=key):
                self.assertIn(expected.strip(), narrative)

    def test_a_pre_relabel_panel_membership_still_extracts_and_renders(self) -> None:
        """The Children Panel label lost "(and work relates to children)" on
        5 August 2026. That parenthetical is printed into every PDF produced
        before then, so it has to survive the whole path — not just resolve to a
        key, but come back out in the narrative as the solicitor's document
        stated it."""
        from extract import extract_panel  # local: mirrors the module under test

        legacy_label = (
            "Fee earner is on Law Society Children Panel "
            "(and work relates to children)"
        )
        text = (
            "PANEL MEMBERSHIP\n"
            f"•  {legacy_label}\n"
            "STAGE 1: THRESHOLD TEST SELECTIONS\n"
        )
        unrecognised: list[dict] = []
        panel = extract_panel(text, label_to_key_lookup(), unrecognised)

        self.assertEqual(unrecognised, [])
        self.assertIn("panel_membership_children", panel)
        self.assertEqual(panel["panel_membership_children"]["label"], legacy_label)

        narrative = build_skeleton({
            "caseDetails": {
                "feeEarnerName": "Synthetic Fee Earner",
                "matterType": "Synthetic family matter",
                "caseMatterName": "Synthetic case",
            },
            "panelMembership": panel,
            "stage1": {},
            "stage2": {},
            "finalUpliftPercent": "50",
        })
        self.assertIn(
            "member of the Law Society Children Panel "
            "(and work relates to children)",
            narrative,
        )
        # The unsourced scope qualifier must not reappear even on this path.
        self.assertNotIn("falls within the scope", narrative)


if __name__ == "__main__":
    unittest.main()
