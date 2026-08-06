"""Standalone audit for content-data.js's cross-stage extraction contracts."""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from templates import label_to_key_lookup, legacy_label_aliases, load_content_data


PANEL_KEYS = {
    "panel_membership_resolution",
    "panel_membership_children",
    "panel_membership_advanced",
}

REPLACED_LIVE_LABELS = {
    "Applied unusually detailed knowledge of the law or procedure relevant to this case",
    "Adopted a particularly effective tactic, or obtained a better result than would usually be expected",
    "Completed the work in materially less time than a reasonable fee earner would ordinarily have required",
    "The case required substantial out-of-hours work in exceptional circumstances",
    "Particularly effective tactic, or a better result than usually expected",
    "A novel point of law or legal context",
    "The case was of exceptional importance to the client",
    "Exceptional volume of documentation, material or issues",
    "Exceptionally complex legal, expert or evidential issues",
    "Exceptional difficulty in taking instructions",
    "Significant analysis and planning without counsel",
    "Complex drafting without counsel",
}


def main() -> None:
    data = load_content_data()
    templates = data["narrative_templates"]
    blocks = data["question_blocks"]
    aliases = legacy_label_aliases()

    # The template exemption belongs to keys that are *actually in* the page-1
    # panel block, not to three strings that merely look familiar. Checked
    # against PANEL_KEYS rather than replacing it, so moving one of the three
    # out of the panel block, or renaming a panel, trips the audit instead of
    # quietly carrying its exemption to wherever the key ended up.
    live_panel_keys = {
        checkbox["key"]
        for block in blocks
        if block.get("page") == 1 and block.get("id") == "panel"
        for checkbox in block.get("checkboxes", [])
    }
    assert live_panel_keys == PANEL_KEYS, (
        "the page-1 panel block no longer holds exactly the keys this audit "
        f"exempts from the template check. Block has {sorted(live_panel_keys)}, "
        f"audit expects {sorted(PANEL_KEYS)}. If a panel was added, renamed or "
        "moved, update PANEL_KEYS here and check templates.py agrees."
    )

    stage1 = [
        checkbox
        for block in blocks
        if block.get("page") == 2
        for checkbox in block.get("checkboxes", [])
    ]
    stage2 = [
        checkbox
        for block in blocks
        if block.get("page") == 3
        for checkbox in block.get("checkboxes", [])
    ]
    carried = {
        key
        for checkbox in stage2
        for key in checkbox.get("carried_from", [])
    }
    malformed_stage1 = [
        checkbox["key"]
        for checkbox in stage1
        if checkbox.get("explanation") is not False
        or not checkbox.get("what_counts")
        or not checkbox.get("stage2_factor")
        or checkbox["key"] not in carried
    ]
    assert not malformed_stage1, f"malformed/orphan Stage 1 keys: {malformed_stage1}"

    live_keys = {
        checkbox["key"]
        for block in blocks
        for checkbox in block.get("checkboxes", [])
    }
    missing_live_templates = live_keys - PANEL_KEYS - set(templates)
    # PANEL_KEYS is subtracted here too. It was not until 5 August 2026, when
    # the Children Panel label lost "(and work relates to children)" and the old
    # string became the first *legacy* alias pointing at a panel key. Panel keys
    # render through the umbrella panel_membership template rather than one of
    # their own, so they have never had an entry here — the live branch above
    # already allowed for that and this one simply had not needed to yet.
    missing_alias_templates = set(aliases.values()) - PANEL_KEYS - set(templates)
    assert not missing_live_templates, (
        f"live keys without templates: {sorted(missing_live_templates)}"
    )
    assert not missing_alias_templates, (
        f"legacy values without templates: {sorted(missing_alias_templates)}"
    )
    assert "panel_membership" in templates

    # A live key silently bound to a RETIRED template. Added 6 August 2026, after
    # the new Stage 1 novelty label was very nearly given the key `s1_circ_novelty`
    # — which already existed as a retired v1.10 template further down the same
    # object. Both JS object literals and json5 resolve a duplicate key to the LAST
    # occurrence, and the retired block sits after the live one, so the retired
    # template would have won with no error anywhere. The label would have reached
    # the LAA reading "...a unique factual matrix concerning [SPECIFY NOVEL
    # ASPECTS]".
    #
    # The existing template-coverage check could not catch it: it asks whether a
    # key HAS a template, not whether the template is a live one. These two ask
    # what a retired template actually looks like. Every retired entry carries
    # either a [PLACEHOLDER] for the solicitor to fill in by hand or a
    # {USER_EXPLANATION} token from the era when Stage 1 took explanations, and no
    # live entry has either — verified across all 44 live keys when this was added.
    header_keys = {
        block["narrative_header_key"]
        for block in blocks
        if block.get("narrative_header_key")
    }
    placeholder = re.compile(r"\[[A-Z][^\]]*\]")
    with_placeholders = sorted(
        key
        for key in (live_keys | header_keys) & set(templates)
        if placeholder.search(templates[key])
    )
    assert not with_placeholders, (
        "live keys whose template still carries an unfilled [PLACEHOLDER], which "
        "would print verbatim into a bill narrative sent to the LAA: "
        f"{with_placeholders}. The usual cause is a live key colliding with a "
        "retired one — check the RETIRED KEYS block in content-data.js."
    )

    stage1_keys = {checkbox["key"] for checkbox in stage1}
    stage1_with_explanation = sorted(
        key
        for key in stage1_keys & set(templates)
        if "{USER_EXPLANATION}" in templates[key]
    )
    assert not stage1_with_explanation, (
        "Stage 1 keys whose template expects an explanation. Stage 1 is tick-only "
        f"(explanation=false), so nothing ever fills these: {stage1_with_explanation}. "
        "Same likely cause as above — a collision with a retired key."
    )

    lookup = label_to_key_lookup()  # Raises if any live/legacy label is ambiguous.

    missing_replaced_labels = REPLACED_LIVE_LABELS - set(aliases)
    assert not missing_replaced_labels, (
        f"changed live labels missing aliases: {sorted(missing_replaced_labels)}"
    )

    print("STRUCTURAL AUDIT PASS")
    print(
        f"Stage 1: {len(stage1)} checkboxes; explanation=false, what_counts, "
        "stage2_factor and Stage 2 carrier all present"
    )
    print(
        f"Retired-template binding: {len(live_keys | header_keys)} live keys and "
        "headers carry no [PLACEHOLDER]; no Stage 1 template expects an explanation"
    )
    print(
        f"Template coverage: {len(live_keys)} live keys and {len(aliases)} legacy "
        "labels covered (3 panel keys use panel_membership)"
    )
    print(f"Label uniqueness: {len(lookup)} live/legacy labels map unambiguously")
    print(
        f"Changed-label aliases: {len(REPLACED_LIVE_LABELS)} previous live labels retained"
    )


if __name__ == "__main__":
    main()
