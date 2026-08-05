"""Run the standalone structural audit as part of the suite.

`structural_audit.py` checks the cross-stage extraction contracts in
content-data.js — that every live and legacy key renders, that Stage 1 carries
into Stage 2, that no label is ambiguous, and that every replaced live label
kept an alias. It was written to be run by hand before a release.

Nothing ran it. It sat broken from 5 August 2026, when the first legacy alias
pointing at a panel key was added and its alias branch — unlike the live branch
beside it — had no panel exemption. Three review rounds went past without
noticing, because they were reading diffs and this file was not in any of them.
A check nobody runs is not a check, so it runs here now.

If this fails, run it directly for the readable report:

    PYTHONPATH=_narrator python3 _narrator/tests/structural_audit.py
"""

import io
import sys
import unittest
from contextlib import redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from structural_audit import main  # noqa: E402


class StructuralAuditTests(unittest.TestCase):
    def test_the_audit_runs_and_passes(self) -> None:
        """Asserts on the report, not merely on the absence of an exception.

        This called `main()` and checked nothing when it was written, so
        replacing the body of `main()` with `return` left it green — a wiring
        test that could stop testing the wiring. The audit's own summary lines
        are the evidence that it actually walked the contracts, so they are what
        is checked. It also keeps the report out of the test output."""
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            main()
        report = buffer.getvalue()

        self.assertIn("STRUCTURAL AUDIT PASS", report)
        # One line per contract the audit covers. If one is dropped, the audit
        # stopped checking something and this notices.
        self.assertIn("Stage 1:", report)
        self.assertIn("Template coverage:", report)
        self.assertIn("Label uniqueness:", report)
        self.assertIn("Changed-label aliases:", report)


if __name__ == "__main__":
    unittest.main()
