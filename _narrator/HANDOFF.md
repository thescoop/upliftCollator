# Uplift Collator + Narrator — Project Handoff

Concise context for picking up work in a fresh session.
**Last updated 7 August 2026 (evening).**

> **State as of 7 August 2026, end of day:** the signed-off .docx visual
> redesign is fully implemented and nine-round-adversarially-reviewed on
> `redesign/stage1-labels` (commits `580a604..9b12543`; 434 tests + 200
> subtests on WSL and Windows, 30/30 browser drive). The extraction contract
> in `extract_docx.py` is the new composite-heading/coded-row grammar; the
> legacy PDF path is blob-identical throughout. **Next session's headline is
> the ceiling-UX form redesign** — the per-court limit must block and be
> explained in the form (Simon's brief lives in the project memory,
> `project_ceiling_ux_brief`); a narrator-side gate was built and reverted on
> his direction, so do not re-add one. Also pending: Simon's final look-over
> of real generated documents, the site walk-through, branch push, and the
> standing pre-merge gates in `_PLAN.md`.

## What this project does

Two cooperating tools for **Woodruff Billing Ltd** (UK Family Law solicitors
funded by the Legal Aid Agency):

1. **Uplift Collator** — the client-side web app (`index.html`, `script.js`,
   `content-data.js`, `style.css`, and since 7 August 2026 `docx-summary.js`).
   Password-gated, walks a solicitor through the LAA enhancement uplift
   questionnaire (Costs Assessment Guidance §12), and downloads a **Word
   summary**. **Its only output path is the single anchor-click download in
   `script.js` built by `buildUpliftDocx`** — there is no PDF, no
   `window.print()`, no print stylesheet. The filename carries the matter name
   (`Uplift_Justification-Smith 29964.docx`) via `matterFilename()`, which mirrors
   `matter_suffix()` in `_narrator/docx_writer.py`; the two must agree, because
   the narrator's output folder is derived from this file's stem. It was
   `LAA_Uplift_Data_Summary.pdf` until 6 August 2026, `Uplift_Justification-<matter>.pdf`
   until 7 August 2026. Libraries are served from `vendor/`, not a CDN; see
   `vendor/_PROVENANCE.md`. `jspdf.umd.min.js` was deleted from there on
   7 August 2026 — the generator it served is gone.

   **The visible strings are the extraction contract, and they were carried over
   word for word.** Section headings, `Label:  Value` details, `•  ` bullets, the
   empty-Stage-1 sentinel, the deemed-threshold line and the evidence pair all say
   in the docx exactly what they said in the PDF, so the two parsers expect the
   same things. What is *gone* is the per-page furniture problem: the docx puts
   the header ("Uplift Justification  |  <matter>") and the CONFIDENTIAL footer in
   real Word header/footer parts, so the body paragraph stream python-docx walks
   contains no repeated lines at all. `HEADER_PATTERN`/`FOOTER_PATTERN` in
   `extract.py` are therefore a **PDF-only** concern now — still load-bearing
   there, and still matching the pre-rename wording because PDFs made before it
   are in live matters, but with no docx equivalent to keep in step.
2. **Uplift Narrator** (`_narrator/`) — the back-office tool that turns that
   summary into the finished LAA enhancement narrative. It drives a local LM
   Studio model directly and verifies the result. It reads **both** formats,
   dispatching on the file's first bytes (`extract.detect_format`): `.docx` to
   `extract_docx.py`, PDF to the frozen path in `extract.py`.

GDPR-sensitive throughout. Nothing leaves the machine, and that is enforced in
code — see `lmstudio.py`, which refuses any endpoint that is not loopback or
the WSL host gateway unless `UPLIFT_LMSTUDIO_ALLOW_REMOTE=1` is set.

`_narrator/README.md` is the user-facing document and is current. **Read it
before this file** — it covers what the tool produces, how to choose a model,
prompt editing, and troubleshooting. This file covers only what a *developer*
picking the work up needs.

## Current state

> **7 August 2026 — the Collator now downloads a `.docx`, and that closed the
> defect class the rest of this section is mostly about.** Still on branch
> **`redesign/stage1-labels`**; nothing on `main`, so nothing is live.
> **`_PLAN.md`, "THE .DOCX OUTPUT", carries the decision and its four settled
> questions — read it with this.** In short:
>
> - **The PDF generator is gone, not kept alongside.** `generatePdfSummary` is
>   retired; `docx-summary.js` builds the document from hand-written OOXML, zipped
>   by the vendored `fflate` (0.8.3). `jspdf.umd.min.js` is deleted from
>   `vendor/`. Offering both formats would have kept jsPDF, kept a wrapping
>   release gate, and doubled every future label change — to preserve the format
>   that caused the two worst defects this project has had. A solicitor who needs
>   a PDF prints one from Word.
> - **`APP_VERSION` is 1.13.** 1.11 and 1.12 were both built and never shipped, so
>   "v1.10 or earlier ⇒ legacy label set" still holds and every `pre-v1.11` comment
>   is still accurate as a boundary. The number moved because **the output format
>   is as much of the extraction contract as the label set**: two formats must not
>   share one version, so a PDF claiming v1.13+ is by definition not the app's own
>   work and `diagnose()` can say so.
> - **`extract.py` dispatches on content, not extension** (`detect_format`): `%PDF`
>   → the frozen legacy path in `extract.py`, `PK` → the new `extract_docx.py`.
>   A mismatch between name and content is reported as damage, never guessed
>   around. **The PDF path is permanent** — those files are in live matters.
> - **The docx contract is paragraph equality**, and it is a stronger contract than
>   a text layer. Every heading, detail line, bullet and sentinel is exactly one
>   `<w:p>`; python-docx returns each whole. So `extract_docx.py` has **no
>   rejoining logic and must never grow any** — joining is where the PDF path's
>   ambiguity came from. Pasted text cannot imitate structure either: a solicitor's
>   newlines become `<w:br/>` *inside* the explanation's own paragraph, so no line
>   of it can ever equal a heading paragraph. The evidence section keeps its
>   last-occurrence rule anyway, because a document edited in Word afterwards can
>   contain anything.
> - **Only the *reading* differs.** Label lookup, the `_SECTION_KEY_PREFIXES`
>   guard, the unrecognised-label records and every downstream meaning are shared
>   with the PDF path rather than re-implemented — and every visible string is
>   carried over verbatim, so both formats state the same things in the same words.
> - **`measure_pdf_labels.js` is deleted.** It existed only to measure jsPDF
>   wrapping. The PDF *fixtures* and every PDF extraction test stay.
> - **New standing tool: `node _narrator/tests/build_docx_fixture.js`.** Rebuilds
>   `sample.docx`, `deemed.docx` and `nasty.docx` with the real generator, labels
>   read live from `content-data.js`, deterministic output. Run it whenever a label
>   or the generator changes — a hand-copied fixture label would silently start
>   testing a document the app can no longer produce. `nasty.docx` is the
>   adversarial one: a pasted fake DISCLAIMER heading, a fake EVIDENCE ON FILE
>   block claiming confirmation, a real Stage 1 label on its own pasted line,
>   bullet characters and a control character, all of which must stay inert.
> - **Verified:** 396 tests pass under **both** WSL and Windows Python;
>   `drive_form.js` 29/29 including a full docx round trip (real click, real
>   download, read back with python-docx); and a real-Word COM acceptance test —
>   Word opened the file without offering to repair it, extraction was identical
>   after a Word re-save, and the `docProps` creator "Uplift Collator v1.13"
>   survived while the file recorded the re-save in `lastModifiedBy` — which
>   the diagnostics surface as a boolean, never as the name (see below).
> - **The docx forensics replace the PDF `producer` check.** `diagnose_docx`
>   reports the creator string only when it is the app's own stamp, the boolean
>   `resaved_by_another` (Word writes a PERSON's name into lastModifiedBy, so the
>   name never appears), `created`/`modified`, the gap between them, structural
>   damage, and per-section match flags — structure only, no client text, no
>   filename, same GDPR rule as the PDF diagnostic, tightened by the 7 August
>   launch review.

> **6 August 2026 — the deemed-threshold route** (recorded here 7 August; the
> session that built it updated `_PLAN.md` but not this file). Spec Para 7.23(a)
> deems the Paragraph 6.13 threshold satisfied for a panel member's own work, and
> the tool now relies on it: a panel member with nothing ticked at Stage 1
> proceeds to Stage 2, the summary prints "Threshold test: deemed satisfied by
> panel membership (Spec Para 7.23(a))." beneath the empty-Stage-1 sentinel (in
> addition to it, never instead of it), and the narrator writes the deemed claim
> only when three statements agree: that line, a ticked panel, a named fee
> earner. **Stage 1 became 18 labels, Stage 2 23** (limb (c) gained novelty and
> weight carriers, each `requires_stage2`); the counts below in the 4 August
> block are of their date. The referral telling a solicitor to telephone the firm
> is gone — the tool handles every Stage 1/Stage 2 situation internally.

> **4 August 2026 — the Collator was redesigned, and it changed the narrator's
> input.** Work is on branch **`redesign/stage1-labels`** (pushed; nothing on
> `main`, so nothing is live). **`_PLAN.md` in the repo root carries the accurate
> build status — read it before this file.** Most of what follows was written
> against the PDF output; where it describes wrapping or text-layer damage, read
> it as the **legacy** path. In short:
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
>   optional tick on page 5 → an `EVIDENCE ON FILE` section in the summary (the
>   PDF then, the docx now) → `extract_evidence_confirmation()` → the gate. **The status line and the sentence
>   beneath it must agree** before this counts as confirmed. Either alone is one word
>   from reversing its meaning — "Not confirmed" contains "confirmed", so losing a
>   "Not " in transit would turn a refusal into an assertion to the LAA. Two strings
>   that fail in opposite directions. Anything else reads as false and, unlike a
>   criterion label, does not stop the run. A pre-v1.11 PDF has no such section and
>   correctly yields False.
> - **Anything printed into the PDF wraps, and wrapping is where this breaks.**
>   *(Legacy path only since 7 August 2026 — nothing wraps in a `.docx`, and this
>   bullet is the whole reason the format changed. The machinery below is still
>   live and still needed: it is what reads the PDFs sitting in live matters.)*
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
>   changes how PDFs already in live matters are read. *(In the docx this cannot
>   arise in an unedited file at all — pasted lines live inside the explanation's
>   own paragraph — but `extract_docx.py` keeps the last-occurrence rule for the
>   evidence section anyway, for documents someone has edited in Word.)*
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

App version **1.13** (7 August 2026) in `content-data.js` — 1.11 on 4 August and
1.12 on 6 August were both built and never released. Simon confirmed on 1 August
2026 that narrator-only template additions do **not** bump it; each of these
moved because the Collator itself changed, and 1.13 because the output *format*
changed, which is part of the same contract.

**396 tests**, all passing (was 281 after the 4 August redesign), none touching
the network. Verified under **both WSL and Windows Python on 7 August 2026** —
the long-standing gap where Windows had not been re-run since the redesign is
closed. Command:

```bash
conda activate uplift-narrate
python -m unittest discover -s _narrator/tests
```

The pipeline is complete and works end to end: extract → skeleton → prompt →
polish via LM Studio → deterministic citation check → LLM second opinion →
verdict → Word. Both the GUI and the CLI run the identical pipeline through
`polish.run()`, so the two can never disagree.

**The deliverable is `narrative-polished-<matter>.docx`** — a fragment written
to paste into the CCMS bill narrative as its final section, named for the case
so the attachment says which matter it is. `narrative-polished-<matter>.md`
remains as the audit copy; both fall back to the bare name when the input carries
no usable matter name. Stale output is cleared by pattern
(`docx_writer.clear_derived`) — by exact name, a reused folder would keep a
previous client's named Word file beside the new one. See the README for the layout and for why the .docx
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

**Legacy path, and permanent.** The `.docx` move on 7 August 2026 means no *new*
file can arrive in this state, but every matter begun before then holds a PDF, so
all of this stays live. The decision below is settled; do not reopen it because
the format changed.

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
answers into the web app from the damaged copy and download a fresh summary —
which since v1.13 is a `.docx`, immune to this. `extract.py` already tells the
user exactly this.

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
resume from a JSON file; its file picker takes a summary document, not JSON.
Worth closing if it ever becomes a nuisance.

**Defect found and FIXED the same day, 7 August 2026 — kept here for the
lesson.** The first pass at teaching the GUI `.docx` widened the drop zone and
the Browse filter but left `_load_pdf` and `main()` rejecting anything not
ending `.pdf` — so every dropped Word summary was refused with "Please select a
PDF file", and dragging a `.docx` onto `_Generate_Uplift_Narrative.bat` opened
an empty window. A cross-checking documentation pass caught it. All three gates
now accept `(".docx", ".pdf")` together, and
`tests/test_gui_accepts_docx.py` holds them together: it fails on any bare
`.pdf`-only `endswith` gate in `narrate_gui.py`. The lesson is the standing one:
**when you widen a gate, grep for its siblings** — the same rule as "when you
correct a claim, grep for it". (`_load_pdf` keeps its name as the launcher-facing
API; its docstring says it loads either format.)

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
- **Synthetic fixtures only.** Never read a real client file — PDF or `.docx` —
  even when it is the most direct reproducer; `narrate.py --debug` exists
  precisely so extraction failures can be triaged on real files without exposing
  client text. From a PDF, only `producer`, `creator`, `CreationDate` and
  `ModDate` are read — software names and timestamps. From a `.docx` the
  equivalent fields can carry a PERSON (Word writes the Office account name
  into `lastModifiedBy`; a foreign document's creator is usually its author),
  so the diagnostics read them but never echo them: the creator string is
  output only when it full-matches the app's own stamp, and the re-save
  survives only as the `resaved_by_another` boolean. Neither format's
  diagnostic includes the filename (it carries the matter), and Title,
  Subject and Keywords are never touched at all. Together these still
  distinguish "the app made this" from "something rebuilt it in transit" —
  without ever naming who. There is **an allow-list per format**:
  `tests/test_empty_extraction.py` for `diagnose`, `tests/test_extract_docx.py`
  for `diagnose_docx`. Both fail on any new key, which is the point — widen them
  deliberately, never loosen them.
- Direct push to `main` is allowed (`.claude/settings.local.json`).
