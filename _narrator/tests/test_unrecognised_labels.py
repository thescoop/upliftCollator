"""A ticked item whose label matches nothing must stop the run, not vanish.

The failure this guards against is silent: ``extract_criteria`` used to print a
line to stderr and carry on, so a criterion the solicitor ticked disappeared
from the narrative with nothing in the finished document to show it had gone.
Both real examples below came off a PDF that had been through OCR — a bracket
read as a brace, and a space lost before a slash.
"""

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import narrate  # noqa: E402
from extract import (  # noqa: E402
    LABEL_MATCH_FLOOR,
    describe_unrecognised_criteria,
    extract_criteria,
    extract_formdata,
    extract_panel,
    load_formdata_json,
)
from templates import label_to_key_lookup  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures"

# Exactly as they came back from the OCR'd PDF on 4 August 2026.
DAMAGED_S1 = "Exceptional weight (documentation volume/ number of issues)"
DAMAGED_S2 = "Exceptional weight {docs/issues) (as per Stage 1)"
GOOD_S1 = "Exceptional weight (documentation volume / number of issues)"
GOOD_S2 = "Exceptional weight (docs/issues) (as per Stage 1)"

EXPLANATION = "The disclosure ran to 1,400 pages across 11 lever arch files."


def _stage_text(section_heading: str, label: str, explanation: str) -> str:
    """A minimal slice of PDF text in the shape addCriterion renders."""
    return (
        f"{section_heading}\n"
        f"•  {label}\n"
        "Determining Level of Enhancement: Novelty, Weight & Complexity\n"
        f"Explanation: {explanation}\n"
        "PROPOSED UPLIFT\n"
        "Proposed Uplift Percentage: 50 %\n"
    )


class DamagedLabelsAreRecordedTests(unittest.TestCase):
    def setUp(self) -> None:
        self.label_keys = label_to_key_lookup()

    def test_the_two_real_labels_are_genuinely_absent_from_content_data(self):
        # If either of these ever matched, the rest of this file proves nothing.
        self.assertNotIn(DAMAGED_S1, self.label_keys)
        self.assertNotIn(DAMAGED_S2, self.label_keys)
        self.assertIn(GOOD_S1, self.label_keys)
        self.assertIn(GOOD_S2, self.label_keys)

    def test_unmatched_criterion_is_collected_rather_than_dropped(self):
        unmatched: list[dict] = []
        text = _stage_text(
            "STAGE 2: LEVEL OF ENHANCEMENT FACTORS", DAMAGED_S2, EXPLANATION
        )
        result = extract_criteria(text, "stage2", self.label_keys, unmatched)
        self.assertEqual(result, {})
        self.assertEqual(len(unmatched), 1)
        self.assertEqual(unmatched[0]["label"], DAMAGED_S2)
        self.assertEqual(unmatched[0]["section"], "stage2")
        self.assertEqual(unmatched[0]["nearest"], GOOD_S2)
        # Carried so a corrected label can be re-resolved without the PDF.
        self.assertEqual(unmatched[0]["explanation"], EXPLANATION)

    def test_stage1_damage_finds_its_own_nearest_label(self):
        unmatched: list[dict] = []
        text = _stage_text(
            "STAGE 1: THRESHOLD TEST SELECTIONS", DAMAGED_S1, EXPLANATION
        )
        extract_criteria(text, "stage1", self.label_keys, unmatched)
        self.assertEqual(unmatched[0]["nearest"], GOOD_S1)

    def test_a_good_label_records_nothing(self):
        unmatched: list[dict] = []
        text = _stage_text(
            "STAGE 2: LEVEL OF ENHANCEMENT FACTORS", GOOD_S2, EXPLANATION
        )
        result = extract_criteria(text, "stage2", self.label_keys, unmatched)
        self.assertEqual(unmatched, [])
        self.assertEqual(len(result), 1)

    def test_panel_membership_is_guarded_too(self):
        # A panel tick can be worth more than every criterion combined.
        unmatched: list[dict] = []
        text = "PANEL MEMBERSHIP\n•  Fee earner is on Resolution Accredted Panel\nSTAGE 1: THRESHOLD TEST SELECTIONS\n"
        result = extract_panel(text, self.label_keys, unmatched)
        self.assertEqual(result, {})
        self.assertEqual(len(unmatched), 1)
        self.assertEqual(unmatched[0]["section"], "panelMembership")

    def test_the_clean_fixture_reports_nothing_unrecognised(self):
        data = extract_formdata(FIXTURES / "sample.pdf")
        self.assertNotIn("unrecognised", data)


class ReportIsSafeToShareTests(unittest.TestCase):
    """The report follows diagnose()'s rule: structure, never case text."""

    def test_a_damaged_label_is_never_echoed_but_the_difference_is_named(self):
        """Reversed on 7 August 2026 — this test used to REQUIRE the read text
        to be echoed, on the premise that a near-match is a fixed label with
        noise in it. The premise fails when damage merges a label with the
        line after it: LABEL + CLIENT TEXT still scores far above the floor.
        Now the known label, the length and the single differing character
        are shown, and the read text never is."""
        text = describe_unrecognised_criteria(
            [{"section": "stage2", "label": DAMAGED_S2, "nearest": GOOD_S2}]
        )
        self.assertNotIn(DAMAGED_S2, text)
        self.assertIn(GOOD_S2, text)
        self.assertIn(str(len(DAMAGED_S2)), text)
        self.assertIn("read '{', expected '('", text)

    def test_a_label_merged_with_client_text_leaks_nothing(self):
        """The concatenation case that forced the reversal: a long real label
        with a short client suffix scores above the floor, so under the old
        rule the suffix printed. It must not."""
        merged = GOOD_S2 + " for child John Smith in care proceedings"
        text = describe_unrecognised_criteria(
            [{"section": "stage2", "label": merged, "nearest": GOOD_S2}]
        )
        self.assertNotIn("John Smith", text)
        self.assertIn(GOOD_S2, text)

    def test_the_lost_space_is_named_as_a_space(self):
        text = describe_unrecognised_criteria(
            [{"section": "stage1", "label": DAMAGED_S1, "nearest": GOOD_S1}]
        )
        self.assertIn("read '/', expected ' '", text)

    def test_explanation_text_never_reaches_the_report(self):
        text = describe_unrecognised_criteria(
            [{
                "section": "stage2",
                "label": DAMAGED_S2,
                "nearest": GOOD_S2,
                "explanation": EXPLANATION,
                "categoryTitle": "Novelty, Weight & Complexity",
            }]
        )
        self.assertNotIn(EXPLANATION, text)
        self.assertNotIn("1,400", text)

    def test_a_line_unlike_any_label_is_not_echoed(self):
        # A line of the solicitor's own prose that happened to start with a
        # bullet is not a mangled label, and may name the family.
        prose = "• The mother disclosed that the children had been removed."
        text = describe_unrecognised_criteria(
            [{"section": "stage1", "label": prose, "nearest": ""}]
        )
        self.assertNotIn("mother", text)
        self.assertNotIn(prose, text)
        self.assertIn(str(len(prose)), text)

    def test_the_floor_is_what_decides_whether_a_label_is_echoed(self):
        unmatched: list[dict] = []
        prose = "The parties attended a hearing on 2 April '26 before the judge."
        text = _stage_text("STAGE 1: THRESHOLD TEST SELECTIONS", prose, EXPLANATION)
        extract_criteria(text, "stage1", label_to_key_lookup(), unmatched)
        self.assertLess(unmatched[0]["similarity"], LABEL_MATCH_FLOOR)
        self.assertEqual(unmatched[0]["nearest"], "")

    def test_report_explains_why_the_text_is_not_repeated(self):
        text = describe_unrecognised_criteria(
            [{"section": "stage2", "label": DAMAGED_S2, "nearest": GOOD_S2}]
        )
        self.assertIn("not repeated here", text)
        self.assertIn("narrative-input.json", text)


class ResumeFromCorrectedJsonTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)
        self.data = extract_formdata(FIXTURES / "sample.pdf")

    def _write(self, data: dict) -> Path:
        path = self.dir / "narrative-input.json"
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return path

    def _with_damage(self, label: str = DAMAGED_S2) -> Path:
        data = dict(self.data)
        data["unrecognised"] = [{
            "section": "stage2",
            "label": label,
            "nearest": GOOD_S2,
            "similarity": 0.98,
            "categoryTitle": "Novelty, Weight & Complexity",
            "explanation": EXPLANATION,
        }]
        return self._write(data)

    def test_a_corrected_label_is_resolved_into_its_section(self):
        path = self._with_damage(GOOD_S2)  # as if the user fixed the brace
        loaded = load_formdata_json(path)
        self.assertNotIn("unrecognised", loaded)
        key = label_to_key_lookup()[GOOD_S2]
        self.assertIn(key, loaded["stage2"])
        # The solicitor's words survive the round trip untouched.
        self.assertEqual(loaded["stage2"][key]["explanation"], EXPLANATION)

    def test_an_uncorrected_label_still_stops_the_run(self):
        loaded = load_formdata_json(self._with_damage())
        self.assertEqual(len(loaded["unrecognised"]), 1)
        self.assertEqual(loaded["unrecognised"][0]["label"], DAMAGED_S2)

    def test_a_near_miss_correction_is_not_accepted(self):
        # Re-resolved against content-data.js, so "close enough" is not enough.
        loaded = load_formdata_json(self._with_damage(GOOD_S2.replace("(as", "(As")))
        self.assertEqual(len(loaded["unrecognised"]), 1)

    def test_a_label_from_the_wrong_stage_is_not_accepted_on_resume(self):
        """The recovery path applies the same section check as the first read.

        Without it the guard undid itself: a label rejected on reading the PDF
        because it belonged to the other stage could be accepted, unchanged,
        simply by re-running ``--from-json`` on the file the stop had just
        written. Nothing had to be edited, and the report named the offending
        label as its own closest match, so it read as though nothing needed
        correcting. The factor was then filed under a heading the solicitor
        never wrote, and dropped out of the narrative.
        """
        stage2_label = next(
            label
            for label, key in label_to_key_lookup().items()
            if key.startswith("s2_")
        )
        data = dict(self.data)
        data["unrecognised"] = [{
            "section": "stage1",          # the wrong stage for this label
            "label": stage2_label,
            "nearest": stage2_label,
            "similarity": 1.0,
            "categoryTitle": "Threshold limb (a)",
            "explanation": EXPLANATION,
        }]
        loaded = load_formdata_json(self._write(data))
        self.assertEqual(len(loaded.get("unrecognised", [])), 1)
        self.assertNotIn(
            label_to_key_lookup()[stage2_label], loaded.get("stage1", {})
        )

    def test_untouched_data_survives_the_round_trip(self):
        loaded = load_formdata_json(self._write(self.data))
        self.assertEqual(loaded["stage1"], self.data["stage1"])
        self.assertEqual(loaded["caseDetails"], self.data["caseDetails"])
        self.assertEqual(
            loaded["finalUpliftPercent"], self.data["finalUpliftPercent"]
        )

    def test_a_file_that_is_not_formdata_is_refused(self):
        path = self.dir / "narrative-input.json"
        path.write_text('["not", "an", "object"]', encoding="utf-8")
        with self.assertRaises(ValueError):
            load_formdata_json(path)

    def test_a_section_of_the_wrong_shape_is_refused(self):
        data = dict(self.data)
        data["stage1"] = ["not", "a", "dict"]
        with self.assertRaises(ValueError):
            load_formdata_json(self._write(data))


class NarrateStopsAndResumesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.dir = Path(self.tmp.name)
        self.data = extract_formdata(FIXTURES / "sample.pdf")

    def _input_json(self, damaged_label: str | None) -> Path:
        data = dict(self.data)
        if damaged_label is not None:
            data["unrecognised"] = [{
                "section": "stage2",
                "label": damaged_label,
                "nearest": GOOD_S2,
                "similarity": 0.98,
                "categoryTitle": "Novelty, Weight & Complexity",
                "explanation": EXPLANATION,
            }]
        path = self.dir / "narrative-input.json"
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return path

    def test_an_unmatched_label_stops_the_run_with_its_own_exit_code(self):
        path = self._input_json(DAMAGED_S2)
        code = narrate.main(["--from-json", str(path), "--out-dir", str(self.dir)])
        self.assertEqual(code, 5)

    def test_the_stop_writes_no_narrative(self):
        path = self._input_json(DAMAGED_S2)
        narrate.main(["--from-json", str(path), "--out-dir", str(self.dir)])
        self.assertFalse((self.dir / "narrative.md").exists())
        self.assertFalse((self.dir / "narrative-polished.md").exists())

    def test_the_stop_leaves_a_file_that_can_be_corrected(self):
        path = self._input_json(DAMAGED_S2)
        narrate.main(["--from-json", str(path), "--out-dir", str(self.dir)])
        written = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(written["unrecognised"][0]["label"], DAMAGED_S2)
        self.assertEqual(written["unrecognised"][0]["explanation"], EXPLANATION)

    def test_a_stale_narrative_is_cleared_rather_than_left_looking_current(self):
        (self.dir / "narrative.md").write_text("from an earlier run", encoding="utf-8")
        (self.dir / "narrative-polished.md").write_text("older still", encoding="utf-8")
        path = self._input_json(DAMAGED_S2)
        narrate.main(["--from-json", str(path), "--out-dir", str(self.dir)])
        self.assertFalse((self.dir / "narrative.md").exists())
        self.assertFalse((self.dir / "narrative-polished.md").exists())

    def test_the_corrected_file_runs_through(self):
        path = self._input_json(GOOD_S2)
        code = narrate.main(["--from-json", str(path), "--out-dir", str(self.dir)])
        self.assertEqual(code, 0)
        self.assertTrue((self.dir / "narrative.md").exists())
        skeleton = (self.dir / "narrative.md").read_text(encoding="utf-8")
        # The recovered factor is in the narrative, which was the whole point.
        self.assertIn(EXPLANATION, skeleton)

    def test_a_clean_file_needs_no_unrecognised_key_at_all(self):
        path = self._input_json(None)
        self.assertEqual(
            narrate.main(["--from-json", str(path), "--out-dir", str(self.dir)]), 0
        )


class ArgumentHandlingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def test_neither_a_pdf_nor_json_is_refused(self):
        self.assertEqual(narrate.main([]), 2)

    def test_both_a_pdf_and_json_is_refused(self):
        self.assertEqual(
            narrate.main([str(FIXTURES / "sample.pdf"), "--from-json", "x.json"]), 2
        )

    def test_a_missing_json_is_refused(self):
        self.assertEqual(
            narrate.main(["--from-json", str(Path(self.tmp.name) / "nope.json")]), 2
        )

    def test_unreadable_json_is_refused_rather_than_crashing(self):
        path = Path(self.tmp.name) / "narrative-input.json"
        path.write_text("{ not json", encoding="utf-8")
        self.assertEqual(narrate.main(["--from-json", str(path)]), 2)

    def test_debug_needs_a_pdf(self):
        path = Path(self.tmp.name) / "narrative-input.json"
        path.write_text("{}", encoding="utf-8")
        self.assertEqual(narrate.main(["--from-json", str(path), "--debug"]), 2)


if __name__ == "__main__":
    unittest.main()
