"""Verify the creation/modification timestamps read from a damaged PDF.

The producer says *what* rewrote a file. The gap between its timestamps says
*when in its life*, and that points somewhere different: seconds after
generation means an automatic process caught it leaving; days later means
something acted when the file was filed or forwarded. Those are different
systems to go looking for, and the whole point of the diagnostic is to find the
one that keeps damaging this firm's submissions.

No real PDFs here — the date strings are synthetic and the parser is exercised
directly.
"""

import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import extract  # noqa: E402


class TestPdfDateParsing(unittest.TestCase):
    def test_the_form_the_app_actually_writes(self):
        """jsPDF wraps the value in literal quote characters."""
        parsed = extract._parse_pdf_date("\"D:20260427105715+01'00'\"")
        self.assertEqual(parsed.replace(tzinfo=None),
                         datetime(2026, 4, 27, 10, 57, 15))
        self.assertEqual(parsed.utcoffset(), timedelta(hours=1))

    def test_utc_marker(self):
        parsed = extract._parse_pdf_date("D:20260427105715Z")
        self.assertEqual(parsed.utcoffset(), timedelta(0))

    def test_negative_offset(self):
        parsed = extract._parse_pdf_date("D:20260427105715-05'00'")
        self.assertEqual(parsed.utcoffset(), timedelta(hours=-5))

    def test_truncated_forms_are_accepted(self):
        """The PDF spec allows truncation at any point."""
        self.assertEqual(extract._parse_pdf_date("D:2026").year, 2026)
        self.assertEqual(extract._parse_pdf_date("D:202604").month, 4)
        self.assertEqual(extract._parse_pdf_date("D:20260427").day, 27)

    def test_missing_and_malformed_return_none(self):
        for value in ("", None, "not a date", "D:99999999999999",
                      "D:20261347105715"):
            self.assertIsNone(extract._parse_pdf_date(value), repr(value))


class TestTimingNote(unittest.TestCase):
    CREATED = datetime(2026, 4, 27, 10, 57, 15, tzinfo=timezone.utc)

    def note(self, **delta):
        return extract._rewrite_timing_note(
            self.CREATED, self.CREATED + timedelta(**delta)
        )

    def test_seconds_later_points_at_an_automatic_process(self):
        note = self.note(seconds=4)
        self.assertIn("4 seconds later", note)
        self.assertIn("automatic process caught it in transit", note)

    def test_same_day_points_at_filing_or_sending(self):
        note = self.note(hours=3)
        self.assertIn("3 hours later", note)
        self.assertIn("filed", note)

    def test_days_later_points_away_from_the_browser(self):
        note = self.note(days=9)
        self.assertIn("9 days later", note)
        self.assertIn("not\nat how it leaves the browser", note)

    def test_house_date_format_is_day_month_year(self):
        """`27 April '26`, never 4/27/26 — see the cross-project style note."""
        self.assertIn("27 April '26 at 10:57", self.note(seconds=4))

    def test_no_note_without_both_timestamps(self):
        self.assertEqual(extract._rewrite_timing_note(self.CREATED, None), "")
        self.assertEqual(extract._rewrite_timing_note(None, self.CREATED), "")

    def test_a_modification_before_creation_is_not_narrated(self):
        """Nonsense timestamps are a curiosity, not a finding to report."""
        self.assertEqual(self.note(seconds=-30), "")


class TestDiagnoseReportsTimestamps(unittest.TestCase):
    FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample.pdf"

    def setUp(self):
        self.d = extract.diagnose(self.FIXTURE)

    def test_the_apps_own_pdf_has_a_creation_date_and_no_modification(self):
        """This is the baseline: a ModDate appearing at all means something
        rewrote the file after the app saved it."""
        self.assertTrue(self.d["created"])
        self.assertEqual(self.d["modified"], "")
        self.assertIsNone(self.d["rewritten_after_seconds"])

    def test_diagnose_still_reveals_no_client_text(self):
        """The whole reason --debug exists: safe to paste when triaging a real
        case. Timestamps identify nobody; Title and Author are never read."""
        for key in ("Title", "Author", "Subject", "Keywords"):
            self.assertNotIn(key, self.d)
        blob = repr(self.d)
        self.assertNotIn("Jane Doe", blob)
        self.assertNotIn("Re X", blob)


class TestTimingReachesTheReader(unittest.TestCase):
    """The wiring that matters: the note has to appear in the message a person
    actually reads, not just in the JSON diagnostic."""

    BASE = {
        "sections": {}, "raw_chars": 1, "pages": 2, "images": 0,
        "vector_objects": 4200, "largest_image_page_coverage": 0.0,
        "producer": "Aspose.Pdf for .NET 11.7.0", "creator": "",
        "made_by_the_app": False,
        "created": "2026-04-27T10:57:15+00:00",
        "modified": "2026-04-27T10:57:19+00:00",
    }

    def explain(self, **overrides):
        from unittest import mock
        with mock.patch.object(extract, "diagnose",
                               return_value={**self.BASE, **overrides}):
            return extract.explain_empty_extraction("anything.pdf")

    def test_an_outlined_pdf_reports_when_it_was_rewritten(self):
        message = self.explain()
        self.assertIn("4 seconds later", message)
        self.assertIn("automatic process caught it in transit", message)

    def test_it_still_names_the_producer_alongside(self):
        """Both halves of the answer: what rewrote it, and when."""
        message = self.explain()
        self.assertIn("Aspose.Pdf for .NET 11.7.0", message)
        self.assertIn("runs *inside* other", message)

    def test_a_pdf_with_no_modification_date_says_nothing_about_timing(self):
        message = self.explain(modified="")
        self.assertNotIn("seconds later", message)
        self.assertNotIn("days later", message)

    def test_the_timing_note_survives_the_has_text_branch(self):
        """A file with text but no Collator headings gets the note too."""
        message = self.explain(raw_chars=5000, modified="2026-05-06T10:57:15+00:00")
        self.assertIn("9 days later", message)


if __name__ == "__main__":
    unittest.main()
