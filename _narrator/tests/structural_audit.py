"""Standalone audit for content-data.js's cross-stage extraction contracts."""

from __future__ import annotations

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
    missing_alias_templates = set(aliases.values()) - set(templates)
    assert not missing_live_templates, (
        f"live keys without templates: {sorted(missing_live_templates)}"
    )
    assert not missing_alias_templates, (
        f"legacy values without templates: {sorted(missing_alias_templates)}"
    )
    assert "panel_membership" in templates

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
        f"Template coverage: {len(live_keys)} live keys and {len(aliases)} legacy "
        "labels covered (3 panel keys use panel_membership)"
    )
    print(f"Label uniqueness: {len(lookup)} live/legacy labels map unambiguously")
    print(
        f"Changed-label aliases: {len(REPLACED_LIVE_LABELS)} previous live labels retained"
    )


if __name__ == "__main__":
    main()
