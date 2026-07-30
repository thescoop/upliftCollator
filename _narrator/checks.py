"""Deterministic verification of a polished narrative against its skeleton.

This is the safety net, and it is deliberately *not* an LLM. Every citation in
the skeleton was placed there by a lookup table, so whether it survived the
polish step is a question with an exact answer — a regex diff, not a judgement
call. The LLM verification pass (prompts/verification.md) still runs afterwards
to catch semantic drift, but it can never be the only check.

It matters most because the prompts are user-editable. If someone deletes the
"preserve every citation" rule from system.md, this check still catches the
consequence — the safety net does not depend on the thing being edited.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# Citation forms produced by NARRATIVE_TEMPLATES in content-data.js:
#   Spec Para 6.13(a) · CAG Section 12.8.1 · CAG 12.9(b)
#   CAG Section 12.20-12.23 · CPR 44.4(3)
CITATION_PATTERNS = (
    re.compile(r"Spec\s+Para\s+\d+(?:\.\d+)*(?:\([a-z]\))?", re.IGNORECASE),
    re.compile(
        r"CAG\s+(?:Section\s+)?\d+(?:\.\d+)*(?:\([a-z]\))?(?:\s*[-–]\s*\d+(?:\.\d+)*)?",
        re.IGNORECASE,
    ),
    re.compile(r"CPR\s+\d+(?:\.\d+)*(?:\(\d+\))?", re.IGNORECASE),
)

# Template cues such as [SPECIFY EVIDENCE], [NUMBER], [FIELD(S)]. Restricted to
# ALL-CAPS content so real bracketed text in a solicitor's explanation — a case
# citation year like "[2013]" — is never mistaken for an unfilled placeholder.
PLACEHOLDER_RE = re.compile(r"\[[A-Z][A-Z0-9 ()/,'&.\-]*\]")


def _normalise(citation: str) -> str:
    """Collapse whitespace and case so 'CAG  Section 12.8.1' == 'CAG Section 12.8.1'."""
    return re.sub(r"\s+", " ", citation).strip().lower()


def extract_citations(text: str) -> list[str]:
    """Every legal citation in `text`, de-duplicated, in order of appearance."""
    found: list[tuple[int, str]] = []
    for pattern in CITATION_PATTERNS:
        found.extend((m.start(), m.group(0)) for m in pattern.finditer(text))

    seen: set[str] = set()
    ordered: list[str] = []
    for _, citation in sorted(found):
        key = _normalise(citation)
        if key not in seen:
            seen.add(key)
            ordered.append(re.sub(r"\s+", " ", citation).strip())
    return ordered


def find_placeholders(text: str) -> list[str]:
    """Unfilled template placeholders remaining in `text`, de-duplicated."""
    seen: set[str] = set()
    ordered: list[str] = []
    for match in PLACEHOLDER_RE.finditer(text):
        if match.group(0) not in seen:
            seen.add(match.group(0))
            ordered.append(match.group(0))
    return ordered


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

    polished_keys = {_normalise(c) for c in polished_citations}
    skeleton_keys = {_normalise(c) for c in skeleton_citations}

    return CheckResult(
        skeleton_citations=skeleton_citations,
        dropped_citations=[c for c in skeleton_citations if _normalise(c) not in polished_keys],
        added_citations=[c for c in polished_citations if _normalise(c) not in skeleton_keys],
        placeholders=find_placeholders(polished),
    )


def format_report(result: CheckResult) -> str:
    """Human-readable report, mirroring the shape of prompts/verification.md."""
    lines = ["## Citation check", ""]

    if not result.skeleton_citations:
        lines.append("No citations found in the skeleton — nothing to check.")
    elif not result.dropped_citations:
        lines.append(
            f"All {len(result.skeleton_citations)} citations preserved."
        )
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
