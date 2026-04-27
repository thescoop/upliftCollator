"""Load NARRATIVE_TEMPLATES and QUESTION_BLOCKS from ../content-data.js.

content-data.js is the single source of truth — we never maintain a Python
copy. This module parses the JS file and exposes the data as Python dicts/lists.

The blocks use JS literal syntax (unquoted keys, line comments, trailing commas)
that's incompatible with stdlib json, so we parse with json5 — JSON with the
common JS-style extensions, intended for exactly this case.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import json5

CONTENT_DATA_PATH = Path(__file__).resolve().parent.parent / "content-data.js"


def _extract_balanced(source: str, name: str, opening: str, closing: str) -> str:
    """Find ``const NAME = <opening>...<closing>`` and return the JS literal."""
    marker = f"const {name}"
    idx = source.find(marker)
    if idx < 0:
        raise ValueError(f"const {name} not found in {CONTENT_DATA_PATH.name}")

    open_idx = source.find(opening, idx)
    if open_idx < 0:
        raise ValueError(f"opening {opening!r} for {name} not found")

    depth = 0
    in_string: str | None = None
    i = open_idx
    while i < len(source):
        ch = source[i]
        if in_string:
            if ch == "\\":
                i += 2
                continue
            if ch == in_string:
                in_string = None
        else:
            if ch in ('"', "'"):
                in_string = ch
            elif ch == opening:
                depth += 1
            elif ch == closing:
                depth -= 1
                if depth == 0:
                    return source[open_idx : i + 1]
        i += 1
    raise ValueError(f"unbalanced {opening!r}/{closing!r} for {name}")


@lru_cache(maxsize=1)
def load_content_data() -> dict:
    """Parse content-data.js and return narrative_templates + question_blocks."""
    source = CONTENT_DATA_PATH.read_text(encoding="utf-8")
    return {
        "narrative_templates": json5.loads(
            _extract_balanced(source, "NARRATIVE_TEMPLATES", "{", "}")
        ),
        "question_blocks": json5.loads(
            _extract_balanced(source, "QUESTION_BLOCKS", "[", "]")
        ),
    }


def label_to_key_lookup() -> dict[str, str]:
    """Build {checkbox_label: key} from QUESTION_BLOCKS. Raises if labels collide."""
    blocks = load_content_data()["question_blocks"]
    lookup: dict[str, str] = {}
    for block in blocks:
        for chk in block.get("checkboxes", []):
            label = chk["label"]
            key = chk["key"]
            if label in lookup and lookup[label] != key:
                raise ValueError(
                    f"Duplicate checkbox label {label!r} maps to both "
                    f"{lookup[label]!r} and {key!r}. Disambiguate in content-data.js."
                )
            lookup[label] = key
    return lookup


def block_for_key(key: str) -> dict | None:
    """Return the QUESTION_BLOCKS block that owns a given checkbox key."""
    for block in load_content_data()["question_blocks"]:
        for chk in block.get("checkboxes", []):
            if chk["key"] == key:
                return block
    return None


if __name__ == "__main__":
    data = load_content_data()
    nt = data["narrative_templates"]
    qb = data["question_blocks"]
    lookup = label_to_key_lookup()

    print(f"NARRATIVE_TEMPLATES: {len(nt)} entries")
    print(f"QUESTION_BLOCKS:     {len(qb)} blocks")
    print(f"label→key lookup:    {len(lookup)} unique labels")

    keys_in_blocks = {chk["key"] for b in qb for chk in b.get("checkboxes", [])}
    keys_in_templates = set(nt.keys())
    missing = keys_in_blocks - keys_in_templates
    print(f"keys in QUESTION_BLOCKS but not NARRATIVE_TEMPLATES: {sorted(missing)}")
