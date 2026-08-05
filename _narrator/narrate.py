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
  narrative-polished.docx — the finished narrative as Word. This is the one you
                            send: it pastes into the bill narrative as its final
                            section.
  narrative-polished.md  — the same narrative as plain text (audit copy)
  citation-check.txt     — deterministic citation/placeholder check + LLM review

Exit codes::

    0  clean run
    1  narrative written, but a check flagged it — read citation-check.txt
    2  the PDF path is not a file
    3  LM Studio failed or refused; the skeleton was still written
    4  nothing extracted from the PDF; no files written
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import checks as checks_mod
import docx_writer
import lmstudio
import polish as polish_mod
from extract import (
    describe_unrecognised_criteria,
    diagnose,
    explain_empty_extraction,
    extract_formdata,
    extraction_is_empty,
    unevidenced_other_factors,
    load_formdata_json,
)
import prompts as prompts_mod
from skeleton import build_skeleton


def _default_out_dir(pdf_path: Path) -> Path:
    return pdf_path.parent / f"{pdf_path.stem}-narrative"


# Outputs derived from the skeleton. They stop being true the moment a new run
# overwrites the skeleton, so they are cleared before one starts.
DERIVED_FILES = (
    "narrative-polished.docx",
    "narrative-polished.md",
    "citation-check.txt",
)


def _clear_derived(out_dir: Path) -> None:
    for name in DERIVED_FILES:
        (out_dir / name).unlink(missing_ok=True)





def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n", 1)[0])
    parser.add_argument(
        "pdf", nargs="?", help="Path to the Collator-generated PDF"
    )
    parser.add_argument(
        "--from-json",
        type=Path,
        default=None,
        metavar="FILE",
        help="Re-run from a narrative-input.json instead of a PDF. This is the "
             "way to resume after a criterion label could not be matched: "
             "correct the label in that file and point this at it.",
    )
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

    if bool(args.pdf) == bool(args.from_json):
        print(
            "narrate: give either a PDF or --from-json, not both and not neither.",
            file=sys.stderr,
        )
        return 2

    if args.from_json:
        if args.debug:
            print(
                "narrate: --debug inspects a PDF; --from-json has none to inspect.",
                file=sys.stderr,
            )
            return 2
        json_path = args.from_json.resolve()
        if not json_path.is_file():
            print(f"narrate: file not found: {json_path}", file=sys.stderr)
            return 2
        # Default beside the file itself: a corrected narrative-input.json
        # already lives in the output directory of the run that produced it.
        out_dir = (args.out_dir or json_path.parent).resolve()
        pdf_path = None
        print(f"narrate: reading {json_path.name}", file=sys.stderr)
        try:
            formdata = load_formdata_json(json_path)
        except (ValueError, json.JSONDecodeError) as exc:
            print(f"narrate: cannot read {json_path.name}: {exc}", file=sys.stderr)
            return 2
    else:
        pdf_path = Path(args.pdf).resolve()
        if not pdf_path.is_file():
            print(f"narrate: file not found: {pdf_path}", file=sys.stderr)
            return 2

        if args.debug:
            print(json.dumps(diagnose(pdf_path), indent=2, ensure_ascii=False))
            return 0

        out_dir = (args.out_dir or _default_out_dir(pdf_path)).resolve()

        print(f"narrate: reading {pdf_path.name}", file=sys.stderr)
        formdata = extract_formdata(pdf_path)

    n_panel = len(formdata.get("panelMembership", {}))
    n_s1 = len(formdata.get("stage1", {}))
    n_s2 = len(formdata.get("stage2", {}))
    uplift = formdata.get("finalUpliftPercent", "")
    print(
        f"narrate: extracted — {n_panel} panel, {n_s1} Stage 1, {n_s2} Stage 2 ticks; "
        + (f"uplift {uplift}%" if uplift else "no uplift % found"),
        file=sys.stderr,
    )

    # Ordered ahead of the empty check because when every label is damaged both
    # are true, and a per-label report next to a correctable file is a better
    # answer than "nothing was extracted".
    unrecognised = formdata.get("unrecognised") or []
    if unrecognised:
        out_dir.mkdir(parents=True, exist_ok=True)
        _clear_derived(out_dir)
        # A skeleton and prompt from an earlier run describe a different input.
        # Left in place beside a stop they would read as this run's output.
        for stale in ("narrative.md", "narrative-prompt.txt"):
            (out_dir / stale).unlink(missing_ok=True)
        input_json = out_dir / "narrative-input.json"
        input_json.write_text(
            json.dumps(formdata, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print("", file=sys.stderr)
        print(describe_unrecognised_criteria(unrecognised), file=sys.stderr)
        print(
            "\nnarrate: stopping. Writing the narrative now would drop a factor "
            "the solicitor\nticked, and nothing in the finished document would "
            "show that it was missing.\n\n"
            "  Everything recovered, unmatched entries included, is in:\n"
            f"    {input_json}\n"
            "  Correct each 'label' there to match content-data.js exactly, then:\n"
            f'    python narrate.py --from-json "{input_json}"',
            file=sys.stderr,
        )
        return 5

    # A limb "other" with nothing evidencing it. Ordered after the unrecognised
    # check (a damaged label is the more likely cause and the better report) and
    # before the empty check (this file is not empty — it is worse than empty,
    # because it asserts a threshold factor and then never says what it was).
    unevidenced = unevidenced_other_factors(formdata)
    if unevidenced:
        # Same recovery artifact as the unrecognised stop above, and for the
        # same reason: this run is telling the user to edit something, so it has
        # to leave them the file to edit. It printed and returned when it was
        # written, which left a --from-json instruction with nothing to point
        # at, and any narrative.md from an earlier run sitting beside a stop
        # where it reads as this run's output.
        out_dir.mkdir(parents=True, exist_ok=True)
        _clear_derived(out_dir)
        for stale in ("narrative.md", "narrative-prompt.txt"):
            (out_dir / stale).unlink(missing_ok=True)
        input_json = out_dir / "narrative-input.json"
        input_json.write_text(
            json.dumps(formdata, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print("", file=sys.stderr)
        print(
            "narrate: stopping. These threshold factors were ticked, but nothing "
            "at Stage 2\nexplains them:\n",
            file=sys.stderr,
        )
        for label in unevidenced:
            print(f"    - {label}", file=sys.stderr)
        print(
            "\nUnlike the other threshold labels, these say only that the work was "
            "exceptional\nin a respect the guidance's examples do not cover. The "
            "Stage 2 explanation is the\nonly place that says what it was, so the "
            "narrative would tell the LAA the detail\nfollows and then not give it.\n\n"
            "  The form no longer produces this, so the PDF either predates that "
            "change or the\n  JSON was edited by hand.\n\n"
            "  Everything recovered is in:\n"
            f"    {input_json}\n"
            "  Add the Stage 2 explanation there — or remove the Stage 1 factor, but "
            "only if\n  it does not apply, and not merely to get the run through — "
            "then:\n"
            f'    python narrate.py --from-json "{input_json}"',
            file=sys.stderr,
        )
        return 5

    # Nothing recovered means nothing to write. Stop at the PDF rather than
    # building an empty skeleton, spending a model call on it, and reporting
    # the result as a citation failure — which says the narrative is wrong
    # when the truth is that there never was one.
    if extraction_is_empty(formdata):
        if pdf_path is None:
            print(
                "\nnarrate: that file holds no ticked criteria — there is "
                "nothing to write a narrative from.",
                file=sys.stderr,
            )
            return 4
        print("\nnarrate: nothing was extracted from this PDF.\n", file=sys.stderr)
        print(explain_empty_extraction(pdf_path), file=sys.stderr)
        print(
            "\nnarrate: no files were written. For the full structural "
            "diagnostic (no client text) run:\n"
            f'  python narrate.py --debug "{pdf_path}"',
            file=sys.stderr,
        )
        return 4

    out_dir.mkdir(parents=True, exist_ok=True)
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
                n_factors=checks_mod.count_factors(formdata),
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

        # The Word file is the deliverable, so a conversion that lost a
        # citation must be loud rather than leaving a plausible-looking .docx
        # next to a citation check that certified the Markdown.
        docx_ok = True
        try:
            outcome = docx_writer.write_docx(
                result.polished, out_dir / "narrative-polished.docx"
            )
            written.append("narrative-polished.docx")
            print(
                f"narrate: Word document written — {len(outcome.citations)} "
                "citations carried over.",
                file=sys.stderr,
            )
        except docx_writer.NarrativeConversionError as exc:
            docx_ok = False
            print(f"\nnarrate: the Word document was NOT written.\n{exc}\n",
                  file=sys.stderr)

        (out_dir / "citation-check.txt").write_text(polish_mod.format_full_report(result), encoding="utf-8")
        written.append("citation-check.txt")

    print(f"narrate: wrote {out_dir}", file=sys.stderr)
    for name in written:
        print(f"  - {name:<24}({(out_dir / name).stat().st_size} bytes)", file=sys.stderr)

    if args.polish or args.model:
        print(f"narrate: {result.verdict} — {result.verdict_detail}.", file=sys.stderr)
        print(f"narrate: {result.next_step}", file=sys.stderr)
        # Non-zero on either check failing, so a batch loop cannot mistake a
        # flagged narrative for a clean one. A failed Word conversion counts:
        # the file the user actually sends is the one that is missing.
        return 0 if (result.ok and docx_ok) else 1

    print("narrate: paste narrative-prompt.txt into LM Studio, or re-run with "
          "--polish to do it automatically.", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
