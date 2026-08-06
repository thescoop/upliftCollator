"""The finished narrative carries the matter name in its filename.

Simon's request, 6 August 2026: a Word file sitting in a folder or attached to
an email should say which case it belongs to. Before this, every Collator
download was ``LAA_Uplift_Data_Summary.pdf`` and every narrative was
``narrative-polished.docx``, so three cases in a morning produced those names
plus "(1)" and "(2)" with nothing but a timestamp to tell them apart.

The suffix is the whole "Case / Matter Name" field, not a surname parsed out of
it. There is no separate client-surname field — that field is where the surname
lives, typically as "Smith 29964" — and the number is what keeps two matters for
the same family apart.

The clearing tests matter more than the naming ones. Once the stem varies by
matter, clearing stale output by exact filename stops overwriting the previous
run, which would leave a Word file bearing ANOTHER client's matter name in the
folder the solicitor is about to attach something from.
"""

import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from docx_writer import clear_derived, matter_suffix, polished_stem  # noqa: E402
from extract import normalise_text  # noqa: E402


def _fd(matter) -> dict:
    return {"caseDetails": {"caseMatterName": matter}}


class MatterSuffixTests(unittest.TestCase):
    def test_ordinary_matter_name_is_used_whole(self) -> None:
        self.assertEqual(matter_suffix(_fd("Smith 29964")), "Smith 29964")
        self.assertEqual(polished_stem(_fd("Smith 29964")),
                         "narrative-polished-Smith 29964")

    def test_two_matters_for_one_family_stay_distinct(self) -> None:
        """The reason the whole field is used rather than the first word."""
        self.assertNotEqual(polished_stem(_fd("Smith 29964")),
                            polished_stem(_fd("Smith 31102")))

    def test_characters_windows_cannot_store_are_removed(self) -> None:
        """The folder normally sits on /mnt/c and is opened in Windows Word, so
        Windows' rules bind even when the run happens under WSL."""
        self.assertEqual(matter_suffix(_fd('Re: A/B "child" <x>|y?*')),
                         "Re AB child xy")

    def test_a_trailing_dot_is_stripped(self) -> None:
        """Windows cannot store a name ending in a dot and mangles one silently."""
        self.assertEqual(matter_suffix(_fd("Smith Jr.")), "Smith Jr")

    def test_whitespace_is_collapsed_and_trimmed(self) -> None:
        self.assertEqual(matter_suffix(_fd("  Smith\t\t 29964  ")), "Smith 29964")

    def test_a_long_matter_name_is_capped(self) -> None:
        suffix = matter_suffix(_fd("X" * 200))
        self.assertEqual(len(suffix), 60)

    def test_no_matter_name_gives_the_plain_filename(self) -> None:
        """Not a placeholder. A PDF produced before the field existed, or one
        whose case details were damaged, should not produce a Word file called
        "narrative-polished-unknown.docx"."""
        for empty in ("", "   ", None):
            with self.subTest(value=empty):
                self.assertEqual(matter_suffix(_fd(empty)), "")
                self.assertEqual(polished_stem(_fd(empty)), "narrative-polished")

    def test_a_name_that_sanitises_away_entirely_gives_the_plain_filename(self) -> None:
        self.assertEqual(polished_stem(_fd("///")), "narrative-polished")

    def test_missing_case_details_does_not_raise(self) -> None:
        self.assertEqual(polished_stem({}), "narrative-polished")
        self.assertEqual(polished_stem({"caseDetails": None}), "narrative-polished")


class ClearDerivedTests(unittest.TestCase):
    """Stale output must go whatever matter it named."""

    def setUp(self) -> None:
        self.dir = Path(tempfile.mkdtemp())

    def _touch(self, *names: str) -> None:
        for n in names:
            (self.dir / n).write_text("x", encoding="utf-8")

    def test_a_previous_matters_output_is_cleared(self) -> None:
        """The defect this exists to prevent. With clearing by fixed name, a run
        for Smith would leave Jones's Word file sitting beside it — in the folder
        the solicitor is about to attach something from."""
        self._touch("narrative-polished-Jones 11887.docx",
                    "narrative-polished-Jones 11887.md",
                    "citation-check.txt")
        clear_derived(self.dir)
        self.assertEqual(sorted(p.name for p in self.dir.iterdir()), [])

    def test_the_old_fixed_name_is_still_cleared(self) -> None:
        """Folders from before 6 August 2026 hold the unsuffixed names."""
        self._touch("narrative-polished.docx", "narrative-polished.md")
        clear_derived(self.dir)
        self.assertEqual(sorted(p.name for p in self.dir.iterdir()), [])

    def test_the_skeleton_and_recovered_input_survive(self) -> None:
        """narrative.md, narrative-prompt.txt and narrative-input.json are not
        derived from the polish step and are cleared separately, on the paths
        that actually need them gone."""
        self._touch("narrative.md", "narrative-prompt.txt",
                    "narrative-input.json", "narrative-polished-Smith 29964.docx")
        clear_derived(self.dir)
        self.assertEqual(
            sorted(p.name for p in self.dir.iterdir()),
            ["narrative-input.json", "narrative-prompt.txt", "narrative.md"],
        )

    def test_an_unrelated_file_is_left_alone(self) -> None:
        self._touch("the client's own note.docx", "narrative-polished-Smith.docx")
        clear_derived(self.dir)
        self.assertEqual(sorted(p.name for p in self.dir.iterdir()),
                         ["the client's own note.docx"])


class HeaderStrippingTests(unittest.TestCase):
    """The per-page header is an extraction contract, and it was renamed.

    ``normalise_text`` strips this line from every page before anything is
    parsed. If the pattern and the generator drift apart, the header stops being
    stripped and lands in the middle of the parsed body on every page.
    """

    def _page(self, header: str) -> str:
        return (
            f"W Woodruff Billing Ltd. {header}\n"
            "CASE DETAILS\n"
            "Fee Earner: A. Solicitor\n"
        )

    def test_the_pre_rename_header_is_still_stripped(self) -> None:
        """PDFs made before 6 August 2026 are sitting in live matters. A pattern
        that matched only the new wording would put "Woodruff Billing Ltd. LAA
        Uplift Enhancement | Data Summary" into their parsed body on every page."""
        out = normalise_text(self._page("LAA Uplift Enhancement  |  Data Summary"))
        self.assertNotIn("Woodruff Billing", out)
        self.assertNotIn("Data Summary", out)
        self.assertIn("Fee Earner: A. Solicitor", out)

    def test_the_new_header_is_stripped(self) -> None:
        out = normalise_text(self._page("Uplift Justification  |  Smith 29964"))
        self.assertNotIn("Woodruff Billing", out)
        self.assertNotIn("Smith 29964", out)
        self.assertIn("Fee Earner: A. Solicitor", out)

    def test_the_new_header_without_a_matter_name_is_stripped(self) -> None:
        """What a PDF looks like when the matter field was left empty."""
        out = normalise_text(self._page("Uplift Justification"))
        self.assertNotIn("Woodruff Billing", out)
        self.assertIn("Fee Earner: A. Solicitor", out)

    def test_a_matter_named_after_a_section_is_removed_with_the_header(self) -> None:
        """The reason the pattern consumes to end of line.

        A matter called "CASE DETAILS" would otherwise plant what looks like a
        section heading at the top of every page, and section_slice takes the
        FIRST bare occurrence — so page 3's header would win over the real
        section on page 1. Driven end to end in Chromium as well; this is the
        cheap version that runs on every commit.
        """
        text = normalise_text(self._page("Uplift Justification  |  CASE DETAILS"))
        # Exactly one left: the genuine section heading, not the header's copy.
        self.assertEqual(text.count("CASE DETAILS"), 1)
        self.assertNotIn("Woodruff Billing", text)

    def test_stripping_stops_at_the_end_of_the_header_line(self) -> None:
        """The header match must not swallow the content beneath it.

        Swapping `[^\\n]*` for `.*` would NOT break this on its own — Python's
        `.` does not cross a newline without `re.DOTALL` — so `[^\\n]*` is chosen
        for saying plainly what it means rather than because the alternative is
        wrong. The failure this actually guards against is someone adding
        `re.DOTALL` to the pattern, at which point the header match runs to the
        end of the document and deletes the entire page. Verified by doing it.
        """
        text = normalise_text(
            "W Woodruff Billing Ltd. Uplift Justification  |  Smith 29964\n"
            "STAGE 1: THRESHOLD TEST SELECTIONS\n"
            "•  The legal, expert or other evidential issues were exceptionally complex\n"
        )
        self.assertIn("STAGE 1: THRESHOLD TEST SELECTIONS", text)
        self.assertIn("exceptionally complex", text)


if __name__ == "__main__":
    unittest.main()
