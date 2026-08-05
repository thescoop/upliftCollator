"""A limb "other" ticked at Stage 1 with nothing at Stage 2 explaining it.

The three "other" labels assert only that the work was exceptional in a respect
CAG 12.8's examples do not cover. The Stage 2 paragraph is the only place that
says what the respect was, so a document carrying one without the other tells
the LAA that the detail follows and then does not give it.

The form refuses to produce that. This covers the paths that do not go through
the form: `--from-json` on a hand-edited file, and any PDF produced before the
form learned to stop it.

Found by review on 5 August 2026, after the guard had been reported as working
on the strength of testing the Stage 2 box ticked-and-blank — never unticked.
"""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from extract import unevidenced_other_factors  # noqa: E402
from templates import load_content_data  # noqa: E402

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_formdata.json"


def _formdata(stage1: dict, stage2: dict) -> dict:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    data["stage1"] = stage1
    data["stage2"] = stage2
    return data


S1_OTHER = {
    "s1_circ_other": {
        "checked": True,
        "label": "The case involved exceptional circumstances or complexity in some other way",
        "categoryTitle": "Threshold limb (c): exceptional circumstances or complexity",
    }
}


class UnevidencedOtherTests(unittest.TestCase):
    def test_an_other_with_no_stage2_at_all_is_reported(self) -> None:
        gaps = unevidenced_other_factors(_formdata(S1_OTHER, {}))
        self.assertEqual(len(gaps), 1)
        self.assertIn("in some other way", gaps[0])

    def test_an_other_whose_carrier_has_an_empty_explanation_is_reported(self) -> None:
        """The carrier being present is not enough — it is the words that
        evidence the claim, and a hand-edited JSON can carry an empty string."""
        gaps = unevidenced_other_factors(_formdata(S1_OTHER, {
            "s2_complexity_other": {
                "checked": True,
                "label": "Exceptional circumstances or complexity of some other kind",
                "explanation": "   ",
            }
        }))
        self.assertEqual(len(gaps), 1)

    def test_an_explained_carrier_satisfies_it(self) -> None:
        gaps = unevidenced_other_factors(_formdata(S1_OTHER, {
            "s2_complexity_other": {
                "checked": True,
                "label": "Exceptional circumstances or complexity of some other kind",
                "explanation": "Three sets of concurrent proceedings ran in two jurisdictions.",
            }
        }))
        self.assertEqual(gaps, [])

    def test_a_named_threshold_label_needs_no_carrier(self) -> None:
        """Only the "other" labels are guarded. A named one says something on
        its own, and a solicitor may legitimately rely on it for the threshold
        without arguing it again for the level."""
        gaps = unevidenced_other_factors(_formdata({
            "s1_cse_detailed_knowledge": {
                "checked": True,
                "label": "Applied unusually detailed knowledge relevant to this case",
            }
        }, {}))
        self.assertEqual(gaps, [])

    def test_every_other_label_is_flagged_in_content_data(self) -> None:
        """The guard is data-driven. If a fourth "other" is added without
        `requires_stage2`, it silently escapes the check — so the flag is
        asserted here against the labels themselves rather than by key."""
        blocks = load_content_data()["question_blocks"]
        stage1 = [
            chk for block in blocks if block.get("page") == 2
            for chk in block.get("checkboxes", [])
        ]
        others = [c for c in stage1 if "in some other way" in c["label"]]
        self.assertEqual(len(others), 3, "expected one 'other' per threshold limb")
        for chk in others:
            with self.subTest(key=chk["key"]):
                self.assertTrue(
                    chk.get("requires_stage2"),
                    f"{chk['key']} is an 'other' label but is not flagged "
                    "requires_stage2, so nothing stops it reaching the LAA bare",
                )

    def test_each_flagged_label_has_a_carrier_that_can_satisfy_it(self) -> None:
        """A `requires_stage2` key with no Stage 2 carrier would be
        unsatisfiable — the solicitor could never get past the gate."""
        blocks = load_content_data()["question_blocks"]
        demanding = [
            chk["key"] for block in blocks if block.get("page") == 2
            for chk in block.get("checkboxes", []) if chk.get("requires_stage2")
        ]
        self.assertTrue(demanding)
        for key in demanding:
            carriers = [
                chk["key"] for block in blocks if block.get("page") == 3
                for chk in block.get("checkboxes", [])
                if key in (chk.get("carried_from") or [])
            ]
            with self.subTest(key=key):
                self.assertTrue(carriers, f"{key} demands Stage 2 but nothing carries it")


if __name__ == "__main__":
    unittest.main()
