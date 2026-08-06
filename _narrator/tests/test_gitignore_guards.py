"""The repository can never stage a real Collator download.

The repo is public and these machines hold privileged client files. A real
summary copied in to diagnose — under any name the app has ever used — must be
invisible to `git add .`, while the committed synthetic fixtures stay
trackable. `git check-ignore --no-index` asks git itself, so this holds the
actual .gitignore rather than a re-implementation of it (a mirrored check that
repeats the bug is not a check).
"""

from __future__ import annotations

import shutil
import subprocess
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]


def _ignored(relative_path: str) -> bool:
    result = subprocess.run(
        ["git", "check-ignore", "--no-index", "-q", relative_path],
        cwd=REPO,
        capture_output=True,
    )
    return result.returncode == 0


@unittest.skipIf(
    shutil.which("git") is None or not (REPO / ".gitignore").is_file(),
    "git or .gitignore unavailable",
)
class TestDownloadsAreUnstageable(unittest.TestCase):
    def test_every_download_name_the_app_has_ever_used_is_ignored(self):
        for name in (
            "Uplift_Justification-Smith 29964.docx",
            "Uplift_Justification-Smith 29964.pdf",
            "Uplift_Justification.docx",
            "LAA_Uplift_Data_Summary.pdf",
            "LAA_Uplift_Data_Summary (1).pdf",
            "subdir/Uplift_Justification-Jones 11111.docx",
            # The fixtures folder must NOT be an exception for app-named
            # files: a wildcard re-include once made it the one place a real
            # download became stageable again (round-3 review finding).
            "_narrator/tests/fixtures/Uplift_Justification-Smith 29964.docx",
            "_narrator/tests/fixtures/Uplift_Justification-Real Case.pdf",
        ):
            with self.subTest(name=name):
                self.assertTrue(_ignored(name), f"{name} is stageable")

    def test_the_synthetic_fixtures_stay_trackable(self):
        for name in (
            "_narrator/tests/fixtures/sample.docx",
            "_narrator/tests/fixtures/deemed.docx",
            "_narrator/tests/fixtures/nasty.docx",
            "_narrator/tests/fixtures/sample.pdf",
        ):
            with self.subTest(name=name):
                self.assertFalse(_ignored(name), f"{name} became ignored")


if __name__ == "__main__":
    unittest.main()
