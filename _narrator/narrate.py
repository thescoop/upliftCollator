"""CLI: PDF in → finished LAA enhancement narrative out.

Usage::

    python narrate.py path/to/case.pdf [--out-dir DIR]
    python narrate.py path/to/case.pdf --polish [--model NAME] [--no-verify]

If ``--out-dir`` is omitted, output goes to ``<pdf-stem>-narrative/`` next to
the input PDF.

Always produces:
  narrative.md           — structured Markdown skeleton, fully cited
  narrative-prompt.txt   — the exact instruction sent to the model (audit record)
  narrative-input.json   — recovered formData for debugging or re-runs

With ``--polish`` it also calls the local LM Studio server and adds:
  narrative-polished.md  — the finished, flowing narrative
  citation-check.txt     — deterministic citation/placeholder check + LLM review
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import lmstudio
import polish as polish_mod
from extract import diagnose, extract_formdata
import prompts as prompts_mod
from skeleton import build_skeleton


def _default_out_dir(pdf_path: Path) -> Path:
    return pdf_path.parent / f"{pdf_path.stem}-narrative"


# Outputs derived from the skeleton. They stop being true the moment a new run
# overwrites the skeleton, so they are cleared before one starts.
DERIVED_FILES = ("narrative-polished.md", "citation-check.txt")


def _clear_derived(out_dir: Path) -> None:
    for name in DERIVED_FILES:
        (out_dir / name).unlink(missing_ok=True)





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
        "--polish",
        action="store_true",
        help="Call the local LM Studio server to produce the finished narrative.",
    )
    parser.add_argument(
        "--model",
        default="",
        help="LM Studio model id (default: whatever is loaded, else the "
             "preferred Gemma build). Implies --polish.",
    )
    parser.add_argument(
        "--force-swap",
        action="store_true",
        help="Allow unloading a model another application may be using. "
             "Without this the run stops rather than evicting it.",
    )
    parser.add_argument(
        "--no-verify",
        action="store_true",
        help="Skip the second LLM verification pass (the deterministic "
             "citation check always runs).",
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
    case_meta = formdata.get("caseDetails", {}) | {
        "finalUpliftPercent": formdata.get("finalUpliftPercent", "")
    }

    # Freeze the templates for this run so the audit record below is exactly
    # what gets sent, even if someone edits a prompt while this is running.
    snap = prompts_mod.snapshot()
    prompt_text = snap.assemble(skeleton_md, case_meta)

    # Derived artifacts from a previous run describe a different input once the
    # skeleton is overwritten. Removing them first stops a stale polished
    # narrative sitting beside a fresh skeleton and looking current.
    _clear_derived(out_dir)

    (out_dir / "narrative.md").write_text(skeleton_md + "\n", encoding="utf-8")
    (out_dir / "narrative-prompt.txt").write_text(prompt_text, encoding="utf-8")
    (out_dir / "narrative-input.json").write_text(
        json.dumps(formdata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    written = ["narrative.md", "narrative-prompt.txt", "narrative-input.json"]

    if args.polish or args.model:
        try:
            result = polish_mod.run(
                skeleton_md,
                case_meta,
                model_hint=args.model,
                verify=not args.no_verify,
                force_swap=args.force_swap,
                prompt_snapshot=snap,
                on_status=lambda msg: print(f"narrate: {msg}", file=sys.stderr),
            )
        except lmstudio.ModelSwapRequired as exc:
            print(f"\nnarrate: {exc}\n", file=sys.stderr)
            print("narrate: re-run with --force-swap to unload it anyway, or "
                  "omit --model to use whatever is already loaded.", file=sys.stderr)
            print("narrate: the skeleton was still written.", file=sys.stderr)
            return 3
        except lmstudio.LMStudioError as exc:
            print(f"\nnarrate: polish step failed.\n{exc}\n", file=sys.stderr)
            print("narrate: the skeleton was still written — paste "
                  "narrative-prompt.txt into LM Studio by hand.", file=sys.stderr)
            return 3

        (out_dir / "narrative-polished.md").write_text(result.polished + "\n", encoding="utf-8")
        written.append("narrative-polished.md")

        (out_dir / "citation-check.txt").write_text(polish_mod.format_full_report(result), encoding="utf-8")
        written.append("citation-check.txt")

    print(f"narrate: wrote {out_dir}", file=sys.stderr)
    for name in written:
        print(f"  - {name:<24}({(out_dir / name).stat().st_size} bytes)", file=sys.stderr)

    if args.polish or args.model:
        print(f"narrate: {result.verdict} — {result.verdict_detail}.", file=sys.stderr)
        if not result.ok:
            print("narrate: read citation-check.txt before submitting.", file=sys.stderr)
        # Non-zero on either check failing, so a batch loop cannot mistake a
        # flagged narrative for a clean one.
        return 0 if result.ok else 1

    print("narrate: paste narrative-prompt.txt into LM Studio, or re-run with "
          "--polish to do it automatically.", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
