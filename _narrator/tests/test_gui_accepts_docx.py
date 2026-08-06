"""The GUI's file gates accept both summary formats.

A source-level check, in the same spirit as test_unevidenced_other reading
MIN_EXPLANATION_WORDS back out of script.js: importing the GUI needs a Qt
display, so the gates are asserted against the source text instead. Crude on
purpose — what it catches is exactly the defect that happened on 7 August
2026: the drop zone and the Browse filter were widened to .docx while
``_load_pdf`` and ``main()`` kept rejecting everything but ``.pdf``, so every
dropped Word summary was refused with "Please select a PDF file". A review
pass caught it; this keeps it caught.
"""

from __future__ import annotations

import re
import unittest
from pathlib import Path

GUI_SOURCE = (Path(__file__).resolve().parents[1] / "narrate_gui.py").read_text(
    encoding="utf-8"
)


class TestGuiFileGates(unittest.TestCase):
    def test_no_gate_accepts_only_pdf(self):
        """A bare .pdf-only endswith gate is the bug recurring."""
        self.assertEqual(
            re.findall(r'endswith\(\s*"\.pdf"\s*\)', GUI_SOURCE),
            [],
            "narrate_gui.py has regrown a PDF-only file gate; every gate must "
            'accept (".docx", ".pdf")',
        )

    def test_all_three_gates_accept_both_formats(self):
        """Drop zone, _load_pdf and main() — widened together, stay together."""
        gates = re.findall(r'endswith\(\("\.docx", "\.pdf"\)\)', GUI_SOURCE)
        self.assertGreaterEqual(len(gates), 3, gates)

    def test_the_browse_filter_offers_docx_first(self):
        self.assertIn('"Collator summaries (*.docx *.pdf);;All files (*.*)"',
                      GUI_SOURCE)


if __name__ == "__main__":
    unittest.main()
