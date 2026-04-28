"""CLI: PDF in → Markdown narrative skeleton + paste-ready LM Studio prompt out.

Usage::

    python narrate.py path/to/case.pdf [--out-dir DIR]

If ``--out-dir`` is omitted, output goes to ``<pdf-stem>-narrative/`` next to
the input PDF.

Produces three files:
  narrative.md           — structured Markdown skeleton, usable as-is
  narrative-prompt.txt   — paste-ready prompt for LM Studio polish step
  narrative-input.json   — recovered formData for debugging or re-runs
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from extract import diagnose, extract_formdata
from prompts import assemble_prompt
from skeleton import build_skeleton


def _default_out_dir(pdf_path: Path) -> Path:
    return pdf_path.parent / f"{pdf_path.stem}-narrative"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n", 1)[0])
    parser.add_argument("pdf", help="Path to the Collator-generated PDF")
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=None,
        help="Output directory (default: <pdf-stem>-narrative/ next to the PDF)",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Print structure-only diagnostics (no client text) and exit. "
             "Safe to share when triaging extraction failures on real PDFs.",
    )
    args = parser.parse_args(argv)

    pdf_path = Path(args.pdf).resolve()
    if not pdf_path.is_file():
        print(f"narrate: file not found: {pdf_path}", file=sys.stderr)
        return 2

    if args.debug:
        print(json.dumps(diagnose(pdf_path), indent=2, ensure_ascii=False))
        return 0

    out_dir = (args.out_dir or _default_out_dir(pdf_path)).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"narrate: reading {pdf_path.name}", file=sys.stderr)
    formdata = extract_formdata(pdf_path)

    n_panel = len(formdata.get("panelMembership", {}))
    n_s1 = len(formdata.get("stage1", {}))
    n_s2 = len(formdata.get("stage2", {}))
    print(
        f"narrate: extracted — {n_panel} panel, {n_s1} Stage 1, {n_s2} Stage 2 ticks; "
        f"uplift {formdata.get('finalUpliftPercent', '?')}%",
        file=sys.stderr,
    )

    skeleton_md = build_skeleton(formdata)
    prompt_text = assemble_prompt(skeleton_md, formdata.get("caseDetails", {}) | {
        "finalUpliftPercent": formdata.get("finalUpliftPercent", "")
    })

    (out_dir / "narrative.md").write_text(skeleton_md + "\n", encoding="utf-8")
    (out_dir / "narrative-prompt.txt").write_text(prompt_text, encoding="utf-8")
    (out_dir / "narrative-input.json").write_text(
        json.dumps(formdata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    print(f"narrate: wrote {out_dir}", file=sys.stderr)
    print(f"  - narrative.md            ({(out_dir / 'narrative.md').stat().st_size} bytes)", file=sys.stderr)
    print(f"  - narrative-prompt.txt    ({(out_dir / 'narrative-prompt.txt').stat().st_size} bytes)", file=sys.stderr)
    print(f"  - narrative-input.json    ({(out_dir / 'narrative-input.json').stat().st_size} bytes)", file=sys.stderr)
    print("narrate: paste narrative-prompt.txt into LM Studio for the polish step.", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
