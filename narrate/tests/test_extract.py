"""End-to-end test: extract our fixture PDF and verify the recovered formData."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from extract import extract_formdata  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures"


class ExtractFromFixturePdfTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.data = extract_formdata(FIXTURES / "sample.pdf")

    def test_case_details(self) -> None:
        cd = self.data["caseDetails"]
        self.assertEqual(cd["feeEarnerName"], "Jane Doe")
        self.assertEqual(cd["matterType"], "Care & Supervision")
        self.assertEqual(cd["caseMatterName"], "Re X (Local Authority care proceedings)")

    def test_panel_membership(self) -> None:
        pm = self.data["panelMembership"]
        self.assertIn("panel_membership_resolution", pm)
        self.assertIn("panel_membership_children", pm)
        self.assertNotIn("panel_membership_advanced", pm)

    def test_stage1_keys_and_explanations(self) -> None:
        s1 = self.data["stage1"]
        self.assertEqual(
            set(s1.keys()),
            {"s1_cse_detailed_knowledge", "s1_cse_marshalling_evidence", "s1_circ_expert_evidence"},
        )
        # Verbatim solicitor text must round-trip exactly.
        self.assertIn("Re B-S (Children) [2013] EWCA Civ 1146", s1["s1_cse_detailed_knowledge"]["explanation"])
        self.assertIn("1,400 pages", s1["s1_cse_marshalling_evidence"]["explanation"])
        # Em-dash preservation
        self.assertIn("—", s1["s1_circ_expert_evidence"]["explanation"])

    def test_stage2_keys(self) -> None:
        s2 = self.data["stage2"]
        self.assertEqual(
            set(s2.keys()),
            {"s2_resp_no_counsel_drafting", "s2_cse_care_vulnerable_client"},
        )
        self.assertIn(
            "Scott Schedule",
            s2["s2_resp_no_counsel_drafting"]["explanation"],
        )

    def test_uplift_percent(self) -> None:
        self.assertEqual(self.data["finalUpliftPercent"], "75")


if __name__ == "__main__":
    unittest.main()
