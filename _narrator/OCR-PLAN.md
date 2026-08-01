# OCR fallback — revised plan

**Status: awaiting approval. No code written.**
Supersedes the sketch in `HANDOFF.md`. Written 1 August 2026 after the
independent review in `OCR-DESIGN-REVIEW.md` concluded the original design
should not be built as written.

## What changed, and why

Two decisions moved.

**1. Verification is now a full proofread of the solicitor's own words**, not a
list of numbers. The numbers-only gate could not meet its own objective: it never
saw the uplift percentage, split `1 ,400` into two fields neither of which could
remove the space, and was blind to both number words ("three experts") and digits
read as letters (`l,400`, `S0%`) — none of which contain a digit to scan for.

This is a **simplification**. Quantity-span detection, confusable detection and
digit scanning are all cut. The human reads the prose.

**2. Partial recovery stops the run.** This is the finding that mattered most,
because it is the one a proofread cannot cover. If OCR recovers 5 of 7 criteria,
`extraction_is_empty()` sees five entries and reports success; the skeleton
narrates five criteria cleanly; and both the citation check and the LLM review
compare against that already-wrong skeleton, so both pass. The output is a
fluent, fully-cited narrative making a **weaker claim than the solicitor
actually made**. The user proofreads five explanations and cannot know two are
missing.

Content verification and structural verification are different problems. The
human covers content; only the recovery contract below covers structure.

## The shape

Eight phases. Every one fails closed: any phase that cannot prove its own result
stops the run rather than passing a partial result on.

### 1. Detect

Widen the trigger. "Both Stage dictionaries empty" is not enough — a mixed PDF
with one intact page and one outlined page recovers a criterion or two, looks
non-empty, and bypasses the fallback entirely. Ordinary extraction is treated as
*incomplete* (not merely empty) when any expected section is missing, or when
per-page character counts show some pages with text and some without.

OCR is offered only when `diagnose()` shows the pages are genuinely unreadable —
outlined or rasterised — and it is always offered, never taken automatically.

### 2. Render

- `pypdfium2` at 300 dpi. Honour each page's rotation and verify the render is
  upright; do not assume the OCR engine will orient it.
- Validate both dimensions against `MaxImageDimension` (10000) **before** OCR and
  fail clearly rather than silently resizing.
- Zero-padded filenames (`page-001.png`), because `page-10.png` sorts before
  `page-2.png` and would silently reorder a long narrative.
- A **fresh run directory per attempt**, not the reused `<stem>-narrative/`.
  Reusing it risks OCR-ing stale PNGs from an earlier cancelled attempt and
  mixing new images with an old narrative.
- Emit an explicit page manifest; verify exactly one image per PDF page.

### 3. OCR

- One PowerShell process, one engine instance, for the whole batch — established
  by experiment; per-process WinRT contention makes one-process-per-page fail.
- A **static script file** with paths passed as arguments. Never interpolate a
  client-derived folder name into PowerShell source.
- Output **structured JSON per page, with word and line bounding boxes** — not
  delimited prose. The boxes are needed three times over: to strip headers and
  footers spatially (§4), to crop the page for the confirmation screen (§7), and
  to count blocks independently of the label matching (§6). This is the one place
  the plan is *more* work than the sketch, and it pays for itself three times.
- Force UTF-8 on stdout and decode strictly. Capture in memory, then write the
  audit file — never redirect PowerShell's stdout into the `/mnt/c` directory it
  is reading, which silently yields a zero-byte file.
- Verify the `en-GB` recogniser exists and the engine is usable. Never silently
  fall back to another installed language.
- Bounded timeout with process-tree kill. Any page-level error, or any empty
  page, fails the whole run.
- Treat execution-policy / AppLocker / WinRT activation failures as "OCR
  unavailable" — never as partial data.

### 4. Clean

Strip headers and footers by **spatial band**, using the bounding boxes, not by
regex. A single mis-read character in the footer defeats the existing regex, and
a page break inside an explanation would then inject `Page 2 of 4` and the
repeated document header straight into the solicitor's prose — digits that would
be dutifully proofread as if they belonged there.

Keep `section_slice()`: the headers survived OCR 6 of 6 in measurement. Then
verify each section header occurs exactly once, in order.

### 5. Parse — new module, strict parsers untouched

`extract.py`'s `startswith("•")` parsing stays exactly as strict as it is; it
still handles real PDFs. OCR-tolerant parsing lives in a new module with its own
complete extraction path — case details, panel, both stages, uplift. No mixing of
strict-extracted and OCR-extracted fields.

A criterion is a **structured record**, not a matching line:

```
label → category → explanation marker → explanation body
```

- Label candidates are built from **adjacent line windows**, so a label that
  wraps across two or three rendered lines is still reconstructed.
- Normalisation before comparison: NFKC, case-folding, whitespace collapse,
  dash and quote normalisation.
- A match needs an absolute score **and** a clear margin over the runner-up.
  0.85 is a candidate-generation threshold, not permission to accept.
- The category restricts candidate labels to that question block, so a phrase in
  an explanation cannot be promoted into a criterion from a different section.
- The explanation marker is recognised only in its expected position after a
  valid label/category pair, with tightly bounded tolerance for `Explanatlon` or
  a lost colon. A fuzzy label alone never ends an explanation.
- The state machine spans page boundaries: a label, its category and its
  explanation can land on different pages.
- **Once the key resolves, take the label and category text from
  `content-data.js`.** OCR versions of fixed wording never enter `formData`.
  Fixed text becomes incorruptible, and the human only ever proofreads the
  solicitor's own prose.
- **Version-gate the label set.** The PDF stamps its own version — `script.js:980`
  writes "Uplift Tool v1.10" into the page text, so OCR can read it. Fuzzy
  matching an old label onto a renamed current one would silently attach a
  different legal rationale. Unknown or unsupported version stops the run.

### 6. Recovery contract — the load-bearing safeguard

The run succeeds only if it can prove complete recovery. **There is no "proceed
with 5 of 7".**

- Every expected section present, once, in order.
- Panel either explicitly "None selected", or every detected line mapping uniquely.
- Each Stage either explicitly empty, or every detected record having one label,
  one category and one non-empty explanation.
- Detected block count, category count, explanation-marker count and parsed
  criterion count all agree.
- No duplicate criterion key.
- Case details and uplift complete.
- Every ambiguity resolved — not resolved by taking the best score.

The block count must come from **layout geometry**, independent of the label
matching it is validating. Deriving "we found everything" from "everything we
found" proves nothing.

Residual blind spot, stated plainly: if OCR drops an entire criterion block —
label, category and explanation together — a geometric count of what is on the
page is the only thing standing between that and a silently weaker claim. It is
the best available mitigation, not a proof.

### 7. Confirm — a real gate, on the UI thread

`NarrateWorker.run()` splits into three: background render/OCR/parse → **UI
confirmation** → background skeleton/polish. No dialog is ever raised from a
worker thread.

The screen shows the rendered page beside every recovered field, with the
current field's region highlighted on the page image:

- fee earner, matter type, case/matter name — editable
- uplift percentage — editable, mandatory, integer 0–100, `%` context shown
- for each criterion: canonical label and category **read-only** (they came from
  `content-data.js`, so there is nothing to check), explanation **editable**

Every field must be explicitly acknowledged or edited. Completion stays disabled
until all are. Cancelling writes nothing, calls no model, and leaves no skeleton.

### 8. Audit

A unique run directory holding: source PDF hash and size (re-checked after
rendering), the ordered page manifest with rendered dimensions, raw OCR JSON with
coordinates, the cleaned text the parser consumed, every fuzzy candidate with its
score and runner-up margin and the decision taken, the before-and-after of every
edit with its acknowledgement, the final validated `formData`, the Collator
version, parser version, OCR language and OS build, and the completion or
cancellation status.

`formData` is stamped OCR-derived, and that stamp reaches `citation-check.txt`
and `narrative-input.json` — but **not** the narrative itself, which is a
document to the LAA and not a place for tooling provenance.

## Tests

Synthetic only, and none requiring Windows. The golden fixture is the OCR text of
`tests/fixtures/sample.pdf`, captured once and committed.

The important tests prove **rejection**, not recovery:

- labels wrapped over two and three lines
- an explanation quoting another criterion's label verbatim
- mangled or missing `Explanation` marker
- five parsed records from seven detected blocks → must stop
- duplicate labels; ambiguous top-two matches → must stop
- header/footer text corrupted into an explanation
- wrong, missing or out-of-range uplift
- an older Collator version → must stop
- page 1/2/10 ordering; missing, duplicate and stale page images
- UTF-8 and BOM handling; non-zero exit; stderr-only failure; timeout; truncated
  PowerShell output
- rotated and over-limit page geometry

Rendering is testable cross-platform with `pypdfium2`. The PowerShell call is
mocked. A **production preflight** against a tiny bundled non-client image
catches a missing language pack or broken WinRT, which no unit test can.

## Explicitly cut

Digit-run scanning; quantity-span and confusable detection (the proofread covers
these); OCR-derived labels and categories in `formData`; `normalise_text()` as
the whole cleanup strategy; a bare "OCR-derived" stamp as the audit mechanism;
tiling for oversized pages — fail clearly instead.

## Kept from the original design

One PowerShell process and one engine for the batch; 300 dpi; entirely
on-device; rendered pages retained as the audit record; strict and OCR parsers
kept separate; GUI-only; no vision model.
