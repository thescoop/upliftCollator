"""Deterministic verification of a polished narrative against its skeleton.

This is the safety net, and it is deliberately *not* an LLM. Every citation in
the skeleton was placed there by a lookup table, so whether it survived the
polish step is a question with an exact answer — a text comparison, not a
judgement call. The LLM verification pass (prompts/verification.md) still runs
afterwards to catch semantic drift, but it can never be the only check.

It matters most because the prompts are user-editable. If someone deletes the
"preserve every citation" rule from system.md, this check still catches the
consequence — the safety net does not depend on the thing being edited.

Three failure modes drove the current design, all found in independent review
on 30 July 2026 after an earlier version reported SAFE TO REVIEW on damaged
output:

* **Fail-open on compound and extended citations.** ``CAG Section 12.5 & 12.9``
  was matched as ``CAG Section 12.5``, so deleting ``& 12.9`` went unreported;
  and because a prefix matched, inventing ``CAG 12.9(a)(ii)`` from
  ``CAG 12.9(a)`` was invisible too. Citations are now matched whole, including
  every joined part and sub-paragraph, with an explicit end boundary.
* **Set comparison hid deletions.** A citation appearing twice in the skeleton
  and once in the output passed. Occurrences are now counted.
* **Lowercase placeholders were invisible.** When extraction cannot recover a
  case field, the narrative reads ``[fee earner]``; the all-caps pattern missed
  it and the result passed as safe.
"""

from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field

import templates

# ── Citation grammar ────────────────────────────────────────────────────────
# Forms actually present in content-data.js (NARRATIVE_TEMPLATES):
#   Spec Para 6.13 · Spec Para 6.13(a) · CPR 44.4(3)
#   CAG 12.2 · CAG 12.9(a) · CAG Section 12.8.1
#   CAG Section 12.20-12.23   (range)
#   CAG Section 12.5 & 12.9   (conjunction)
#
# A number carries any run of sub-paragraphs, so an invented "(ii)" appended to
# "12.9(a)" produces a *different* citation rather than a silent prefix hit.
_NUMBER = r"\d+(?:\.\d+)*(?:\([a-z0-9]+\))*"
# Ranges and conjunctions are part of one citation, not two.
_JOINED = rf"(?:\s*[-–&]\s*{_NUMBER})*"
# End boundary: refuse to stop mid-citation. A following word character or "("
# means there is more citation to come; ".<digit>" means a deeper section
# number. A bare full stop ending a sentence is fine.
_BOUNDARY = r"(?![\w(])(?!\.\d)"

CITATION_PATTERNS = tuple(
    re.compile(rf"{prefix}\s+{_NUMBER}{_JOINED}{_BOUNDARY}", re.IGNORECASE)
    for prefix in (
        r"Spec\s+Para",
        r"CAG(?:\s+Section)?",
        r"CPR",
    )
)

# Template cues such as [SPECIFY EVIDENCE] are drawn from the templates
# themselves rather than matched by a generic all-caps pattern. A generic
# pattern also flags anonymised parties like "[A]" in a solicitor's own prose,
# which is legitimate text that must never be reported as an unfilled cue.
_PLACEHOLDER_IN_TEMPLATE = re.compile(r"\[[^\]\n]{2,80}\]")

# Substituted when extraction could not recover a case field (prompts.py).
RUNTIME_FALLBACKS = ("[fee earner]", "[matter type]", "[case]", "[uplift %]")


def _normalise(citation: str) -> str:
    """Collapse whitespace and case so 'CAG  Section 12.8.1' == 'CAG Section 12.8.1'."""
    return re.sub(r"\s+", " ", citation).strip().lower()


def extract_citations(text: str) -> list[str]:
    """Every legal citation in `text`, in order, **including repeats**.

    Repeats are kept because dropping one of two occurrences is a real loss:
    a citation attached to a specific criterion has moved or vanished even if
    the same reference still appears elsewhere.
    """
    found: list[tuple[int, str]] = []
    for pattern in CITATION_PATTERNS:
        found.extend((m.start(), m.group(0)) for m in pattern.finditer(text))

    # A shorter pattern can match inside a longer one ("CAG 12.5" within
    # "CAG Section 12.5 & 12.9"); keep only the outermost match at each point.
    found.sort(key=lambda pair: (pair[0], -len(pair[1])))
    ordered: list[str] = []
    consumed_to = -1
    for start, citation in found:
        if start < consumed_to:
            continue
        consumed_to = start + len(citation)
        ordered.append(re.sub(r"\s+", " ", citation).strip())
    return ordered


def known_placeholders() -> set[str]:
    """Every bracketed cue that appears in the shipped narrative templates."""
    data = templates.load_content_data()
    cues: set[str] = set()
    for value in (data.get("narrative_templates") or {}).values():
        cues.update(_PLACEHOLDER_IN_TEMPLATE.findall(str(value)))
    return cues


# An all-caps bracketed token of two or more characters. Used to pick up cues
# that came from an *edited* user template, which the shipped-template
# inventory cannot know about. Two characters minimum so anonymised parties —
# "[A]", "[X]" — in a solicitor's own prose are never mistaken for a cue.
_CUE_SHAPE = re.compile(r"\[[A-Z][A-Z0-9 ()/,'&.\-]{1,79}\]")


def find_placeholders(text: str, skeleton: str = "") -> list[str]:
    """Unfilled cues remaining in `text`.

    Three sources, because no single one is complete:
      * the shipped narrative templates,
      * the lowercase fallbacks substituted when a case field is missing,
      * any cue-shaped token present in this run's skeleton — which covers a
        cue introduced by an edited template, invisible to the inventory.

    Matching is case-insensitive: a model that rewrites "[SPECIFY EVIDENCE]"
    as "[Specify Evidence]" has still left the cue unfilled.
    """
    candidates = sorted(known_placeholders()) + list(RUNTIME_FALLBACKS)
    if skeleton:
        candidates += sorted(set(_CUE_SHAPE.findall(skeleton)) - set(candidates))

    lowered = text.lower()
    return [cue for cue in candidates if cue.lower() in lowered]


@dataclass
class CheckResult:
    """Outcome of comparing a polished narrative against its skeleton."""

    skeleton_citations: list[str] = field(default_factory=list)
    dropped_citations: list[str] = field(default_factory=list)
    added_citations: list[str] = field(default_factory=list)
    placeholders: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not (self.dropped_citations or self.added_citations or self.placeholders)

    @property
    def verdict(self) -> str:
        return "SAFE TO REVIEW" if self.ok else "NEEDS REVISION"


def check(skeleton: str, polished: str) -> CheckResult:
    """Compare a polished narrative against the skeleton it came from.

    A *dropped* citation is the serious failure: an assertion to the LAA that
    has lost its authority. An *added* citation is rarer but worse in kind —
    the model inventing an authority that was never in the source.
    """
    skeleton_citations = extract_citations(skeleton)
    polished_citations = extract_citations(polished)

    skeleton_counts = Counter(_normalise(c) for c in skeleton_citations)
    polished_counts = Counter(_normalise(c) for c in polished_citations)

    def _expand(counts: Counter, source: list[str]) -> list[str]:
        """Turn a count difference back into readable citations, in order."""
        remaining = Counter(counts)
        out: list[str] = []
        for citation in source:
            key = _normalise(citation)
            if remaining.get(key, 0) > 0:
                remaining[key] -= 1
                out.append(citation)
        return out

    return CheckResult(
        skeleton_citations=skeleton_citations,
        dropped_citations=_expand(skeleton_counts - polished_counts, skeleton_citations),
        added_citations=_expand(polished_counts - skeleton_counts, polished_citations),
        placeholders=find_placeholders(polished, skeleton),
    )


def format_report(result: CheckResult) -> str:
    """Human-readable report, mirroring the shape of prompts/verification.md."""
    lines = ["## Citation check", ""]

    if not result.skeleton_citations:
        lines.append("No citations found in the skeleton — nothing to check.")
    elif not result.dropped_citations:
        lines.append(f"All {len(result.skeleton_citations)} citations preserved.")
    else:
        lines.append(
            f"{len(result.dropped_citations)} of {len(result.skeleton_citations)} "
            "citations DROPPED from the polished narrative:"
        )
        lines.extend(f"  - {c}" for c in result.dropped_citations)

    if result.added_citations:
        lines += [
            "",
            "Citations ADDED that were not in the skeleton "
            "(the model may have invented an authority):",
        ]
        lines.extend(f"  - {c}" for c in result.added_citations)

    lines += ["", "## Placeholder check", ""]
    if result.placeholders:
        lines.append("Unfilled template placeholders remain — these must not reach the LAA:")
        lines.extend(f"  - {p}" for p in result.placeholders)
    else:
        lines.append("No unfilled placeholders.")

    lines += ["", "## Verdict", "", result.verdict, ""]
    return "\n".join(lines)
