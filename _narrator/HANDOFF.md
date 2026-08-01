# Uplift Collator + Narrator — Project Handoff

Concise context for picking up work in a fresh session.
**Last updated 1 August 2026.**

## What this project does

Two cooperating tools for **Woodruff Billing Ltd** (UK Family Law solicitors
funded by the Legal Aid Agency):

1. **Uplift Collator** — the client-side web app (`index.html`, `script.js`,
   `content-data.js`, `style.css`). Password-gated, walks a solicitor through
   the LAA enhancement uplift questionnaire (Costs Assessment Guidance §12),
   and saves a PDF summary. **Its only output path is
   `pdf.save("LAA_Uplift_Data_Summary.pdf")` at `script.js:1091`** — there is no
   Word export, no `window.print()`, no print stylesheet.
2. **Uplift Narrator** (`_narrator/`) — the back-office tool that turns that PDF
   into the finished LAA enhancement narrative. It drives a local LM Studio
   model directly and verifies the result.

GDPR-sensitive throughout. Nothing leaves the machine, and that is enforced in
code — see `lmstudio.py`, which refuses any endpoint that is not loopback or
the WSL host gateway unless `UPLIFT_LMSTUDIO_ALLOW_REMOTE=1` is set.

`_narrator/README.md` is the user-facing document and is current. **Read it
before this file** — it covers what the tool produces, how to choose a model,
prompt editing, and troubleshooting. This file covers only what a *developer*
picking the work up needs.

## Current state

App version **1.10** (29 April 2026) in `content-data.js`. Simon confirmed on
1 August 2026 that narrator-only template additions do **not** bump it.

**215 tests**, all passing, none touching the network. Verified on 1 August 2026
under both WSL *and* Windows Python, with a clean working tree after either:

```bash
conda activate uplift-narrate
python -m unittest discover -s _narrator/tests
```

The pipeline is complete and works end to end: extract → skeleton → prompt →
polish via LM Studio → deterministic citation check → LLM second opinion →
verdict → Word. Both the GUI and the CLI run the identical pipeline through
`polish.run()`, so the two can never disagree.

**The deliverable is `narrative-polished.docx`** — a fragment written to paste
into the CCMS bill narrative as its final section. `narrative-polished.md`
remains as the audit copy. See the README for the layout and for why the .docx
carries its own citation check.

Three conventions worth not rediscovering:

- **Windows and WSL conda environments are separate installations sharing the
  name `uplift-narrate`.** Installing a package on one does nothing for the
  other. Both `_setup` scripts update an existing env in place — re-run the one
  matching the launcher you actually use.
- **A test that edits a shipped file must restore it as bytes**, not via
  `read_text`/`write_text`. The round trip translates newlines, so on Windows a
  clean test run used to leave `prompts/verification.md` rewritten as CRLF.
- **Pushing narrator work no longer redeploys the solicitors' web tool.**
  `vercel.json` runs `_vercel-should-build.sh`, which cancels the Vercel build
  unless a file the live site actually serves has changed. If you add a file to
  the web app, add it to that script's `SHIPPED` list or its changes will not go
  live. The script errs towards building whenever it cannot be certain, because
  a needless redeploy of identical static files costs nothing while a skipped
  one leaves a fix believed shipped but absent.

The two tools share this repository **on purpose**: `templates.py` reads
`../content-data.js` as the single source of truth, so the narrative wording can
never drift from the form the solicitor filled in. Separating them would trade a
loud, cheap problem for a silent, expensive one. Decouple the deployment, not the
repository.

## Where the bodies are buried

Things that cost real time to learn and are easy to undo by accident.

- **`reasoning_effort: "none"` is the only switch LM Studio honours** for
  think-by-default families (Gemma 4, Qwen 3.5+). `enable_thinking` and
  `chat_template_kwargs` are silently ignored. Without it the model spends its
  whole budget reasoning and returns **empty**.
- **`QPlainTextEdit` is a sibling of `QTextEdit`, not a subclass.** A
  `QTextEdit { … }` stylesheet rule silently misses it. This shipped once and
  left all three output panes on Qt's default palette, unreadable.
- **`urllib` honours `http_proxy`.** Even a `127.0.0.1` request would route
  through a proxy that then receives the narrative. All requests go through an
  opener with proxies disabled (`lmstudio._OPENER`). Do not "simplify" that.
- **`lms` output needs `encoding="utf-8"` explicitly**, or cp1252 decoding
  turns a *successful* model load into a reported hard failure.
- **Never `lms unload --all`.** It would evict a model another application is
  mid-run on. Consent is recorded as specific model ids and re-read immediately
  before acting.
- **The citation check is deliberately not an LLM.** That question has an exact
  answer. An earlier suite passed 20 tests while the checker was silently
  fail-open on `CAG Section 12.5 & 12.9`, because no test used the citation
  forms that actually occur in the templates. Cases are now generated from
  `content-data.js` rather than chosen by hand.

Two risks are **accepted rather than fixed**, and documented in the README: the
race between the last model-state read and the `lms` command, and JIT loading
when `/api/v0` is unavailable.

## Next piece of work — the OCR fallback

**Do not build from the sketch at the end of this section.** It was reviewed
independently on 1 August 2026 and should not be built as written — it fails
open in several places, most seriously by narrating a partial recovery as if it
were complete. The findings are in **`OCR-DESIGN-REVIEW.md`** and the revised
design is in **`OCR-PLAN.md`**; read those two first. The background below is
still accurate and worth reading; the sketch at the end is kept only as the
record of what was rejected.

**Feasibility is measured. Nothing is written yet.**

A real submission arrived as a correct v1.10 Collator PDF whose text had been
converted to **vector outlines** — every glyph redrawn as its own shape — so
nothing could be extracted. `narrate.py --debug` named the culprit from the
PDF's own metadata: **`Aspose.Pdf for .NET 11.7.0`**. Aspose runs *inside* other
software (case-management systems, portal uploads, mail gateways), so a system
did it automatically in transit. It will recur until that system is found.

The plan: detect the condition, render the pages, OCR them, rebuild `formData`,
and hand it to the existing pipeline unchanged.

Measured on `tests/fixtures/sample.pdf` at 300 dpi with Windows' built-in
on-device OCR, against known ground truth:

| | Result |
|---|---|
| Section headers | 6 of 6 exact |
| Ticked criteria, fuzzy-matched to the closed label set | **7 of 7** |
| Explanation prose | 97.8–100% char accuracy; 3 of 5 perfect |
| Bullet `•` glyphs | **0 of 7 — dropped entirely** |

Two consequences, both non-negotiable:

1. **Anchor on labels, not bullets.** Criterion labels are a closed set in
   `content-data.js`, so fuzzy matching (difflib, cutoff ≈0.85) recovers them
   despite OCR slips. `extract.py`'s `startswith("•")` parsing cannot be reused
   — write OCR-tolerant variants rather than loosening the existing ones, which
   still need to be strict for real PDFs.
2. **The solicitor's own words must be human-confirmed.** The fixture's one
   significant quantity came back `1 ,400` instead of `1,400` — a single
   inserted space that tokenises as `1` and `400`. It failed *plausibly*, not
   visibly.

   The user first chose "confirm the numbers only" and then **reversed it the
   same day** to **confirm everything the solicitor typed** — all recovered
   explanation prose, plus the uplift percentage and the case identity. The
   numbers-only gate never saw the uplift at all, could not repair `1 ,400`
   (two fields, neither of which owns the space), and was blind to number words
   and to digits read as letters. Full details in `OCR-PLAN.md`.

   Never unattended.

Related decision: **do not** feed the page image to a vision model instead.
OCR fails visibly; a VLM fails plausibly, inventing a clean wrong number. On an
audited claim that is the worse tool — the same reasoning that picked Gemma
over gpt-oss.

Implementation notes, including the two silent failure modes when driving
Windows OCR from WSL, are in project memory
(`reference_windows_ocr_mechanics`). Read it before writing the driver; both
failures look like unrelated bugs.

Sketch:

```
extract.diagnose()  →  no text + (outlined | rasterised)  →  offer OCR
  pypdfium2 render @300dpi   (already in the env; no poppler/gs/tesseract here)
  one PowerShell process OCRs every page   (per-process WinRT contention)
  section_slice() as-is      (headers survive OCR intact)
  fuzzy label anchors        (new; replaces bullet detection)
  numbers-confirmation dialog on the UI thread
  → formData → existing skeleton/polish/check pipeline, stamped OCR-derived
```

## Conventions

Per the user's global `~/.claude/CLAUDE.md`:

- Mentor mode — explain trade-offs, plan before coding, don't build until agreed.
- Both `.bat` and `.sh` startup scripts, `_`-prefixed to sort to the top.
- **Synthetic fixtures only.** Never read a real client PDF, even when it is the
  most direct reproducer — `narrate.py --debug` exists precisely so extraction
  failures can be triaged on real files without exposing client text. Only
  `producer`, `creator`, `CreationDate` and `ModDate` are read: software names
  and timestamps describe the file, not the case. Title, Author, Subject and
  Keywords can carry a client name and are never touched. The allow-list in
  `tests/test_empty_extraction.py` enforces this and will fail on any new key,
  which is the point — widen it deliberately, never loosen it.
- Direct push to `main` is allowed (`.claude/settings.local.json`).
