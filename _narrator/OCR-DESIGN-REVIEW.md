# Independent review of the OCR fallback design

Produced 1 August 2026 by GPT-5.6 (Sol) at high reasoning effort, reviewing the
*design only* — no code existed. Run read-only against a clean git worktree so
no client material was in reach.

Kept verbatim as the record of what was found. The resulting design is in
`OCR-PLAN.md`; the two decisions it forced are noted in `HANDOFF.md`. Where this
review and `OCR-PLAN.md` disagree, the plan wins — it also carries the user's
later decision to confirm all recovered prose, which removes the need for the
quantity-span and confusable detection recommended in finding 2.

---

## Overall verdict

I would not build this as written. The render/OCR choice is sound, but the recovery path still fails open in several places. Most seriously, it can produce a structurally convincing narrative from incomplete criteria or an unconfirmed uplift percentage. The existing downstream checks will not catch that because they compare the polished narrative with an already-wrong skeleton.

## Prioritised findings

### 1. Critical: the uplift percentage bypasses the human gate

Scenario: OCR reads `75%` as `15%`, or as `7S%`. The proposed dialog scans recovered explanations only, so the uplift is never shown. `15` is plausible and passes any simple range check; `7S` may produce no uplift at all. The skeleton then either claims the wrong percentage or substitutes `[uplift %]` via [skeleton.py](_narrator/skeleton.py:109), which the model may fill.

Why it matters: the uplift is the headline value being claimed. A wrong but plausible value is the highest-consequence failure here.

Recommended change: make uplift a mandatory, separately confirmed field regardless of the explanation scan. Show a crop containing the complete “Proposed Uplift Percentage” line. Require an integer from 0–100, require the `%` context, and do not permit an OCR run to continue with a missing uplift or placeholder. Range validation is only a sanity check; `15` versus `75` still requires human confirmation.

### 2. Critical: “digit runs” are not numbers

Scenario:

- `1 ,400` becomes two fields, `1` and `400`; editing either cannot remove the erroneous space.
- `£1,250.50`, `12.5%`, `10–12 hours`, `38(6)`, and dates are split into several unrelated runs.
- `1,400` becomes `l,400`, `O.5`, `S0`, or `2O13`; some or all of the quantity is no longer matched.
- “three experts”, “eight years”, “twice”, “half”, or “first hearing” contains no digit at all.

Why it matters: these are precisely the plausible numerical corruptions the human gate is supposed to catch. Recorded offsets do not help if the recorded span is too narrow.

Recommended change: identify and replace whole quantitative expressions, not digit runs. Include signs, currency symbols, grouping/decimal separators, ranges, units, `%`/“per cent”, dates, parenthesised subsection numbers, number words and ordinals. Also flag mixed number-like tokens containing likely OCR confusables near numeric punctuation or units, such as `l,400`, `S0%`, or `2O13`. Never automatically turn letters into digits; present the whole source span for human resolution.

Apply confirmed replacements as non-overlapping immutable spans against the original recovered string, preferably by constructing a new string or applying from the end. Assert that every recorded source substring is unchanged before substitution.

### 3. Critical: partial recovery must be fatal

Scenario: seven criterion blocks are visible, but only five labels match. The resulting dictionary contains five entries, so the current `extraction_is_empty()` logic considers it successful because it only checks whether either Stage dictionary is non-empty ([extract.py](_narrator/extract.py:243)). The skeleton then cleanly narrates five criteria. Citation and model verification both compare against that incomplete skeleton and may report success.

Why it matters: omission changes the claim’s factual basis and may lower or distort the justification. There is no downstream recovery.

Recommended change: if seven structural records are detected and only five are confidently identified, stop the run. Do not offer “proceed with five.”

Success needs a strict recovery contract:

- Every expected section is present once and in order.
- Panel is either explicitly “None selected” or every detected panel line maps uniquely.
- Stage sections are either explicitly empty or every independently detected record has one label, one category and one non-empty explanation.
- Detected block count, category count, explanation-marker count and parsed criterion count agree.
- No duplicate criterion key occurs.
- Case details and uplift are complete.
- Every ambiguity is resolved or the run stops.

There remains an unavoidable blind spot if OCR omits an entire criterion block, including its label, category and explanation. A numbers-only review cannot prove against that. The best available mitigation is an independent layout/block count using OCR geometry rather than deriving completeness from the same label matches.

### 4. Critical: a label match alone is not a safe criterion boundary

Scenario: an explanation contains “Work completed in significantly less time” or quotes another criterion label nearly verbatim. A line-only fuzzy matcher treats it as a newly selected criterion, truncates the real explanation and adds an unselected template. In the panel section, a false membership match causes the skeleton to make the consequential “guaranteed minimum enhancement” assertion, including the canonical 15%.

Why it matters: this creates positive audited assertions that the solicitor never selected. The numbers dialog will not expose the criterion selection itself.

Recommended change: treat a criterion as a structured record, not an isolated matching line. Require:

1. A one-to-three-line label candidate at the label’s expected horizontal position.
2. The canonical category title immediately following it, also allowing wrapping.
3. A recognisable explanation marker immediately after the category.
4. A category that restricts the candidate labels to that specific question block.
5. Monotonic document/questionnaire order unless there is strong evidence the producer reordered content.

Once the key is resolved, store the canonical label and category from `content-data.js`; do not let OCR versions of fixed text enter `formData`. Stage/category digits and canonical legal citations then do not need human confirmation. Only user-entered text and the uplift should flow from OCR.

### 5. High: `0.85` is not an acceptance policy

The current labels themselves are fairly well separated. Using case-folded raw text, the closest pair is approximately:

- Panel: `0.641`
- Stage 1: `0.459`
- Stage 2: `0.705`

That makes wrong-label-to-wrong-label collisions at `0.85` unlikely when a complete label has been isolated correctly. It says nothing about matching explanation prose, wrapping, boundary errors or future labels.

A defensible production false-match/miss rate cannot be inferred from one seven-label fixture. Long-label wrapping will cause systematic misses if matching operates on individual OCR lines, while prose that repeats a label can cause a deterministic false positive.

Recommended change:

- Use Unicode NFKC, case-folding, whitespace collapse, dash/quote normalisation and conservative punctuation normalisation.
- Match adjacent line windows so wrapped labels can be reconstructed.
- Preserve semantically meaningful parentheticals such as “as per Stage 1.”
- Require both an absolute score and a healthy margin over the runner-up.
- Treat `0.85` as a candidate-generation threshold, not permission to accept.
- If two candidates are plausible, or the best match lacks the full label/category/explanation structure, stop.

Also version-gate the label inventory. The PDF records the Collator version. Fuzzy matching an older label to a newer current label could silently attach a changed template or legal rationale—the exact drift that the strict parser currently exposes. Require a supported version or maintain versioned label sets.

### 6. High: explanation boundaries need a fail-closed state machine

Scenario: `Explanation:` becomes `Explanatlon:`, loses its colon, wraps, or disappears. A permissive parser may append the category and next criterion to the previous explanation. Conversely, a label-like sentence inside the explanation may terminate it early.

Recommended change: use a state machine:

`label → category → explanation marker → explanation body → next fully validated record or section end`

Permit tightly bounded fuzzy recognition of the word “Explanation” and an optional/misread colon only in the expected position after a valid label/category pair. Never use a fuzzy label by itself to end an explanation. A subsequent label ends the current explanation only when the following lines also form a valid category-and-marker sequence.

If the marker cannot be resolved, reject that record and therefore the run. Do not guess where its explanation starts. The state machine must span page boundaries because the PDF generator can place a label, category and explanation on different pages.

### 7. High: reusing `normalise_text()` unchanged can inject footer page counts

Scenario: OCR changes one character in the footer or header, so the existing regex does not remove it. A page break inside an explanation then inserts something like `Page 2 of 4` and the repeated document header into the solicitor’s prose. Those digits may be “confirmed” even though they should not be in the explanation at all.

Why it matters: this can create a false page count in the final narrative or corrupt criterion boundaries.

Recommended change: keep `section_slice()` if exact headers remain a validated invariant, but do not use text-regex normalisation as the only OCR cleanup. Capture OCR word/line bounding boxes and discard the known header/footer spatial bands before parsing. Preserve the raw OCR result separately for audit. Then validate that section headers occur once, in order.

### 8. High: OCR-specific parsing is needed for every recovered field

The proposal names a new criterion parser but not equivalent handling for case details and uplift. The existing routines are strict line regexes ([extract.py](_narrator/extract.py:90), [extract.py](_narrator/extract.py:181)). Wrapped case names, `Fee Eamer`, or `7S%` will become blank or truncated.

Recommended change: give the OCR module its own complete extraction path: case details, panel, both stages and uplift. Do not mix strict-extracted fields with OCR-extracted fields opportunistically. Validate the whole OCR result before passing it to `skeleton.py`.

Also broaden the OCR trigger beyond “both Stage dictionaries empty.” A mixed PDF—one normal text page and one outlined page—can recover one criterion, bypass the fallback and silently proceed. Per-page text diagnostics and missing expected sections should make the ordinary extraction incomplete, not successful.

### 9. High: the confirmation dialog must be a real gate

A dialog where every value is prefilled and “OK” is immediately enabled is ceremonial. Users can press Enter without looking.

Recommended change:

- Show a highlighted crop or bounding box, not merely the full 300-dpi page.
- Require each quantity to be explicitly marked “matches” or edited.
- Always include uplift.
- Show page number and surrounding OCR context.
- Disable completion until every item is acknowledged.
- Cancellation must prevent skeleton creation, model calls and narrative writes.

Architecturally, split the current monolithic `NarrateWorker.run()` ([narrate_gui.py](_narrator/narrate_gui.py:135)) into two phases: background render/OCR/parse, then UI confirmation, then a second background phase for skeleton/polish. Avoid raising a dialog from the worker or leaving it blocked on fragile cross-thread synchronisation.

### 10. High: the audit record is currently underspecified

“Stamped as OCR-derived” plus PNGs is insufficient to reconstruct what happened.

Recommended audit bundle:

- Hash and size of the source PDF, checked again after rendering.
- Exact ordered page manifest and rendered dimensions.
- Raw OCR output with page/word coordinates.
- Cleaned OCR text used by the parser.
- All fuzzy candidates, scores, runner-up margins and decisions.
- Original and corrected quantity spans, page locations and acknowledgements.
- Final validated `formData`.
- Collator version, parser version, requested OCR language and Windows OCR/OS information.
- Completion/cancellation status.

Use a unique immutable run directory. Reusing the existing `<stem>-narrative` directory risks mixing new OCR images with an old narrative if OCR is cancelled or fails before [the existing output overwrite](\_narrator/narrate_gui.py:189). Old PNGs can also be accidentally re-OCR’d.

### 11. Render/PowerShell plumbing needs explicit fail-closed controls

Specific production failures and changes:

- Page order: `page-1.png`, `page-10.png`, `page-2.png` is a normal lexical order. Use zero-padded names or an explicit numeric manifest, and verify exactly one result per expected PDF page.
- Stale/extra images: never OCR every arbitrary PNG in a reused directory. Use a unique directory and constrained manifest.
- `MaxImageDimension = 10000`: validate both rendered dimensions before OCR. A4 at 300 dpi is safe; unusual long or large pages may not be. Fail clearly rather than silently resize. Tiling would require overlap and deduplication logic and is probably not worth adding for this product.
- Rotation/crop boxes: detect page rotation and verify the rendered page is upright. Include rotated and non-A4 fixtures. Do not assume the OCR engine will orient it.
- Multi-page/resource limits: render sequentially, enforce page/pixel/disk limits, report progress and support cancellation. Any page-level OCR exception or empty result must fail the entire run.
- Encoding: force UTF-8 for PowerShell stdout, decode strictly and keep protocol output separate from diagnostics. Windows PowerShell defaults are not reliable enough for em dashes, curly quotes and non-ASCII names.
- Protocol: structured JSON per page with lines/words and bounding boxes is safer than unrestricted delimited prose. If delimiters remain, verify names/counts and ensure stdout contains nothing except protocol data.
- PowerShell/WSL failures: preflight `powershell.exe`, WSL interop, Windows visibility of the image directory and the exact Windows path. Capture stdout in memory and only then write the audit file.
- Policy blocking: treat execution-policy, AppLocker and WinRT activation failures as “OCR unavailable”; do not fall back to partial data.
- Language: explicitly create `en-GB`, verify it is supported and that engine creation returns a usable engine. Never silently fall back to another installed language.
- Hangs: impose a bounded timeout and terminate the process tree on cancellation/timeout.
- Paths: pass paths as arguments to a static script and use literal-path semantics. Never interpolate a client-derived folder name into PowerShell source.

### 12. Tests need to prove rejection, not just recovery

The captured synthetic OCR output is a good golden fixture, but the most important tests are hostile mutations:

- Wrapped labels over two and three lines.
- An explanation that exactly repeats another label.
- Mangled or missing `Explanation`.
- Five matches from seven detected blocks.
- Duplicate labels and ambiguous top-two matches.
- Footer/header corruption inside an explanation.
- `1 ,400`, `£1,250.50`, `12.5%`, ranges, number words and `l/O/S` confusables.
- Multiple edits that change string length.
- Wrong/missing uplift.
- Older Collator version.
- Page 1/2/10 ordering, missing/duplicate page frames and stale PNGs.
- UTF-8/BOM, nonzero exit, stderr-only error, timeout and partial PowerShell output.
- Rotated and over-limit page geometry.

Rendering the synthetic PDF with `pypdfium2` can be tested cross-platform. Mocking Windows OCR is appropriate, but a production preflight using a tiny bundled non-client image would catch missing language packs and WinRT breakage that unit tests cannot.

## What I would cut or change

Cut:

- Bare digit-run scanning.
- Single-line fuzzy matching as an acceptance decision.
- OCR-derived labels and category titles in `formData`; use canonical values.
- Reuse of `normalise_text()` as the complete OCR cleanup strategy.
- A bare “OCR-derived” stamp as the audit mechanism.

Keep:

- One PowerShell process and one OCR engine for the entire batch.
- 300 dpi.
- On-device processing.
- Retained rendered pages.
- Separate strict and OCR parsers.
- GUI-only OCR recovery.

## Challenge to a settled decision

I challenge “confirm the numbers only” only if it literally means “confirm digit runs in explanations and trust every other OCR character.”

That cannot meet the stated safety objective because it misses number words, digit-to-letter substitutions, the uplift itself, and OCR errors in the fee-earner/case identity. At minimum, the same screen should confirm:

- All semantic quantity-bearing spans, including suspicious number-like text.
- The uplift percentage.
- The fee-earner name and case/matter identifier.

That is still far short of a full prose proofread, but without those additions the design knowingly permits false audited facts through its only human gate.

I do not challenge the no-VLM, on-device, 300-dpi, GUI-only or single-PowerShell-process decisions.