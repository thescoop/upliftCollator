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
        # The *numbers*, not just the labels. Asserting the four line prefixes
        # alone still passed when a Stage 1 checkbox was deleted from the loaded
        # data — the audit reported "Stage 1: 12 checkboxes" and this was happy
        # with it. A report whose labels survive while its counts collapse is
        # exactly the failure this wrapper exists to catch, so the counts are
        # what it reads. Update these deliberately when the form changes; that
        # is the point of them.
        # 16 -> 18 on 6 August 2026: limb (c) gained a novelty label and a weight
        # label. 40 -> 44 live keys: those two, plus their Stage 2 carriers
        # s2_novelty_novel_point and s2_resp_other. 81 -> 85 follows (44 live +
        # 41 legacy). The legacy and alias counts are unchanged, and should be:
        # nothing that already shipped was renamed.
        self.assertIn("Stage 1: 18 checkboxes", report)
        self.assertIn("Retired-template binding: 54 live keys and headers", report)
        self.assertIn("Template coverage: 44 live keys and 41 legacy labels", report)
        self.assertIn("Label uniqueness: 85 live/legacy labels", report)
        self.assertIn("Changed-label aliases: 12 previous live labels", report)


if __name__ == "__main__":
    unittest.main()
