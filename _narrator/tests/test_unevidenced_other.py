"""A limb "other" ticked at Stage 1 with nothing at Stage 2 explaining it.

The three "other" labels assert only that the work was exceptional in a respect
CAG 12.8's examples do not cover. The Stage 2 paragraph is the only place that
says what the respect was, so a document carrying one without the other tells
the LAA that the detail follows and then does not give it.

The form refuses to produce that. This covers the paths that do not go through
the form: `--from-json` on a hand-edited file, and any PDF produced before the
form learned to stop it.

Found by review on 5 August 2026, after the guard had been reported as working
on the strength of testing the Stage 2 box ticked-and-blank — never unticked.
"""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from extract import unevidenced_other_factors  # noqa: E402
from templates import load_content_data  # noqa: E402

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_formdata.json"


def _formdata(stage1: dict, stage2: dict) -> dict:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    data["stage1"] = stage1
    data["stage2"] = stage2
    return data


S1_OTHER = {
    "s1_circ_other": {
        "checked": True,
        "label": "The case involved exceptional circumstances or complexity in some other way",
        "categoryTitle": "Threshold limb (c): exceptional circumstances or complexity",
    }
}


class UnevidencedOtherTests(unittest.TestCase):
    def test_an_other_with_no_stage2_at_all_is_reported(self) -> None:
        gaps = unevidenced_other_factors(_formdata(S1_OTHER, {}))
        self.assertEqual(len(gaps), 1)
        self.assertIn("in some other way", gaps[0])

    def test_an_other_whose_carrier_has_an_empty_explanation_is_reported(self) -> None:
        """The carrier being present is not enough — it is the words that
        evidence the claim, and a hand-edited JSON can carry an empty string."""
        gaps = unevidenced_other_factors(_formdata(S1_OTHER, {
            "s2_complexity_other": {
                "checked": True,
                "label": "Exceptional circumstances or complexity of some other kind",
                "explanation": "   ",
            }
        }))
        self.assertEqual(len(gaps), 1)

    def test_an_explained_carrier_satisfies_it(self) -> None:
        gaps = unevidenced_other_factors(_formdata(S1_OTHER, {
            "s2_complexity_other": {
                "checked": True,
                "label": "Exceptional circumstances or complexity of some other kind",
                "explanation": (
                    "Three sets of concurrent proceedings ran in two jurisdictions "
                    "with an unrepresented father participating from abroad."
                ),
            }
        }))
        self.assertEqual(gaps, [])

    def test_a_token_explanation_does_not_satisfy_it(self) -> None:
        """The form demands ten words; this path must not be the soft way in.

        A hand-edited `--from-json` file whose explanation was "." satisfied
        this until 5 August 2026, while the form would have refused it."""
        for token in (".", "one", "far too short to count"):
            with self.subTest(explanation=token):
                gaps = unevidenced_other_factors(_formdata(S1_OTHER, {
                    "s2_complexity_other": {"checked": True, "explanation": token}
                }))
                self.assertEqual(len(gaps), 1)

    def test_an_unchecked_carrier_does_not_satisfy_it(self) -> None:
        """`checked: false` with prose left behind is a factor the solicitor
        withdrew. Nothing looked at the flag until review found it."""
        gaps = unevidenced_other_factors(_formdata(S1_OTHER, {
            "s2_complexity_other": {
                "checked": False,
                "explanation": (
                    "Three sets of concurrent proceedings ran in two jurisdictions "
                    "with an unrepresented father participating from abroad."
                ),
            }
        }))
        self.assertEqual(len(gaps), 1)

    def test_malformed_entries_stop_rather_than_throw(self) -> None:
        """`load_formdata_json` checks the sections are objects, not their
        values. A null or a bare string used to raise AttributeError out of a
        function whose whole job is to report a problem cleanly."""
        for stage1, stage2 in (
            ({"s1_circ_other": None}, {}),
            ({"s1_circ_other": "x"}, {}),
            (S1_OTHER, {"s2_complexity_other": "x"}),
            (S1_OTHER, {"s2_complexity_other": None}),
        ):
            with self.subTest(stage1=stage1, stage2=stage2):
                gaps = unevidenced_other_factors(_formdata(stage1, stage2))
                self.assertEqual(len(gaps), 1)

    def test_the_word_threshold_matches_the_form(self) -> None:
        """Two copies of the same rule, in two languages. If script.js changes
        MIN_EXPLANATION_WORDS and this does not, the narrator silently becomes
        the lenient end again."""
        import re
        from extract import MIN_EXPLANATION_WORDS

        script = (Path(__file__).resolve().parents[2] / "script.js").read_text(
            encoding="utf-8"
        )
        # Anchored to a real declaration at the start of a line. A loose search
        # matched a commented-out `// MIN_EXPLANATION_WORDS = 10` sitting above
        # `const MIN_EXPLANATION_WORDS = 12;`, and passed while the browser used
        # 12. Exactly one declaration must exist, so a second one cannot hide
        # behind the first either.
        matches = re.findall(
            r"^\s*const\s+MIN_EXPLANATION_WORDS\s*=\s*(\d+)\s*;",
            script,
            re.MULTILINE,
        )
        self.assertEqual(
            len(matches), 1,
            "expected exactly one `const MIN_EXPLANATION_WORDS = <number>;` in "
            f"script.js, found {len(matches)}",
        )
        self.assertEqual(int(matches[0]), MIN_EXPLANATION_WORDS)

    def test_the_word_count_agrees_with_the_browser_on_odd_whitespace(self) -> None:
        """Python's idea of whitespace is not JavaScript's.

        `str.split()` treats U+001C-U+001F and U+0085 as separators and U+FEFF
        as an ordinary character; ECMAScript's \\s does the reverse. A
        zero-width no-break space between words therefore counted as ten words
        in the form and one in the narrator, so an explanation the form accepted
        could be refused afterwards."""
        from extract import _count_words_as_the_browser_does as count

        ten = "one two three four five six seven eight nine ten"
        self.assertEqual(count(ten), 10)
        self.assertEqual(count(ten.replace(" ", "\ufeff")), 10)
        self.assertEqual(count("a\x85b\x85c"), 1)
        self.assertEqual(count("a\x1cb\x1cc"), 1)
        # At the boundary, not only mid-token. A trailing U+0085 was stripped by
        # a bare .strip() and took the token before it with it, so ten browser
        # words counted as nine — the same divergence, one layer down.
        self.assertEqual(count(ten.rsplit(" ", 1)[0] + " \x85"), 10)
        self.assertEqual(count("\x85 " + ten), 11)
        self.assertEqual(count("\ufeff" + ten + "\ufeff"), 10)
        self.assertEqual(count("  spaced   out  "), 2)
        self.assertEqual(count("   "), 0)

    def test_a_carrier_whose_checked_flag_is_not_true_does_not_satisfy_it(self) -> None:
        """`is not True`, not "anything but False": None, 0, "" and the string
        "false" all read as ticked under the looser test this replaced."""
        words = "one two three four five six seven eight nine ten"
        for flag in (None, 0, "", "false", [], {}):
            with self.subTest(checked=flag):
                gaps = unevidenced_other_factors(_formdata(S1_OTHER, {
                    "s2_complexity_other": {"checked": flag, "explanation": words}
                }))
                self.assertEqual(len(gaps), 1)

    def test_both_narrator_entry_points_call_the_guard(self) -> None:
        """narrate.py had it; narrate_gui.py did not.

        The GUI is what both launchers run (_Generate_Uplift_Narrative.bat and
        _narrator.sh), so the guard protected the path almost nobody uses while
        the advertised one went straight through. Checked at source level
        because importing narrate_gui needs Qt, which the suite does not.

        A source-level check is a smoke test, not proof: it establishes that the
        guard is called and its result branched on, not that the branch does
        anything useful. The behaviour itself is covered by the tests above,
        which exercise `unevidenced_other_factors` directly."""
        root = Path(__file__).resolve().parents[1]
        for name in ("narrate.py", "narrate_gui.py"):
            source = (root / name).read_text(encoding="utf-8")
            with self.subTest(module=name):
                self.assertIn(
                    "unevidenced_other_factors", source,
                    f"{name} never calls unevidenced_other_factors, so that path "
                    "can still write a narrative asserting a threshold factor "
                    "nothing explains",
                )
                # Imported *and* called, not merely mentioned in a comment.
                self.assertRegex(
                    source, r"=\s*unevidenced_other_factors\(",
                    f"{name} imports the guard but never calls it",
                )
                # And branches on the result. Assigning it and dropping it on
                # the floor would otherwise satisfy the line above.
                self.assertRegex(
                    source, r"if\s+unevidenced\s*:",
                    f"{name} calls the guard but never acts on what it returns",
                )

    def test_a_named_threshold_label_needs_no_carrier(self) -> None:
        """Only the "other" labels are guarded. A named one says something on
        its own, and a solicitor may legitimately rely on it for the threshold
        without arguing it again for the level."""
        gaps = unevidenced_other_factors(_formdata({
            "s1_cse_detailed_knowledge": {
                "checked": True,
                "label": "Applied unusually detailed knowledge relevant to this case",
            }
        }, {}))
        self.assertEqual(gaps, [])

    def test_every_other_label_is_flagged_in_content_data(self) -> None:
        """The guard is data-driven. If a fourth "other" is added without
        `requires_stage2`, it silently escapes the check — so the flag is
        asserted here against the labels themselves rather than by key."""
        blocks = load_content_data()["question_blocks"]
        stage1 = [
            chk for block in blocks if block.get("page") == 2
            for chk in block.get("checkboxes", [])
        ]
        others = [c for c in stage1 if "in some other way" in c["label"]]
        self.assertEqual(len(others), 3, "expected one 'other' per threshold limb")
        for chk in others:
            with self.subTest(key=chk["key"]):
                self.assertTrue(
                    chk.get("requires_stage2"),
                    f"{chk['key']} is an 'other' label but is not flagged "
                    "requires_stage2, so nothing stops it reaching the LAA bare",
                )

    def test_each_flagged_label_has_a_carrier_that_can_satisfy_it(self) -> None:
        """A `requires_stage2` key with no Stage 2 carrier would be
        unsatisfiable — the solicitor could never get past the gate."""
        blocks = load_content_data()["question_blocks"]
        demanding = [
            chk["key"] for block in blocks if block.get("page") == 2
            for chk in block.get("checkboxes", []) if chk.get("requires_stage2")
        ]
        self.assertTrue(demanding)
        for key in demanding:
            carriers = [
                chk["key"] for block in blocks if block.get("page") == 3
                for chk in block.get("checkboxes", [])
                if key in (chk.get("carried_from") or [])
            ]
            with self.subTest(key=key):
                self.assertTrue(carriers, f"{key} demands Stage 2 but nothing carries it")


if __name__ == "__main__":
    unittest.main()
