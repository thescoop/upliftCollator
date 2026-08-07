"""Verify the tool refuses to narrate a PDF it recovered nothing from.

Found in use on 1 August 2026: a PDF that yielded zero criteria still produced
a stub skeleton, still spent a model call on it, and still wrote a
citation-check reporting "1 citation dropped". That reads as a fault in the
narrative when the whole problem was in the PDF — and it buried the one fact
that mattered, which is that nothing was extracted at all.

These tests pin the two halves of the fix: the emptiness test itself, and the
requirement that the explanation names a cause and a remedy without leaking
any client text.
"""

import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import extract  # noqa: E402


def _sections(**matched):
    """A diagnose()-shaped sections dict; kwargs give the matched ones."""
    names = ("case_details", "panel_membership", "stage1", "stage2",
             "proposed_uplift", "disclaimer")
    out = {}
    for name in names:
        if name in matched:
            out[name] = {"matched": True, "bullet_lines": matched[name],
                         "explanation_markers": matched[name],
                         "block_chars": 100, "block_lines": 5, "start_offset": 0}
        else:
            out[name] = {"matched": False}
    return out


# The real thing, verbatim from `narrate.py --debug` on the PDF that arrived
# on 1 August 2026. Kept exactly as reported so a future change to the
# branching has to face the case that produced it rather than a tidied-up
# version of it. No client text — diagnose() returns structure only.
REAL_ASPOSE_CASE = {
    "pdf": "case.pdf", "pages": 2, "per_page_chars": [0, 0],
    "raw_chars": 1, "normalised_chars": 1,
    "header_matches": 0, "footer_matches": 0,
    "producer": "Aspose.Pdf for .NET 11.7.0", "creator": "Aspose Ltd.",
    "made_by_the_app": False,
    "images": 0, "largest_image_page_coverage": 0.0, "vector_objects": 6099,
    "sections": {n: {"matched": False} for n in (
        "case_details", "panel_membership", "stage1", "stage2",
        "proposed_uplift", "disclaimer")},
}


def _diag(raw_chars=2000, pages=2, producer="jsPDF 2.5.1", creator="",
          images=0, coverage=0.0, vectors=0, **matched):
    return {
        "pdf": "case.pdf", "pages": pages, "per_page_chars": [raw_chars],
        "raw_chars": raw_chars, "normalised_chars": raw_chars,
        "header_matches": 1, "footer_matches": 1,
        "producer": producer, "creator": creator,
        "made_by_the_app": bool(extract.JSPDF_PRODUCER.search(producer)),
        "images": images, "largest_image_page_coverage": coverage,
        "vector_objects": vectors,
        "sections": _sections(**matched),
    }


class TestEmptinessTest(unittest.TestCase):
    def test_no_criteria_at_all_is_empty(self):
        self.assertTrue(extract.extraction_is_empty(
            {"caseDetails": {}, "panelMembership": {}, "stage1": {}, "stage2": {},
             "finalUpliftPercent": ""}
        ))

    def test_panel_and_uplift_alone_are_not_enough(self):
        """The criteria *are* the narrative. Without one there is nothing to say."""
        self.assertTrue(extract.extraction_is_empty(
            {"caseDetails": {"feeEarnerName": "A"}, "panelMembership": {"p": {}},
             "stage1": {}, "stage2": {}, "finalUpliftPercent": "50"}
        ))

    def test_stage1_alone_is_enough(self):
        self.assertFalse(extract.extraction_is_empty(
            {"stage1": {"k": {}}, "stage2": {}}
        ))

    def test_stage2_alone_is_enough(self):
        """Stage 2 without Stage 1 is odd but still has content to narrate."""
        self.assertFalse(extract.extraction_is_empty(
            {"stage1": {}, "stage2": {"k": {}}}
        ))

    def test_current_docx_coded_rows_are_counted_as_criteria(self):
        """The Word design has coded rows, not bullets, but diagnostics must
        still distinguish a populated summary from an empty questionnaire."""
        fixture = Path(__file__).resolve().parent / "fixtures" / "sample.docx"
        diagnostic = extract.diagnose(fixture)
        self.assertEqual(diagnostic["sections"]["stage1"]["bullet_lines"], 3)
        self.assertEqual(diagnostic["sections"]["stage2"]["bullet_lines"], 2)
        self.assertFalse(extract.extraction_is_empty(extract.extract_formdata(fixture)))


class TestExplanation(unittest.TestCase):
    """Every branch must name a cause and a fix, and leak no client text."""

    def _explain(self, diag):
        # diagnose_pdf, not the dispatching diagnose: explain_empty_extraction
        # routes "case.pdf" to the PDF path, which reads the PDF diagnostics
        # directly. (extract_docx has its own explanation tests.)
        with mock.patch.object(extract, "diagnose_pdf", return_value=diag):
            return extract.explain_empty_extraction("case.pdf")

    def test_no_text_layer_explains_why_text_cannot_be_selected(self):
        text = self._explain(_diag(raw_chars=0, producer="", images=1, coverage=1.0))
        self.assertIn("no text in it", text)
        self.assertIn("cannot select any text", text)

    def test_a_flattened_page_is_distinguished_from_a_paper_scan(self):
        """One full-page image means a rebuilt file, not a scan of paper.

        The distinction matters: a scan means "someone printed it out", a
        flatten means "software did this in transit" — and only the second
        makes sense when the solicitor used the app's own button.
        """
        flat = self._explain(_diag(raw_chars=0, producer="", images=1, coverage=1.0))
        self.assertIn("flattened", flat)
        no_image = self._explain(_diag(raw_chars=0, producer="", images=0))
        self.assertNotIn("flattened", no_image)

    def test_the_producer_is_named_when_known(self):
        text = self._explain(
            _diag(raw_chars=0, producer="Microsoft: Print To PDF", images=1, coverage=1.0)
        )
        self.assertIn("Microsoft: Print To PDF", text)

    def test_a_flattened_file_is_never_told_to_regenerate_from_the_app(self):
        """She *did* use the app's button. Telling her to use it again is wrong.

        Real case, 1 August 2026: a correctly-generated v1.10 PDF arrived with
        its text layer gone. The first version of this message blamed the
        browser's Print-to-PDF and sent the reader back to a button they had
        already pressed.
        """
        text = self._explain(_diag(raw_chars=0, producer="", images=1, coverage=1.0))
        self.assertNotIn("Generate PDF Summary", text)
        self.assertIn("straight from the browser's Downloads", text)

    def test_outlined_text_is_not_called_an_image(self):
        """Thousands of vectors, no images: the glyphs became line art.

        Rasterised and outlined files both defeat extraction and look
        identical on screen, but only one of them is "a picture of the page".
        Calling the wrong one that sends the reader looking for a scanner.
        """
        text = self._explain(_diag(raw_chars=0, producer="", images=0, vectors=6099))
        self.assertIn("converted to", text)
        self.assertIn("outlines", text)
        self.assertNotIn("picture of the page", text)

    def test_a_few_stray_characters_still_count_as_no_text(self):
        """The real case returned exactly 1 character.

        Testing ``raw_chars == 0`` let it fall through to the branch about
        missing section headings — in a file that had no text to put headings
        in. Anything under a header, footer and disclaimer is not a text layer.
        """
        text = self._explain(_diag(raw_chars=1, producer="", images=0, vectors=6099))
        self.assertIn("no text in it", text)
        self.assertNotIn("section headings", text)

    def test_the_real_august_case_is_diagnosed_correctly(self):
        text = self._explain(dict(REAL_ASPOSE_CASE))
        self.assertIn("outlines", text)                  # how
        self.assertIn("Aspose.Pdf for .NET 11.7.0", text)  # who
        self.assertIn("in transit", text)                # when
        self.assertIn("not\nsomething the solicitor did wrong", text)
        self.assertIn("Downloads", text)                 # what to do
        self.assertNotIn("picture of the page", text)

    def test_a_known_producer_gets_its_own_note(self):
        for producer, expected in (
            ("Aspose.Pdf for .NET 11.7.0", "inside"),
            ("Microsoft: Print To PDF", "re-printed"),
            ("Adobe Acrobat Pro 23.0", "Print as image"),
            ("GPL Ghostscript 10.02", "mail\ngateways"),
        ):
            with self.subTest(producer=producer):
                text = self._explain(
                    _diag(raw_chars=0, producer=producer, images=0, vectors=6099)
                )
                self.assertIn(expected, text)

    def test_an_unknown_producer_is_still_named(self):
        text = self._explain(
            _diag(raw_chars=0, producer="SomeVendor PDF Kit 4.1", images=1, coverage=1.0)
        )
        self.assertIn("SomeVendor PDF Kit 4.1", text)

    def test_ocr_is_advised_against_rather_than_offered(self):
        """Plausible-but-wrong is the worst failure class on an audited claim."""
        text = self._explain(_diag(raw_chars=0, producer="", images=1, coverage=1.0))
        self.assertIn("Do not re-key or OCR", text)

    def test_text_but_no_sections_from_a_foreign_producer_names_it(self):
        text = self._explain(_diag(raw_chars=5000, producer="Acrobat Distiller 23.0"))
        self.assertIn("Acrobat Distiller 23.0", text)
        self.assertIn("jsPDF", text)

    def test_text_but_no_sections_from_an_unknown_producer_blames_print_to_pdf(self):
        text = self._explain(_diag(raw_chars=5000, producer="", creator=""))
        self.assertIn("does not look like an Uplift Collator PDF", text)
        self.assertIn("Print-to-PDF", text)

    def test_sections_present_but_nothing_ticked(self):
        text = self._explain(
            _diag(case_details=0, stage1=0, stage2=0, proposed_uplift=0)
        )
        self.assertIn("no criteria were ticked", text)
        self.assertIn("complete the questionnaire", text)

    def test_collator_pdf_without_stage_sections_suggests_an_old_version(self):
        text = self._explain(_diag(case_details=0, panel_membership=0))
        self.assertIn("older version", text)

    def test_ticks_present_but_labels_unmatched(self):
        text = self._explain(_diag(stage1=3, stage2=2))
        self.assertIn("unknown criterion label", text)
        self.assertIn("content-data.js", text)

    def test_every_branch_ends_with_a_fix(self):
        for diag in (
            _diag(raw_chars=0, producer="", images=1, coverage=1.0),
            _diag(raw_chars=0, producer=""),
            _diag(raw_chars=5000, producer=""),
            _diag(raw_chars=5000, producer="Acrobat Distiller 23.0"),
            _diag(case_details=0, stage1=0, stage2=0),
            _diag(case_details=0, panel_membership=0),
            _diag(stage1=3, stage2=2),
        ):
            with self.subTest(producer=diag["producer"], raw=diag["raw_chars"]):
                self.assertIn("Fix:", self._explain(diag))

    def test_diagnose_is_the_only_input(self):
        diag = _diag(raw_chars=5000)
        with mock.patch.object(extract, "diagnose_pdf", return_value=diag) as spy:
            extract.explain_empty_extraction("case.pdf")
        spy.assert_called_once()


# Every key diagnose() is allowed to return. The message built from it gets
# printed to terminals and pasted into messages while triaging a real,
# privileged case PDF, so the contents must be structural or software names —
# never a field value, an explanation, or anything naming a client.
ALLOWED_DIAGNOSE_KEYS = {
    # No "pdf" filename key — it carried the matter name, in output whose
    # whole promise is that it can be pasted anywhere. Removed 7 August 2026;
    # its absence from this set is what keeps it removed.
    "pages", "per_page_chars", "raw_chars", "normalised_chars",
    "header_matches", "footer_matches", "producer", "creator",
    "made_by_the_app", "images", "largest_image_page_coverage",
    "vector_objects", "sections",
    # Timestamps, added 1 August 2026. Safe on the same test as the software
    # names: they describe the file, not the case. The gap between them says
    # how long after generation the file was rewritten, which distinguishes an
    # automatic process catching it in transit from something that ran when it
    # was later filed or forwarded — two different systems to go looking for.
    "created", "modified", "rewritten_after_seconds",
}

# PDF metadata that can carry a client name. Reading Producer and Creator is
# safe — they hold software names. Reading these is not, and a future edit
# that adds one must fail here rather than in front of a client.
FORBIDDEN_METADATA = ("Title", "Author", "Subject", "Keywords")


class TestDiagnoseCarriesNoClientText(unittest.TestCase):
    """Runs against the real fixture PDF, not a mock — the point is the
    output of the real function, on a real file with real content in it."""

    FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample.pdf"

    def setUp(self):
        if not self.FIXTURE.is_file():
            self.skipTest("fixture PDF missing")
        self.diag = extract.diagnose(self.FIXTURE)

    def test_no_key_outside_the_allow_list(self):
        self.assertEqual(set(self.diag) - ALLOWED_DIAGNOSE_KEYS, set())

    def test_forbidden_metadata_is_never_read(self):
        for field in FORBIDDEN_METADATA:
            self.assertNotIn(field, self.diag)

    def test_the_fixtures_own_field_values_do_not_appear(self):
        """The strongest form: extract the PDF for real, then assert none of
        what it recovered shows up anywhere in the diagnostic."""
        import json
        blob = json.dumps(self.diag)
        formdata = extract.extract_formdata(self.FIXTURE)
        secrets = list(formdata["caseDetails"].values())
        for section in ("stage1", "stage2"):
            for item in formdata[section].values():
                secrets += [item.get("label", ""), item.get("explanation", "")]
        for secret in (s for s in secrets if len(s) > 3):
            with self.subTest(secret=secret[:30]):
                self.assertNotIn(secret, blob)

    def test_the_apps_own_pdf_is_recognised_as_such(self):
        self.assertTrue(self.diag["made_by_the_app"])
        self.assertIn("jsPDF", self.diag["producer"])


if __name__ == "__main__":
    unittest.main()
