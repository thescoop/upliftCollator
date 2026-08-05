# Uplift Collator + Narrator — Project Handoff

Concise context for picking up work in a fresh session.
**Last updated 5 August 2026.**

## What this project does

Two cooperating tools for **Woodruff Billing Ltd** (UK Family Law solicitors
funded by the Legal Aid Agency):

1. **Uplift Collator** — the client-side web app (`index.html`, `script.js`,
   `content-data.js`, `style.css`). Password-gated, walks a solicitor through
   the LAA enhancement uplift questionnaire (Costs Assessment Guidance §12),
   and saves a PDF summary. **Its only output path is
   `pdf.save("LAA_Uplift_Data_Summary.pdf")`, in `generatePdfSummary`** — there is
   no Word export, no `window.print()`, no print stylesheet. Both libraries it
   needs are served from `vendor/`, not a CDN; see `vendor/_PROVENANCE.md`.
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

> **4 August 2026 — the Collator was redesigned, and it changed the narrator's
> input.** Work is on branch **`redesign/stage1-labels`** (pushed; nothing on
> `main`, so nothing is live). **`_PLAN.md` in the repo root carries the accurate
> build status — read it before this file.** In short:
>
> - **Stage 1 collects no prose.** It is now 16 tick-only labels — 13 from CAG 12.8's
>   examples plus one "in some other way" per limb; explanations are
>   collected at Stage 2 only. `skeleton.py` formats an explanation only where the
>   template actually contains `{USER_EXPLANATION}`.
> - **Stage 2 is seven blocks**, one per CAG 12.9 factor, with ticks carried
>   forward from Stage 1.
> - **There is a second stop path, added 5 August 2026.** The three Stage 1 "in some
>   other way" labels assert only that the work was exceptional in a respect CAG 12.8's
>   examples do not cover — the Stage 2 explanation is the only place that says what it
>   was. `extract.unevidenced_other_factors()` stops the run when one is ticked with no
>   explained carrier, because otherwise the narrative promises the LAA detail the
>   document never gives. It is driven by `requires_stage2` on the label in
>   `content-data.js`, not by hardcoded keys — **but a fourth "other" must be given that
>   flag; nothing detects one.** The guard must stay in **both** `narrate.py` and
>   `narrate_gui.py`: it went into the CLI first, and the GUI is what both launchers run.
> - **`MIN_EXPLANATION_WORDS` exists twice**, in `script.js` and `extract.py`, and the
>   Python side counts words through an explicit ECMAScript-`\s` class because Python's
>   whitespace set is not JavaScript's. A test reads the constant out of `script.js` so
>   the two cannot drift apart silently.
> - **`LEGACY_LABEL_ALIASES` in `content-data.js` is load-bearing.** `extract.py`
>   matches by label *text*, and since `2ba3adb` an unmatched label stops the run.
>   The redesign reworded every label, so without this map **every PDF already
>   sitting in a live matter would fail to extract.** The retired keys deliberately
>   remain in `NARRATIVE_TEMPLATES` so old PDFs render as they did when produced —
>   do not tidy them away, and do not "modernise" their wording.
> - **`evidenceOnFileConfirmed` gates** the conclusion's "Evidence supporting these
>   assertions can be found within the case file", and the front end now sets it: an
>   optional tick on page 5 → an `EVIDENCE ON FILE` section in the PDF →
>   `extract_evidence_confirmation()` → the gate. **The status line and the sentence
>   beneath it must agree** before this counts as confirmed. Either alone is one word
>   from reversing its meaning — "Not confirmed" contains "confirmed", so losing a
>   "Not " in transit would turn a refusal into an assertion to the LAA. Two strings
>   that fail in opposite directions. Anything else reads as false and, unlike a
>   criterion label, does not stop the run. A pre-v1.11 PDF has no such section and
>   correctly yields False.
> - **Anything printed into the PDF wraps, and wrapping is where this breaks.**
>   jsPDF wraps at the column width and marks the continuation in no way at all.
>   Two silent truncations were found this way and fixed: a Stage 1 label too long
>   for one line matched nothing and *stopped the run* (every case ticking the
>   vulnerable-client factor), and a long Case / Matter name reached the narrative
>   truncated to its first line. `_resolve_wrapped_label` rejoins a label; the case
>   details are read as the **longest run of candidate lines whose fields appear in
>   the order the PDF prints them** (`_detail_field_positions`), because a wrapped
>   value whose second line opens "Court:" is otherwise indistinguishable from the
>   real Court field. Walking the fields in order and taking the first candidate
>   each time looks equivalent and is not — where a field is missing *and* a later
>   value imitates it, the walk jumps forward and loses every genuine field above.
>   The format stays ambiguous in principle and the code says so; do not "tidy"
>   that caveat away. If you add a long string to the PDF, test it at length.
> - **Exact matching is not the same as safety, and the comment that said so was
>   wrong.** Rejoining a label is accepted only on an exact match against
>   `content-data.js`, so it cannot be repaired into something *like* it — but
>   damage can turn one real label into a *different* real label: drop the
>   parenthetical from the legacy Stage 1 "Difficulty in taking instructions
>   (client/witnesses)" and what remains is the current Stage 2 label word for word.
>   `extract_criteria` therefore also checks the key belongs to the section it was
>   reading (`s1_`/`s2_`/`panel_membership_`, the convention `content-data.js`
>   already follows) — and so do `extract_panel` and `load_formdata_json`. Each
>   was added only after a review found the gap, so **treat `_SECTION_KEY_PREFIXES`
>   as something every reading path must consult, not a check on one of them.**
>   Guarding only `extract_criteria` left the guard undoing itself: the rejected
>   file could be re-run through `--from-json` unedited and accepted, with the
>   report naming the offending label as its own closest match. And `extract_panel`
>   had no guard at all — the costliest of the three, because panel membership
>   carries a *guaranteed* 15% (CAG 12.20), so a criterion label read there made
>   the narrative claim that entitlement outright.
> - **`EVIDENCE ON FILE` is taken at its LAST occurrence**, both when read and when
>   used to end the section above it (`_LAST_OCCURRENCE_SECTIONS`). A solicitor can
>   paste a whole confirmation block into an explanation — boilerplate, or a copy of
>   a previous summary — and it would otherwise both outrank their real answer and
>   truncate Stage 2 where it sat, dropping every criterion below it. **The other
>   section headings still have that weakness**, deliberately: tightening them
>   changes how PDFs already in live matters are read.
> - **`extract.py` now reads the `Court:` line** into `caseDetails.courtLevel`.
>   Nothing computes with it — the tool proposes no figure — but the ceiling under
>   CAG 12.2 now reaches `narrative-input.json` instead of being visible only to a
>   human reading the PDF.
> - Citations corrected throughout: `12.8.1/.2/.3` → `12.8(a)/(b)/(c)`; the
>   comparison benchmark now quotes CAG 12.8 rather than "a fee earner of this
>   level"; the Specification year is now 2024.
> - **`_cag-section-12-verbatim.md` is the citation source of truth.** Check any
>   new citation against it before writing it. Twelve fabricated or misattributed
>   statements were found in this tool on 4 August 2026, all biased toward
>   under-claiming.
> - `templates.py`'s JS scanner is now comment-aware — it previously read the
>   apostrophe in prose like "the solicitor's own words" as a string delimiter.

App version **1.11** (4 August 2026) in `content-data.js`. Simon confirmed on
1 August 2026 that narrator-only template additions do **not** bump it; this
version moved because the Collator itself changed.

**281 tests**, all passing (was 244 before the redesign), none touching the
network. The 281 figure was verified under **WSL Python on 5 August 2026**;
**Windows Python has not been re-run since the redesign** — do that before
trusting a Windows launcher. Command:

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
- **`_vercel-should-build.sh` is inert today, and is for the planned Vercel
  move.** Production is GitHub Pages, which publishes the whole repository root
  on every push to `main` with no build step to intercept — so pushing narrator
  work does republish the site, byte-identically. Keep the script's `SHIPPED`
  list correct anyway when you add a file to the web app, or the gate will skip
  a needed deploy on the day it becomes live. It errs towards building whenever
  it cannot be certain, because
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

## Unreadable PDFs: detect and stop. An OCR fallback was rejected

Some PDFs arrive legible to a human but empty to software — the text converted
to vector outlines, or the page rasterised. `diagnose()` identifies which, and
`explain_empty_extraction()` says so and stops. **That is the finished answer.
Do not add OCR.**

The cause is known. A real submission arrived as a correct v1.10 Collator PDF
whose glyphs had been redrawn as shapes; the PDF's own metadata named
**`Aspose.Pdf for .NET 11.7.0`**, which runs *inside* other software — case
management systems, portal uploads, mail gateways. A system did it automatically
in transit. **The Collator always writes selectable text**, so the damage is
never the solicitor's doing in the app, and a good original existed. The remedy
is to ask for that original as the browser saved it; failing that, re-key the
answers into the web app from the damaged copy and generate a fresh PDF.
`extract.py` already tells the user exactly this.

OCR was designed in full and rejected on 3 August 2026. Three reasons:

1. **It would have saved typing, not reading.** The agreed verification level is
   "confirm everything the solicitor typed", so every recovered field would be
   proofread against the page image regardless. Eight phases of machinery to
   pre-fill a box that must be read word-for-word anyway.
2. **Pre-filled text is worse than transcription.** Checking plausible text
   anchors the eye; you skim past `l,400` where you would never have typed it.
   Measured evidence: `1,400` came back as `1 ,400` — a single inserted space
   that tokenises as two numbers. It failed plausibly, not visibly.
3. **It would introduce a failure class this tool does not currently have** — a
   confidently wrong narrative from a damaged PDF — on a document going to the
   LAA. Even the full design could not close the gap where OCR drops a criterion
   block entirely, leaving a fluent, fully-cited narrative making a *weaker
   claim than the solicitor actually made*.

A vision model instead of OCR was rejected earlier and separately: OCR fails
visibly, a VLM fails plausibly, inventing a clean wrong number.

### Partial damage was the hole, and it is now closed

`diagnose()` only ever fired when extraction came back **empty**, so a PDF that
kept *some* text sailed through. On 4 August 2026 one did: a flattened file
that Simon had recovered by running it through Acrobat's own OCR. Two labels
came back damaged — `{` for `(`, and a space lost before a slash — and
`extract_criteria` did what it had always done, printed a line to stderr and
carried on. Both criteria were dropped, one of them the Stage 1 and Stage 2
halves of the same weight-of-documents argument, and the narrative was silently
a weaker claim than the solicitor had made. The warning went to stderr, which
the GUI does not show; it was noticed only because that run happened to be
launched from a terminal.

An unmatched label now **stops the run**, in both the CLI and the GUI. Three
things about the design are deliberate:

- **It does not repair the label**, obvious though `{`→`(` is. The explanation
  beneath a mangled label came off the same text layer, so fixing what is
  visible would leave prose that is equally wrong and no longer looks it.
- **`narrative-input.json` is written before the stop**, not after. Correcting
  a label in that file and re-running `--from-json` is the whole recovery path;
  writing it afterwards would leave nothing to correct. Corrected labels are
  re-resolved against `content-data.js`, so only an exact match is accepted.
- **The report echoes a read label only when it closely resembles a known one**
  (`LABEL_MATCH_FLOOR`). A bulleted line unlike any criterion may be the
  solicitor's own prose, so only its length is reported. Same rule as
  `diagnose()`: structure yes, case text never.

`extract_panel` is guarded the same way — a panel membership can be worth more
than every criterion combined, so a tick lost there is not the lesser problem.

The GUI stops and prints the exact `--from-json` command, but cannot itself
resume from a JSON file; its file picker takes a PDF. Worth closing if it ever
becomes a nuisance.

The measurement stands if this is ever revisited: at 300 dpi with Windows'
on-device OCR, section headers 6/6, criteria 7/7 by fuzzy label match,
explanation prose 97.8–100% char accuracy, and bullet `•` glyphs 0 of 7 —
dropped entirely, which is why labels rather than bullets would have had to be
the anchor. Mechanics for driving Windows OCR from WSL, including its two silent
failure modes, remain in project memory (`reference_windows_ocr_mechanics`).

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
