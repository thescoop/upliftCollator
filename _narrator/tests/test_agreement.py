"""Verify singular/plural agreement in the framing sentences.

A claim resting on one factor is ordinary, and the plural wording is not merely
clumsy there: "These factors, individually and/or cumulatively" applied to a
single factor asserts something that cannot be true — in the sentence carrying
the whole justification.

The count is known exactly when the skeleton is built, so this is decided
deterministically rather than left to the polish step, on the same reasoning
that keeps the citation check out of the model's hands. Because the polish step
rewrites these sentences anyway, `checks.agreement_warnings` catches the model
putting the plural back.
"""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import checks  # noqa: E402
import templates  # noqa: E402
from skeleton import build_skeleton  # noqa: E402

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "sample_formdata.json"


def formdata(n_stage1: int, n_stage2: int, n_panel: int = 0) -> dict:
    data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    data["stage1"] = dict(list(data["stage1"].items())[:n_stage1])
    data["stage2"] = dict(list(data["stage2"].items())[:n_stage2])
    data["panelMembership"] = dict(list(data["panelMembership"].items())[:n_panel])
    return data


class TestTemplatesProvideVariants(unittest.TestCase):
    """Guards the guard: the skeleton falls back to the plural if a variant is
    missing, so a deleted key would make every other test here pass silently."""

    def test_every_variant_key_exists(self):
        nt = templates.load_content_data()["narrative_templates"]
        for key in ("intro_singular", "conclusion_singular",
                    "stage2_intro_narrative_singular", "panel_membership_plural"):
            self.assertIn(key, nt)


class TestSingleFactorSkeleton(unittest.TestCase):
    def setUp(self):
        self.md = build_skeleton(formdata(n_stage1=1, n_stage2=0))

    def test_the_intro_is_singular(self):
        self.assertIn("the following exceptional factor,", self.md)
        self.assertNotIn("the following exceptional factors", self.md)

    def test_the_conclusion_drops_the_incoherent_phrase(self):
        """One factor cannot be weighed 'individually and/or cumulatively'."""
        self.assertNotIn("individually and/or cumulatively", self.md)
        self.assertIn("This factor made the work exceptional", self.md)

    def test_no_plural_giveaway_survives_anywhere(self):
        self.assertEqual(checks.agreement_warnings(self.md, 1), [])


class TestFactorCountSpansBothStages(unittest.TestCase):
    def test_one_in_each_stage_is_two_factors_so_plural(self):
        md = build_skeleton(formdata(n_stage1=1, n_stage2=1))
        self.assertIn("the following exceptional factors", md)
        self.assertIn("These factors, individually and/or cumulatively", md)

    def test_a_lone_stage2_factor_makes_its_own_intro_singular(self):
        md = build_skeleton(formdata(n_stage1=2, n_stage2=1))
        self.assertIn("justified by the following factor:", md)
        # ...while the overall claim rests on three, so the framing stays plural.
        self.assertIn("the following exceptional factors", md)

    def test_panel_membership_is_not_counted_as_a_factor(self):
        """Panel is the separate guaranteed 15%, not an exceptional factor."""
        data = formdata(n_stage1=1, n_stage2=0, n_panel=2)
        self.assertEqual(checks.count_factors(data), 1)
        self.assertIn("the following exceptional factor,", build_skeleton(data))


class TestPanelPluralisation(unittest.TestCase):
    """What these two used to assert was the singular/plural split between
    "scope of this accreditation" and "scope of those accreditations". That
    clause was removed on 5 August 2026 as unsourced — see the comment above
    `panel_membership` in content-data.js — so the pluralisation now shows up
    only in how the panel names themselves are joined. That is the thing worth
    testing, because a mis-join is what a reader would actually notice."""

    def test_one_panel_names_it_alone(self):
        md = build_skeleton(formdata(n_stage1=2, n_stage2=1, n_panel=1))
        self.assertIn("is a member of the Resolution Accredited Specialist Panel.", md)

    def test_two_panels_are_joined_with_and(self):
        md = build_skeleton(formdata(n_stage1=2, n_stage2=1, n_panel=2))
        self.assertIn(
            "Resolution Accredited Specialist Panel and Law Society Children Panel",
            md,
        )


class TestPanelClaimsNoScopeCondition(unittest.TestCase):
    """A regression guard, not a style check.

    CAG 12.21 says the panel enhancement "is applied to all work done in any
    family case". The narrative used to volunteer the opposite — that the work
    "falls within the scope of this accreditation" — which is a restriction no
    contract term imposes and an invitation to a challenge nothing requires.
    Absence is the whole point of these assertions, so they must stay even
    though they look like they test nothing."""

    def test_no_scope_qualifier_for_one_panel(self):
        md = build_skeleton(formdata(n_stage1=2, n_stage2=1, n_panel=1))
        self.assertNotIn("scope of this accreditation", md)
        self.assertNotIn("falls within the scope", md)

    def test_no_scope_qualifier_for_several_panels(self):
        md = build_skeleton(formdata(n_stage1=2, n_stage2=1, n_panel=2))
        self.assertNotIn("scope of those accreditations", md)
        self.assertNotIn("falls within the scope", md)

    def test_the_live_children_panel_label_carries_no_condition(self):
        """The condition lived in the *label*, so this is the load-bearing check.

        "(and work relates to children)" was a real term of the 2013 Family
        Specification, dropped in 2018 and absent from the operative 2024 rules.
        A new claim must not reimpose it."""
        labels = [
            chk["label"]
            for block in templates.load_content_data()["question_blocks"]
            if block.get("id") == "panel"
            for chk in block["checkboxes"]
        ]
        self.assertIn("Fee earner is on Law Society Children Panel", labels)
        for label in labels:
            self.assertNotIn("relates to children", label)
            self.assertNotIn("scope", label.lower())

    def test_a_legacy_pdf_still_reads_back_as_it_was_written(self):
        """Deliberately NOT normalised, on the same reasoning that keeps the
        retired narrative templates intact: a PDF sitting in a live matter said
        what it said, and re-rendering it with today's wording would put words
        into a document the solicitor already approved. The fixture carries the
        pre-5-August-2026 label precisely so this stays covered."""
        data = formdata(n_stage1=2, n_stage2=1, n_panel=2)
        legacy = data["panelMembership"]["panel_membership_children"]["label"]
        self.assertIn("(and work relates to children)", legacy)
        self.assertIn("(and work relates to children)", build_skeleton(data))

    def test_the_legacy_children_label_still_maps_to_its_key(self):
        """Without the LEGACY_LABEL_ALIASES entry added alongside the relabel,
        every PDF produced before 5 August 2026 stops extracting."""
        lookup = templates.label_to_key_lookup()
        self.assertEqual(
            lookup["Fee earner is on Law Society Children Panel (and work relates to children)"],
            "panel_membership_children",
        )
        self.assertEqual(
            lookup["Fee earner is on Law Society Children Panel"],
            "panel_membership_children",
        )


class TestMultiFactorIsUnchanged(unittest.TestCase):
    """The common case must not regress while fixing the rare one."""

    def test_the_full_fixture_still_reads_plural(self):
        md = build_skeleton(json.loads(FIXTURE.read_text(encoding="utf-8")))
        self.assertIn("the following exceptional factors", md)
        self.assertIn("These factors, individually and/or cumulatively", md)


class TestAgreementWarnings(unittest.TestCase):
    SINGLE = "An enhancement is claimed due to the following exceptional factor:"

    def test_silent_when_the_claim_rests_on_several_factors(self):
        plural = "These factors, individually and/or cumulatively, rendered it so."
        self.assertEqual(checks.agreement_warnings(plural, 3), [])

    def test_catches_the_model_restoring_the_plural(self):
        polished = ("Due to the following exceptional factors: ... These factors, "
                    "individually and/or cumulatively, rendered the work demanding.")
        found = checks.agreement_warnings(polished, 1)
        self.assertIn("individually and/or cumulatively", found)
        self.assertIn("These factors", found)

    def test_matching_is_case_insensitive(self):
        self.assertTrue(checks.agreement_warnings("THESE FACTORS applied.", 1))

    def test_clean_singular_prose_warns_about_nothing(self):
        self.assertEqual(checks.agreement_warnings(self.SINGLE, 1), [])

    def test_zero_factors_is_not_treated_as_singular(self):
        """An empty extraction already stops the run; do not also nag about it."""
        self.assertEqual(checks.agreement_warnings("These factors applied.", 0), [])


class TestWarningDoesNotFailTheRun(unittest.TestCase):
    """Bad grammar is an embarrassment, not a false statement to the LAA.
    Turning the verdict red over it would train the reader to ignore red."""

    def result(self):
        skeleton = "Claimed under CPR 44.4(3)."
        polished = "Claimed under CPR 44.4(3). These factors applied."
        return checks.check(skeleton, polished, n_factors=1)

    def test_the_warning_is_recorded(self):
        self.assertIn("These factors", self.result().agreement)

    def test_but_the_verdict_stays_green(self):
        res = self.result()
        self.assertTrue(res.ok)
        self.assertEqual(res.verdict, "SAFE TO REVIEW")

    def test_the_report_explains_it_and_says_it_is_not_counted(self):
        report = checks.format_report(self.result())
        self.assertIn("## Number agreement", report)
        self.assertIn("single factor", report)
        self.assertIn("Not counted against the verdict", report)

    def test_no_agreement_section_when_the_count_is_unknown(self):
        """Callers that don't pass n_factors get the old behaviour exactly."""
        res = checks.check("CPR 44.4(3)", "CPR 44.4(3) these factors")
        self.assertEqual(res.agreement, [])
        self.assertNotIn("## Number agreement", checks.format_report(res))


if __name__ == "__main__":
    unittest.main()
