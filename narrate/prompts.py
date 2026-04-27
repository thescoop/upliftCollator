"""Assemble a paste-ready LM Studio prompt from the skeleton and case meta.

Reads the static templates in narrate/prompts/ and substitutes case fields and
the rendered skeleton. Output is a single text file with two clearly-marked
blocks: ``--- SYSTEM PROMPT ---`` and ``--- USER MESSAGE ---``. The user pastes
the system block into LM Studio's system message field, the user block into a
new chat.
"""

from __future__ import annotations

from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


def _substitute(template: str, mapping: dict[str, str]) -> str:
    out = template
    for k, v in mapping.items():
        out = out.replace("{{" + k + "}}", v)
    return out


def assemble_prompt(skeleton: str, case_meta: dict) -> str:
    """Return the paste-ready text for LM Studio."""
    system = (PROMPTS_DIR / "system.md").read_text(encoding="utf-8").strip()
    user_template = (PROMPTS_DIR / "user-template.md").read_text(encoding="utf-8")

    user = _substitute(
        user_template,
        {
            "FEE_EARNER_NAME": case_meta.get("feeEarnerName", "").strip() or "[fee earner]",
            "MATTER_TYPE": case_meta.get("matterType", "").strip() or "[matter type]",
            "CASE_MATTER_NAME": case_meta.get("caseMatterName", "").strip() or "[case]",
            "UPLIFT_PERCENT": case_meta.get("finalUpliftPercent", "").strip() or "[uplift %]",
            "SKELETON": skeleton.strip(),
        },
    )

    return (
        "--- SYSTEM PROMPT ---\n"
        "(Paste this into LM Studio's 'System Message' field.)\n\n"
        f"{system}\n\n"
        "--- USER MESSAGE ---\n"
        "(Send this as the first user message in a new chat.)\n\n"
        f"{user.strip()}\n"
    )
