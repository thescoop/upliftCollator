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

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from structural_audit import main  # noqa: E402


class StructuralAuditTests(unittest.TestCase):
    def test_the_audit_passes(self) -> None:
        # main() asserts its way through and prints a report; a failure surfaces
        # as the AssertionError with its own message, which is what we want to
        # read. Nothing is captured or reinterpreted here.
        main()


if __name__ == "__main__":
    unittest.main()
