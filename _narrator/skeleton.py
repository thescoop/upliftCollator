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

from extract import deemed_threshold_support, threshold_coherence_error
from templates import load_content_data


# QUESTION_BLOCKS no longer contains the pre-v1.11 grouping, but old PDFs still
# carry keys from those three Stage 2 blocks and five retired Stage 1 criteria.
# The templates deliberately retain both the retired bullets and their headers;
# this small structural index is what lets the narrator reach them. Without it,
# extraction would resolve the historical label successfully and skeleton
# assembly would then silently drop the same factor one step later.
_LEGACY_BLOCKS = [
    {
        "page": 2,
        "narrative_header_key": "s1_competence_skill_expertise_header_narrative",
        "checkboxes": [
            {"key": key}
            for key in (
                "s1_cse_detailed_knowledge",
                "s1_cse_difficult_argument",
                "s1_cse_marshalling_evidence",
                "s1_cse_effective_tactic",
                "s1_cse_effective_tactic_or_better_result_legacy",
                "s1_cse_less_time",
                "s1_cse_better_result",
                "s1_cse_vulnerable_client",
            )
        ],
    },
    {
        "page": 2,
        "narrative_header_key": "s1_exceptional_speed_header_narrative",
        "checkboxes": [
            {"key": key}
            for key in (
                "s1_speed_proactive_pursuit",
                "s1_speed_urgent_deadlines",
            )
        ],
    },
    {
        "page": 2,
        "narrative_header_key": "s1_exceptional_circumstances_complexity_header_narrative",
        "checkboxes": [
            {"key": key}
            for key in (
                "s1_circ_legal_issues",
                "s1_circ_expert_evidence",
                "s1_circ_evidential_issues",
                "s1_circ_difficult_instructions",
                "s1_circ_client_impact",
                "s1_circ_out_of_hours",
                "s1_circ_novelty",
                "s1_circ_weight_volume",
            )
        ],
    },
    {
        "page": 3,
        "narrative_header_key": "s2_responsibility_header_narrative",
        "checkboxes": [
            {"key": key}
            for key in (
                "s2_resp_no_counsel_analysis",
                "s2_resp_no_counsel_drafting",
                "s2_resp_no_counsel_advocacy",
                "s2_resp_addressed_expert_issues",
            )
        ],
    },
    {
        "page": 3,
        "narrative_header_key": "s2_care_speed_economy_header_narrative",
        "checkboxes": [
            {"key": key}
            for key in (
                "s2_cse_care_skill",
                "s2_cse_care_vulnerable_client",
                "s2_care_effective_tactic_or_better_result_legacy",
                "s2_cse_speed",
                "s2_cse_economy_efficiency",
            )
        ],
    },
    {
        "page": 3,
        "narrative_header_key": "s2_novelty_weight_complexity_header_narrative",
        "checkboxes": [
            {"key": key}
            for key in (
                "s2_nwc_novelty_law",
                "s2_nwc_weight_docs_issues",
                "s2_nwc_complexity_overall",
            )
        ],
    },
]


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


def _pick_by_count(templates: dict, base: str, count: int, variant: str) -> str:
    """Choose the singular or plural wording of a framing sentence.

    A claim resting on one factor is ordinary, and the plural wording is not
    merely clumsy there: "These factors, individually and/or cumulatively"
    applied to a single factor asserts something that cannot be true, in the
    sentence that carries the whole justification.

    The count is known exactly at this point, so this is decided here rather
    than left to the polish step — the same reasoning that keeps the citation
    check out of the model's hands. ``prompts/system.md`` additionally tells the
    model to preserve the agreement it is given, and ``checks.agreement()``
    reports it if the model puts the plural back.

    Falls back to *base* when the variant is absent, so an edited or older
    content-data.js still renders.
    """
    if variant == "singular" and count == 1:
        return templates.get(f"{base}_singular", templates[base])
    if variant == "plural" and count > 1:
        return templates.get(f"{base}_plural", templates[base])
    return templates[base]


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
            tpl = templates.get(key)
            if tpl:
                # New Stage 1 templates intentionally have no explanation
                # placeholder. Do not manufacture an empty blockquote or add
                # punctuation around prose the redesigned form never collects.
                # Stage 2, and retired legacy templates, keep their verbatim
                # explanation handling because their templates ask for it.
                explanation_block = ""
                if "{USER_EXPLANATION}" in tpl:
                    explanation_block = _fmt_explanation(item.get("explanation", ""))
                parts.append(
                    _substitute(
                        tpl,
                        {**common, "USER_EXPLANATION": explanation_block},
                    )
                )
            else:
                # Orphan key (no template) — render minimally so it's still in the output.
                explanation_block = _fmt_explanation(item.get("explanation", ""))
                parts.append(f"    - {item.get('label', key)}{explanation_block}")
            parts.append("")
    return "\n".join(parts)


def _stage_blocks(section: dict, live_blocks: list[dict], page_num: int) -> list[dict]:
    """Choose the block structure belonging to the submitted PDF generation.

    A retired key proves that the old three-block Stage 2 structure is required
    to reach its retained template. Historical label wording alone does not:
    labels can change while their keys remain in the current seven-factor schema.
    A corrected/resumed data file can contain both generations, so the result may
    combine historical blocks with current-only criteria.
    """
    live_keys = {
        checkbox["key"]
        for block in live_blocks
        if block.get("page") == page_num
        for checkbox in block.get("checkboxes", [])
    }
    # Labels can change without changing the block schema. Such labels live in
    # LEGACY_LABEL_ALIASES for PDF extraction, but must still use the current
    # blocks; selecting _LEGACY_BLOCKS merely because the wording is historical
    # can drop a current key that never existed in the pre-v1.11 layout. A retired
    # key, by contrast, is definitive evidence that the old layout is required.
    is_legacy = any(key not in live_keys for key in section)
    if not is_legacy:
        return live_blocks

    # A recovered/corrected data file can legitimately contain criteria from
    # both schemas. Keep the historical layout for retired keys, then add only
    # current-only keys so none disappears and shared keys are not duplicated.
    legacy_keys = {
        checkbox["key"]
        for block in _LEGACY_BLOCKS
        if block.get("page") == page_num
        for checkbox in block.get("checkboxes", [])
    }
    current_only_blocks = []
    for block in live_blocks:
        if block.get("page") != page_num:
            continue
        checkboxes = [
            checkbox
            for checkbox in block.get("checkboxes", [])
            if checkbox["key"] not in legacy_keys
        ]
        if checkboxes:
            current_only_blocks.append({**block, "checkboxes": checkboxes})
    return _LEGACY_BLOCKS + current_only_blocks


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

    # The structural guarantee, as well as the friendly stops in narrate.py and
    # narrate_gui.py. Those two are what a user sees; this is what makes the rule
    # true. build_skeleton is the one function every entry point must pass
    # through — the CLI, --from-json, the GUI's independent pipeline, and
    # skeleton.py's own __main__ — so putting the check anywhere else means
    # putting it in four places and finding out later that it went into three.
    # This project has shipped exactly that bug twice: the "other"-factor guard
    # went into narrate.py alone while the GUI is what the launchers run, and the
    # panel section guard was missed on --from-json.
    refusal = threshold_coherence_error(formdata)
    if refusal:
        raise ValueError(refusal)

    # Deemed only when nothing is ticked at Stage 1. A document with both a
    # deemed line and ticked factors states its threshold the ordinary way, and
    # the ordinary paragraph is the stronger one — asserted factors beat a
    # contractual presumption in front of an assessor.
    deemed = not stage1 and deemed_threshold_support(formdata) is None

    # "The following exceptional factors" and the conclusion both refer to
    # everything the claim rests on — the Stage 1 and Stage 2 criteria. Panel
    # membership is not one of them: it is the separate guaranteed 15%.
    n_factors = len(stage1) + len(stage2)

    sections: list[str] = [
        _substitute(
            _pick_by_count(
                templates, "intro_deemed" if deemed else "intro", n_factors, "singular"
            ),
            common,
        )
    ]

    panel_names = ""
    if panel:
        panel_labels = [_clean_panel_label(item["label"]) for item in panel.values()]
        panel_names = _join_panels(panel_labels)
        sections.append(
            _substitute(
                _pick_by_count(templates, "panel_membership", len(panel), "plural"),
                {**common, "PANEL_NAME": panel_names},
            )
        )

    # The deemed paragraph stands in place of the Stage 1 factor list. It is
    # emitted here, in the Stage 1 slot, so the narrative always carries a
    # threshold section: before this, a document with no Stage 1 factors produced
    # a narrative with no threshold paragraph at all, silently.
    if deemed:
        sections.append(
            _substitute(
                templates["threshold_deemed_narrative"],
                {**common, "PANEL_NAME": panel_names},
            )
        )

    stage1_md = _build_stage(
        stage1,
        _stage_blocks(stage1, blocks, 2),
        2,
        templates["threshold_intro_narrative"],
        templates,
        common,
    )
    if stage1_md:
        sections.append(stage1_md)

    stage2_md = _build_stage(
        stage2, _stage_blocks(stage2, blocks, 3), 3,
        _pick_by_count(templates, "stage2_intro_narrative", len(stage2), "singular"),
        templates, common,
    )
    if stage2_md:
        sections.append(stage2_md)

    sections.append(_pick_by_count(templates, "conclusion", n_factors, "singular"))
    if formdata.get("evidenceOnFileConfirmed"):
        sections.append(
            _pick_by_count(templates, "evidence_on_file", n_factors, "singular")
        )

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
