"""Build a structured Markdown skeleton from extracted formData.

Uses NARRATIVE_TEMPLATES from content-data.js — each ticked checkbox key has a
hand-authored snippet with the relevant CAG/Spec citation already embedded —
and substitutes the live values:

  {UPLIFT_PERCENT}    → formData["finalUpliftPercent"]
  {ITEM_OF_WORK}      → "{matterType}: {caseMatterName}"
  {FEE_EARNER_NAME}   → formData["caseDetails"]["feeEarnerName"]
  {PANEL_NAME}        → ticked panel name(s) joined for natural-language flow
  {USER_EXPLANATION}  → the solicitor's verbatim text as a Markdown blockquote

Bracketed placeholders inside template strings (e.g. ``[SPECIFY ARGUMENT]``)
are intentionally left in place — they cue the LLM polish step (or a human
reviewer) to draw on the solicitor's verbatim explanation when filling them in.
"""

from __future__ import annotations

from templates import load_content_data


def _item_of_work(case_details: dict) -> str:
    matter = (case_details.get("matterType") or "").strip()
    case = (case_details.get("caseMatterName") or "").strip()
    if matter and case:
        return f"{matter}: {case}"
    return matter or case or "[case]"


def _fmt_explanation(explanation: str) -> str:
    """Render the solicitor's verbatim explanation as a Markdown blockquote."""
    explanation = (explanation or "").strip()
    if not explanation:
        return ""
    quoted = "\n".join(f"> {line}" if line else ">" for line in explanation.splitlines())
    return f"\n\n{quoted}\n"


def _clean_panel_label(label: str) -> str:
    """Strip the leading 'Fee earner is on ' so the panel name reads naturally
    after 'is a member of the' in the panel template."""
    prefix = "Fee earner is on "
    return label[len(prefix):] if label.startswith(prefix) else label


def _join_panels(labels: list[str]) -> str:
    """Comma + 'and' join. ['A'] → 'A'. ['A','B'] → 'A and B'. ['A','B','C'] → 'A, B and C'."""
    if not labels:
        return ""
    if len(labels) == 1:
        return labels[0]
    return ", ".join(labels[:-1]) + " and " + labels[-1]


def _substitute(template: str, mapping: dict[str, str]) -> str:
    out = template
    for k, v in mapping.items():
        out = out.replace("{" + k + "}", v)
    return out


def _build_stage(
    section: dict,
    blocks: list[dict],
    page_num: int,
    intro_template: str,
    templates: dict,
    common: dict,
) -> str:
    """Render one stage (Stage 1 = page 2, Stage 2 = page 3) preserving the
    original block order from QUESTION_BLOCKS."""
    if not section:
        return ""
    parts: list[str] = [_substitute(intro_template, common), ""]
    for block in blocks:
        if block.get("page") != page_num:
            continue
        block_keys = [c["key"] for c in block.get("checkboxes", [])]
        ticked = [(k, section[k]) for k in block_keys if k in section]
        if not ticked:
            continue
        header_key = block.get("narrative_header_key")
        if header_key and header_key in templates:
            parts.append(_substitute(templates[header_key], common))
            parts.append("")
        for key, item in ticked:
            explanation_block = _fmt_explanation(item.get("explanation", ""))
            tpl = templates.get(key)
            if tpl:
                parts.append(_substitute(tpl, {**common, "USER_EXPLANATION": explanation_block}))
            else:
                # Orphan key (no template) — render minimally so it's still in the output.
                parts.append(f"    - {item.get('label', key)}{explanation_block}")
            parts.append("")
    return "\n".join(parts)


def build_skeleton(formdata: dict) -> str:
    """Assemble the full Markdown skeleton for a single case."""
    data = load_content_data()
    templates = data["narrative_templates"]
    blocks = data["question_blocks"]

    case = formdata.get("caseDetails", {})
    panel = formdata.get("panelMembership", {})
    stage1 = formdata.get("stage1", {})
    stage2 = formdata.get("stage2", {})
    uplift = (formdata.get("finalUpliftPercent") or "").strip()

    common = {
        "UPLIFT_PERCENT": uplift or "[uplift %]",
        "ITEM_OF_WORK": _item_of_work(case),
        "FEE_EARNER_NAME": (case.get("feeEarnerName") or "").strip() or "[fee earner]",
    }

    sections: list[str] = [_substitute(templates["intro"], common)]

    if panel:
        panel_labels = [_clean_panel_label(item["label"]) for item in panel.values()]
        sections.append(
            _substitute(
                templates["panel_membership"],
                {**common, "PANEL_NAME": _join_panels(panel_labels)},
            )
        )

    stage1_md = _build_stage(stage1, blocks, 2, templates["threshold_intro_narrative"], templates, common)
    if stage1_md:
        sections.append(stage1_md)

    stage2_md = _build_stage(stage2, blocks, 3, templates["stage2_intro_narrative"], templates, common)
    if stage2_md:
        sections.append(stage2_md)

    sections.append(templates["conclusion"])

    return "\n\n".join(s.strip("\n") for s in sections if s.strip())


if __name__ == "__main__":
    import json
    import sys

    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <formdata.json>", file=sys.stderr)
        sys.exit(1)
    with open(sys.argv[1]) as f:
        formdata = json.load(f)
    print(build_skeleton(formdata))
