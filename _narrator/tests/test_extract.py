"""End-to-end test: extract our fixture PDF and verify the recovered formData."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from extract import extract_evidence_confirmation, extract_formdata  # noqa: E402

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

    def test_a_pdf_from_before_the_question_existed_is_not_a_confirmation(self) -> None:
        """The fixture predates v1.11, so it carries no Evidence on File
        section. It must come back False rather than missing: skeleton.py
        reads the key directly, and the narrative sentence it gates is an
        assertion nobody made on this file."""
        self.assertIs(self.data["evidenceOnFileConfirmed"], False)

    def test_court_is_absent_from_a_pre_v111_pdf_without_breaking_the_rest(self) -> None:
        self.assertEqual(self.data["caseDetails"]["courtLevel"], "")


class EvidenceConfirmationTests(unittest.TestCase):
    """Read at the text level: building a PDF per case would test jsPDF, and
    what is under test is the reading of one line the app is known to print.

    The section body is what ``section_slice`` hands over, so each case here
    is the PDF text as ``extract_formdata`` sees it.
    """

    CONFIRMED = (
        "CASE DETAILS\nFee Earner:  Jane Doe\n"
        "EVIDENCE ON FILE\n"
        "Evidence on file: Confirmed\n"
        "The fee earner confirms that evidence supporting the matters set out "
        "above is held on the case file.\n"
        "DISCLAIMER\n"
    )
    DECLINED = CONFIRMED.replace(
        "Evidence on file: Confirmed",
        "Evidence on file: Not confirmed",
    ).replace(
        "The fee earner confirms that evidence supporting",
        "The fee earner has not confirmed that supporting evidence is held on "
        "the case file. The narrative will not assert that it is. Evidence "
        "supporting",
    )

    def test_confirmed_reads_as_true(self) -> None:
        self.assertTrue(extract_evidence_confirmation(self.CONFIRMED))

    def test_not_confirmed_reads_as_false(self) -> None:
        """The hazard the wording creates: 'Not confirmed' contains
        'confirmed', so a looser search would read a declined confirmation as
        a given one — the one direction this must never fail in."""
        self.assertFalse(extract_evidence_confirmation(self.DECLINED))

    def test_a_missing_section_reads_as_false(self) -> None:
        self.assertFalse(
            extract_evidence_confirmation("CASE DETAILS\nFee Earner:  Jane Doe\n")
        )

    def test_a_damaged_line_reads_as_false(self) -> None:
        """A PDF rebuilt in transit can lose or mangle characters. Unlike a
        criterion label, this is not routed to `unrecognised` and does not
        stop the run: a lost confirmation costs one sentence, and stopping
        every damaged file over it would train the reader to ignore stops."""
        damaged = self.CONFIRMED.replace(
            "Evidence on file: Confirmed", "Evidence on fi1e: Confirrned"
        )
        self.assertFalse(extract_evidence_confirmation(damaged))

    def test_the_word_alone_elsewhere_is_not_a_confirmation(self) -> None:
        prose = (
            "EVIDENCE ON FILE\n"
            "The fee earner has not confirmed anything. Confirmed matters are "
            "listed in the case file.\n"
            "DISCLAIMER\n"
        )
        self.assertFalse(extract_evidence_confirmation(prose))


if __name__ == "__main__":
    unittest.main()
