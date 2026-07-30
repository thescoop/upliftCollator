"""Prompt templates: shipped defaults, user overrides, and assembly.

Two layers. The shipped defaults in ``prompts/`` stay pristine; edits live in
``prompts/custom/`` and win when present. The custom folder is committed to the
repo on purpose, so a prompt tuned on Mutant reaches Darwin — two machines
quietly running different prompts is the kind of divergence that produces a
confusing result months later with no way to explain it.

Editing is safe to expose because it cannot disable the safety net: the
citation check in ``checks.py`` is deterministic and reads the skeleton, not
the prompt. Deleting "preserve every citation" from system.md still gets
caught.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
CUSTOM_DIR = PROMPTS_DIR / "custom"

# The two templates a user may edit. verification.md is documentation with the
# real system prompt embedded, so it is parsed rather than edited directly.
EDITABLE_TEMPLATES = ("system.md", "user-template.md")

_VERIFICATION_START = "<!-- SYSTEM-PROMPT-START -->"
_VERIFICATION_END = "<!-- SYSTEM-PROMPT-END -->"


def _substitute(template: str, mapping: dict[str, str]) -> str:
    out = template
    for k, v in mapping.items():
        out = out.replace("{{" + k + "}}", v)
    return out


# ── Template resolution ─────────────────────────────────────────────────────

def template_path(name: str) -> Path:
    """Custom override if it exists, otherwise the shipped default.

    Only the declared editable templates can be overridden. Without that
    restriction a stray ``custom/verification.md`` would silently win while
    being invisible to ``is_customised()`` and untouchable by
    ``restore_defaults()`` — a customisation with no way to see or undo it.
    """
    if name in EDITABLE_TEMPLATES:
        custom = CUSTOM_DIR / name
        if custom.is_file():
            return custom
    return PROMPTS_DIR / name


def read_template(name: str) -> str:
    return template_path(name).read_text(encoding="utf-8")


def is_customised() -> bool:
    """True when any editable template is currently being overridden."""
    return any((CUSTOM_DIR / name).is_file() for name in EDITABLE_TEMPLATES)


def enable_customisation() -> list[Path]:
    """Seed prompts/custom/ from the defaults and return the editable paths.

    Existing overrides are never overwritten — this is also the "open my
    prompts for editing" entry point, not just first-time setup.
    """
    CUSTOM_DIR.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for name in EDITABLE_TEMPLATES:
        target = CUSTOM_DIR / name
        if not target.is_file():
            target.write_text((PROMPTS_DIR / name).read_text(encoding="utf-8"), encoding="utf-8")
        paths.append(target)
    return paths


def restore_defaults() -> list[str]:
    """Delete every override. Returns the names actually removed."""
    removed: list[str] = []
    for name in EDITABLE_TEMPLATES:
        target = CUSTOM_DIR / name
        if target.is_file():
            target.unlink()
            removed.append(name)
    return removed


# ── Prompt assembly ─────────────────────────────────────────────────────────

def system_prompt() -> str:
    """The polish-step system prompt (override-aware)."""
    return read_template("system.md").strip()


def user_message(skeleton: str, case_meta: dict) -> str:
    """The polish-step user message for one case (override-aware)."""
    return _substitute(
        read_template("user-template.md"),
        {
            "FEE_EARNER_NAME": case_meta.get("feeEarnerName", "").strip() or "[fee earner]",
            "MATTER_TYPE": case_meta.get("matterType", "").strip() or "[matter type]",
            "CASE_MATTER_NAME": case_meta.get("caseMatterName", "").strip() or "[case]",
            "UPLIFT_PERCENT": case_meta.get("finalUpliftPercent", "").strip() or "[uplift %]",
            "SKELETON": skeleton.strip(),
        },
    ).strip()


def verification_system_prompt() -> str:
    """The forensic-checker system prompt, parsed out of verification.md.

    verification.md is human documentation with the prompt embedded in it, so
    there is one file to read rather than two that drift. The prompt is bounded
    by explicit markers and this refuses to guess: an earlier version split on
    a markdown heading and took everything after it, which silently sent the
    surrounding documentation and a worked example to the model as its system
    prompt — and would have sent the entire file had the heading been renamed.
    """
    text = read_template("verification.md")
    before, start_marker, rest = text.partition(_VERIFICATION_START)
    body, end_marker, _ = rest.partition(_VERIFICATION_END)

    if not start_marker or not end_marker:
        raise ValueError(
            f"{template_path('verification.md')} is missing the "
            f"{_VERIFICATION_START} / {_VERIFICATION_END} markers that delimit "
            "the system prompt. Restore them rather than letting documentation "
            "be sent to the model as instructions."
        )
    if _VERIFICATION_START in rest or _VERIFICATION_END in before:
        raise ValueError(
            f"{template_path('verification.md')} has duplicated or out-of-order "
            "system-prompt markers; the intended prompt is ambiguous."
        )

    body = body.strip()
    if not body:
        raise ValueError(
            f"{template_path('verification.md')} has an empty system prompt "
            "between its markers."
        )
    return body


def verification_user_message(skeleton: str, polished: str) -> str:
    return (
        "---SKELETON---\n\n"
        f"{skeleton.strip()}\n\n"
        "---END SKELETON---\n\n"
        "---POLISHED NARRATIVE---\n\n"
        f"{polished.strip()}\n\n"
        "---END POLISHED NARRATIVE---\n"
    )


@dataclass(frozen=True)
class PromptSnapshot:
    """The resolved templates for one run, read once and then frozen.

    The audit file (narrative-prompt.txt) is written before the model is
    called, and prompt editing stays available while a run is in flight — an
    external editor can change a template between the two. Without a snapshot,
    version A gets recorded as the audit record while version B is what was
    actually sent, which defeats the point of keeping the record at all.
    """

    system: str
    user_template: str
    customised: bool

    def user_message(self, skeleton: str, case_meta: dict) -> str:
        return _substitute(
            self.user_template,
            {
                "FEE_EARNER_NAME": case_meta.get("feeEarnerName", "").strip() or "[fee earner]",
                "MATTER_TYPE": case_meta.get("matterType", "").strip() or "[matter type]",
                "CASE_MATTER_NAME": case_meta.get("caseMatterName", "").strip() or "[case]",
                "UPLIFT_PERCENT": case_meta.get("finalUpliftPercent", "").strip() or "[uplift %]",
                "SKELETON": skeleton.strip(),
            },
        ).strip()

    def assemble(self, skeleton: str, case_meta: dict) -> str:
        """The two-block paste-ready text, and the audit record of this run."""
        return (
            "--- SYSTEM PROMPT ---\n"
            "(Paste this into LM Studio's 'System Message' field.)\n\n"
            f"{self.system}\n\n"
            "--- USER MESSAGE ---\n"
            "(Send this as the first user message in a new chat.)\n\n"
            f"{self.user_message(skeleton, case_meta)}\n"
        )


def snapshot() -> PromptSnapshot:
    """Resolve and freeze the editable templates for a single run."""
    return PromptSnapshot(
        system=system_prompt(),
        user_template=read_template("user-template.md"),
        customised=is_customised(),
    )


def assemble_prompt(skeleton: str, case_meta: dict) -> str:
    """The two-block paste-ready text, kept as the audit record of a run.

    Still written to the output folder even when the narrator calls LM Studio
    directly: if an LAA assessment is ever challenged, this is the exact
    instruction the model was given.
    """
    return (
        "--- SYSTEM PROMPT ---\n"
        "(Paste this into LM Studio's 'System Message' field.)\n\n"
        f"{system_prompt()}\n\n"
        "--- USER MESSAGE ---\n"
        "(Send this as the first user message in a new chat.)\n\n"
        f"{user_message(skeleton, case_meta)}\n"
    )
