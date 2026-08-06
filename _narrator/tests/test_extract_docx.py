"""The .docx extraction contract, end to end and under attack.

The fixtures are built by ``build_docx_fixture.js`` with the real browser
generator and labels read live from ``content-data.js`` — so these tests hold
the actual shipped round trip, not a Python imitation of it. Regenerate with::

    node _narrator/tests/build_docx_fixture.js

The adversarial cases matter most. The docx format's whole justification
(_PLAN.md, "THE .DOCX OUTPUT") is that two PDF defect classes cannot occur:
labels cannot wrap into unmatchable fragments, and pasted text cannot imitate
structure. ``nasty.docx`` carries a pasted block containing a fake DISCLAIMER
heading, a fake EVIDENCE ON FILE confirmation, a real Stage 1 label on its
own line and a fake uplift percentage — every one must stay inert inside the
explanation that carries it.
"""

from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from docx import Document

import extract
import extract_docx
from templates import load_content_data

FIXTURES = Path(__file__).resolve().parent / "fixtures"
SAMPLE = FIXTURES / "sample.docx"
DEEMED = FIXTURES / "deemed.docx"
NASTY = FIXTURES / "nasty.docx"


def _current_label(key: str) -> str:
    for block in load_content_data()["question_blocks"]:
        for chk in block.get("checkboxes", []):
            if chk["key"] == key:
                return chk["label"]
    raise KeyError(key)


def _rewrite_paragraph(doc_path: Path, old_text: str, new_text: str) -> Path:
    """Copy a fixture with one paragraph's text replaced — a document someone
    edited in Word, which is the only way a Collator docx changes at all."""
    tmp = Path(tempfile.mkdtemp()) / doc_path.name
    shutil.copy(doc_path, tmp)
    doc = Document(str(tmp))
    for para in doc.paragraphs:
        if para.text == old_text:
            for run in para.runs:
                run.text = ""
            para.runs[0].text = new_text
            break
    else:
        raise AssertionError(f"paragraph not found: {old_text!r}")
    doc.save(str(tmp))
    return tmp


class TestSampleRoundTrip(unittest.TestCase):
    """The ordinary route: everything written is everything read."""

    @classmethod
    def setUpClass(cls):
        cls.data = extract.extract_formdata(SAMPLE)

    def test_case_details_come_back_whole(self):
        self.assertEqual(self.data["caseDetails"], {
            "feeEarnerName": "Jane Doe",
            "matterType": "Public Law Children",
            "caseMatterName": "Re X (Local Authority care proceedings)",
            "courtLevel": "County Court",
        })

    def test_all_sections_resolve_to_their_keys(self):
        self.assertEqual(sorted(self.data["panelMembership"]),
                         ["panel_membership_children", "panel_membership_resolution"])
        self.assertEqual(sorted(self.data["stage1"]),
                         ["s1_circ_legal_issues", "s1_cse_detailed_knowledge",
                          "s1_cse_marshalling_evidence"])
        self.assertEqual(sorted(self.data["stage2"]),
                         ["s2_care_vulnerable_client", "s2_resp_no_counsel_drafting"])

    def test_labels_are_the_current_wording(self):
        """A v1.13 document carries v1.13 labels — never legacy aliases."""
        for section in ("stage1", "stage2"):
            for key, entry in self.data[section].items():
                with self.subTest(key=key):
                    self.assertEqual(entry["label"], _current_label(key))

    def test_explanations_round_trip_exactly(self):
        exp = self.data["stage2"]["s2_care_vulnerable_client"]["explanation"]
        self.assertTrue(exp.startswith("Client has diagnosed PTSD"))
        self.assertTrue(exp.endswith("intermediary to the FHDRA."))

    def test_scalars(self):
        self.assertEqual(self.data["finalUpliftPercent"], "75")
        self.assertTrue(self.data["evidenceOnFileConfirmed"])
        self.assertFalse(self.data["thresholdDeemed"])
        self.assertNotIn("unrecognised", self.data)

    def test_category_titles_are_the_block_titles(self):
        self.assertEqual(
            self.data["stage1"]["s1_circ_legal_issues"]["categoryTitle"],
            "Threshold limb (c): exceptional circumstances or complexity",
        )


class TestDeemedRoute(unittest.TestCase):
    """Stage 1 empty + panel + the deemed line: the v1.12 route, in .docx."""

    @classmethod
    def setUpClass(cls):
        cls.data = extract.extract_formdata(DEEMED)

    def test_deemed_is_affirmatively_extracted(self):
        self.assertEqual(self.data["stage1"], {})
        self.assertTrue(self.data["thresholdDeemed"])

    def test_the_cross_check_passes(self):
        self.assertIsNone(extract.deemed_threshold_support(self.data))

    def test_the_narrative_is_coherent(self):
        self.assertIsNone(extract.threshold_coherence_error(self.data))

    def test_without_the_panel_the_claim_fails(self):
        stripped = dict(self.data, panelMembership={})
        self.assertIsNotNone(extract.deemed_threshold_support(stripped))


class TestPasteImmunity(unittest.TestCase):
    """nasty.docx: pasted structure-lookalikes must all stay inert."""

    @classmethod
    def setUpClass(cls):
        cls.data = extract.extract_formdata(NASTY)

    def test_nothing_is_unrecognised(self):
        self.assertNotIn("unrecognised", self.data)

    def test_the_pasted_block_stays_inside_its_explanation(self):
        exp = self.data["stage2"]["s2_complexity_legal_issues"]["explanation"]
        for line in ("DISCLAIMER", "EVIDENCE ON FILE",
                     "Evidence on file: Confirmed",
                     "STAGE 2: LEVEL OF ENHANCEMENT FACTORS"):
            with self.subTest(line=line):
                self.assertIn(line, exp)

    def test_a_pasted_real_label_creates_no_tick(self):
        """The pasted '•  Applied unusually detailed knowledge…' line is text
        in a paragraph, not a paragraph — so Stage 2 gains no second entry and
        Stage 1's genuine tick is the only one."""
        self.assertEqual(list(self.data["stage2"]), ["s2_complexity_legal_issues"])
        self.assertEqual(list(self.data["stage1"]), ["s1_cse_detailed_knowledge"])

    def test_a_pasted_confirmation_cannot_confirm_evidence(self):
        self.assertFalse(self.data["evidenceOnFileConfirmed"])

    def test_a_pasted_percentage_cannot_replace_the_real_one(self):
        self.assertEqual(self.data["finalUpliftPercent"], "40")

    def test_a_matter_name_imitating_the_court_field_stays_whole(self):
        """The exact trap that forced the PDF reader's longest-run logic."""
        self.assertEqual(
            self.data["caseDetails"]["caseMatterName"],
            "In the High Court: Re X and Y (a very long synthetic matter name)",
        )
        self.assertEqual(self.data["caseDetails"]["courtLevel"], "High Court")

    def test_the_control_character_arrived_as_a_space(self):
        exp = self.data["stage2"]["s2_complexity_legal_issues"]["explanation"]
        self.assertIn("The vertical tab above", exp)
        self.assertNotIn("\x0b", exp)


class TestFormatDispatch(unittest.TestCase):
    """Content decides the reader; the extension is only a fallback."""

    def test_magic_bytes(self):
        self.assertEqual(extract.detect_format(SAMPLE), "docx")
        self.assertEqual(extract.detect_format(FIXTURES / "sample.pdf"), "pdf")

    def test_a_renamed_docx_still_reads_as_docx(self):
        tmp = Path(tempfile.mkdtemp()) / "misnamed.pdf"
        shutil.copy(SAMPLE, tmp)
        self.assertEqual(extract.detect_format(tmp), "docx")
        data = extract.extract_formdata(tmp)
        self.assertEqual(data["finalUpliftPercent"], "75")

    def test_garbage_falls_back_to_the_extension(self):
        tmp = Path(tempfile.mkdtemp())
        garbage_docx = tmp / "x.docx"
        garbage_docx.write_bytes(b"\x00\x01not a real file")
        self.assertEqual(extract.detect_format(garbage_docx), "docx")
        garbage_pdf = tmp / "x.pdf"
        garbage_pdf.write_bytes(b"\x00\x01not a real file")
        self.assertEqual(extract.detect_format(garbage_pdf), "pdf")


class TestEditedDocuments(unittest.TestCase):
    """A Collator docx only changes by being edited in Word. Every damage
    reading must fail closed — the same discipline as the PDF path."""

    def test_a_cross_section_label_is_refused(self):
        """A Stage 1 label edited into Stage 2 resolves to a key from the
        wrong stage, which must read as damage — never be refiled."""
        s1_label = _current_label("s1_cse_marshalling_evidence")
        edited = _rewrite_paragraph(
            SAMPLE,
            "•  " + _current_label("s2_care_vulnerable_client"),
            "•  " + s1_label,
        )
        data = extract.extract_formdata(edited)
        self.assertNotIn("s1_cse_marshalling_evidence", data["stage2"])
        unrecognised = data.get("unrecognised") or []
        self.assertTrue(
            any(u["section"] == "stage2" and u["label"] == s1_label
                for u in unrecognised),
            unrecognised,
        )

    def test_a_criterion_label_under_panel_membership_is_refused(self):
        """The costliest misread the PDF path ever had: a criterion accepted
        as a panel membership asserts a guaranteed 15% (CAG 12.20)."""
        s1_label = _current_label("s1_cse_detailed_knowledge")
        edited = _rewrite_paragraph(
            SAMPLE,
            "•  " + _current_label("panel_membership_resolution"),
            "•  " + s1_label,
        )
        data = extract.extract_formdata(edited)
        self.assertNotIn("s1_cse_detailed_knowledge", data["panelMembership"])
        self.assertTrue(any(
            u["section"] == "panelMembership" for u in data.get("unrecognised", [])
        ))

    def test_a_damaged_evidence_sentence_reads_as_not_confirmed(self):
        edited = _rewrite_paragraph(
            SAMPLE,
            "The fee earner confirms that evidence supporting the matters set "
            "out above is held on the case file.",
            "The fee earner says something else entirely.",
        )
        self.assertFalse(extract.extract_formdata(edited)["evidenceOnFileConfirmed"])

    def test_a_damaged_status_line_reads_as_not_confirmed(self):
        edited = _rewrite_paragraph(
            SAMPLE, "Evidence on file: Confirmed", "Evidence on file: Confirmd"
        )
        self.assertFalse(extract.extract_formdata(edited)["evidenceOnFileConfirmed"])

    def test_the_deemed_line_is_refused_outside_stage_1(self):
        """The sentence pasted as its own paragraph into Stage 2 — a shape
        only an edited document can have — must not assert the deeming."""
        deemed_line = ("Threshold test: deemed satisfied by panel membership "
                       "(Spec Para 7.23(a)).")
        # "Care" is the category paragraph under the vulnerable-client factor —
        # a Stage 2 paragraph, which is the point: the sentence must only
        # count inside Stage 1.
        edited = _rewrite_paragraph(SAMPLE, "Care", deemed_line)
        self.assertFalse(extract.extract_formdata(edited)["thresholdDeemed"])

    def test_an_edited_label_stops_the_run_with_a_named_nearest(self):
        real = _current_label("s1_cse_marshalling_evidence")
        edited = _rewrite_paragraph(SAMPLE, "•  " + real,
                                    "•  " + real.replace("unusual", "unusal"))
        data = extract.extract_formdata(edited)
        self.assertNotIn("s1_cse_marshalling_evidence", data["stage1"])
        match = [u for u in data["unrecognised"] if u["section"] == "stage1"]
        self.assertEqual(len(match), 1)
        self.assertEqual(match[0]["nearest"], real)


# Every key diagnose_docx may return. Its output is printed and pasted while
# triaging real, privileged case documents, so it must be structural or
# software names only — never a field value, an explanation, or a client name.
ALLOWED_DIAGNOSE_KEYS = {
    "docx", "readable", "failure", "paragraphs", "raw_chars", "creator",
    "last_modified_by", "created", "modified", "rewritten_after_seconds",
    "made_by_the_app", "sections",
}
ALLOWED_SECTION_KEYS = {
    "matched", "paragraph_index", "block_paragraphs", "bullet_lines",
    "explanation_markers",
}


class TestDiagnostics(unittest.TestCase):
    def test_diagnose_reports_structure_only(self):
        d = extract.diagnose(SAMPLE)
        self.assertLessEqual(set(d), ALLOWED_DIAGNOSE_KEYS, set(d))
        for name, sec in d["sections"].items():
            with self.subTest(section=name):
                self.assertLessEqual(set(sec), ALLOWED_SECTION_KEYS)

    def test_the_fixture_is_recognised_as_the_apps_own(self):
        d = extract.diagnose(SAMPLE)
        self.assertTrue(d["made_by_the_app"])
        self.assertTrue(d["creator"].startswith("Uplift Collator"))
        self.assertTrue(d["created"])

    def test_every_section_is_found(self):
        d = extract.diagnose(SAMPLE)
        self.assertTrue(all(s.get("matched") for s in d["sections"].values()),
                        d["sections"])

    def test_garbage_is_reported_as_unreadable(self):
        tmp = Path(tempfile.mkdtemp()) / "junk.docx"
        tmp.write_bytes(b"\x00\x01 nothing like a zip")
        d = extract.diagnose(tmp)
        self.assertFalse(d["readable"])
        text = extract.explain_empty_extraction(tmp)
        self.assertIn("could not be read as a Word document", text)
        self.assertIn("Fix:", text)

    def test_a_foreign_docx_is_reported_as_not_the_collators(self):
        tmp = Path(tempfile.mkdtemp()) / "foreign.docx"
        doc = Document()
        doc.add_paragraph("An ordinary letter about something else.")
        doc.save(str(tmp))
        text = extract.explain_empty_extraction(tmp)
        self.assertIn("does not look like an Uplift Collator document", text)
        self.assertIn("Fix:", text)

    def test_no_ticks_is_told_apart_from_no_sections(self):
        edited = _rewrite_paragraph(
            DEEMED,
            "Threshold test: deemed satisfied by panel membership "
            "(Spec Para 7.23(a)).",
            "x",
        )
        # Strip the only Stage 2 bullet as well, leaving headings but no ticks.
        edited2 = _rewrite_paragraph(
            edited, "•  " + _current_label("s2_resp_no_counsel_drafting"), "x"
        )
        text = extract.explain_empty_extraction(edited2)
        self.assertIn("no criteria were ticked", text)


class TestFixturesAreCanonical(unittest.TestCase):
    def test_fixtures_exist_and_are_zip_packages(self):
        for fixture in (SAMPLE, DEEMED, NASTY):
            with self.subTest(fixture=fixture.name):
                self.assertTrue(fixture.is_file())
                self.assertEqual(fixture.read_bytes()[:2], b"PK")


if __name__ == "__main__":
    unittest.main()
