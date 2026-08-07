# Ceiling-UX form redesign — PROPOSED, awaiting Simon's approval

Drafted 7 August 2026, late evening. Nothing here is built. Fable drafted the
plan; gpt-5.6-sol reviewed it independently (13 findings, incorporated below —
two of Sol's claims were themselves corrected on verification: the
re-evaluation wiring already exists in `script.js`, and `parseFloat('5e1')` is
50, so the existing gate comment is right and Sol's correction of it was
wrong). Responds to Simon's brief of 7 August 2026 (project memory
`project_ceiling_ux_brief`):

1. The solicitor **can't be allowed to go over** the per-court limit —
   blocking, not warning.
2. They must be **politely told and have it EXPLAINED** that a claim limit
   exists for their court — obvious while filling in; a fundamental
   characteristic of the claim form.
3. They may also need telling that **more evidence makes the proposed figure
   more likely to be seen as justified** — thin justification may get less
   than is asked.
4. **Not the narrator's job** — the round-9 narrator gate was reverted;
   enforcement and expectation-setting live in the Collator form.

## Principles carried forward (already decided, not re-opened)

- **No suggested percentage, ever.** The ceiling is stated as a limit, never
  as advice on what to claim.
- **The form never rewrites a typed value.** The block refuses the download
  and says why; it does not clamp or auto-correct.
- **Verbatim citation rule.** Statements of what the contract/LAA does are
  quoted from `_spec-7.20-7.24-verbatim.md` / `_cag-section-12-verbatim.md`.
  Inference is labelled as drafting advice, never presented as guidance.
- **Deemed route and the 15% panel floor untouched.** The block is an upper
  bound only.

## Surface 1 — Page 1, the Court field announces the limit

Replace the muted `<small>` under the court select with an info-styled
**court-limit panel**, re-rendered on every court change (it is associated
with `#courtLevel` and updated through a polite live region):

- No court selected:
  > The maximum enhancement the LAA can pay depends on the court: Spec para
  > 7.22 caps it at 100% in the High Court, Court of Appeal and Supreme
  > Court, and at 50% in all other courts. Select the court and the form will
  > state the limit that applies to this case.
- Court selected:
  > **{Court}: the maximum enhancement is {ceiling}% (Spec para 7.22).** This
  > is a cap, not a target or a suggestion. The form will not download a
  > proposed uplift above it.

(The "100%, not the 50% that applies below the High Court" comparison stays
on page 5 where it already lives — it was a deliberate v1.12
anti-under-claiming choice — but is not repeated in this panel.)

## Surface 2 — Page 5, the Proposed Uplift field blocks

1. **The limit panel moves above the input** (Sol finding 8 — today the
   statement renders after the box in reading order, so the limit arrives
   after the figure has been typed). Content: the existing ceiling statement
   (unchanged — it already quotes CAG 12.10's one-strong-factor sentence),
   promoted from footnote-grey paragraph to the same info-panel styling as
   Surface 1, plus the Surface 3 evidence text below.
2. **The download gate learns the ceiling.** In
   `checkAllPlaceholdersAndExplanations()`: if `applicableCeilingPercent()`
   is non-null, the value passes the existing canonical regex, and the parsed
   value exceeds the ceiling → `allValid = false`, with a dedicated message in
   the same priority slot pattern as `thresholdGap`.
3. **A click-time guard in `generateDocxSummary()`** (Sol finding 1,
   confirmed at script.js:1535): the handler currently trusts the cached
   `disabled` state. After `syncFormDataFromDom()` it re-checks the ceiling
   predicate directly and refuses with the same message. Form-side
   enforcement, not a generator or narrator gate.
4. **One canonical numeric model** (Sol finding 2, corrected): the regex gate
   stays the sole definition of a valid entry; the ceiling comparison runs
   `Number(raw)` only after the regex passes, and the ceiling error never
   replaces the format error. (`parseFloat('5e1')` is 50 — the existing
   comment at script.js:1366 is accurate; no change to it.)
5. **The inline message becomes a blocking error** (error styling,
   `aria-invalid` set and cleared, visible invalid-input style on the box):
   > **{n}% exceeds the {ceiling}% maximum for the {court} (Spec para
   > 7.22).** The summary cannot be downloaded while the proposed uplift
   > exceeds that limit. Review the figure — the form will not change it.
6. **A visible reason near the download button** (Sol finding 6): the gate's
   explanation currently lives only in the disabled button's `title`, which
   keyboards, touch and screen readers don't reliably reach. Add a visible
   text line beside the button carrying the same message (this benefits every
   gate failure, not just the ceiling). `aria-describedby` on the input
   grows to include the error element; equal-to-ceiling is allowed (Spec 7.22
   says "may never **exceed**").
7. **Re-evaluation wiring already exists** (verified): court change
   (script.js:1930-1940), page-5 arrival (441-444), draft restore
   (1827-1828) and every keystroke (1943-1946) already recompute statement,
   breach check and gate. The drive tests prove it holds rather than build it.
8. The input's `max` follows the ceiling as progressive enhancement,
   maintained in the same update path (real enforcement is 2-3, not `max`).

## Surface 3 — the evidence-begets-award message

- **Stage 2 intro (page 3), one added line:**
  > Drafting advice: make each explanation say specifically what was done and
  > why it was out of the ordinary — these explanations are what will support
  > the uplift you propose at the end of this form.
- **Page 5, inside the limit panel, after the existing ceiling statement:**
  > CAG 12.10: "Enhancement is likely to be allowed at higher levels where
  > more of the above seven factors are present in the case and where any of
  > the factors are strongly present." (The seven factors are the Stage 2
  > headings in this form.) Drafting advice, not LAA guidance: it is the
  > strength and specificity of your Stage 2 explanations that make the
  > proposed figure persuasive — thin or generic explanations risk the LAA
  > allowing less than is asked. A guaranteed panel minimum (CAG 12.20) is
  > unaffected.

  The quoted sentence is verbatim CAG 12.10. The rest is labelled advice —
  Simon's costs-draftsman experience, per the brief — with the panel-floor
  qualification Sol asked for (finding 5), and phrased on strength and
  specificity rather than factor-counting so it cannot reproduce the
  under-claiming drift.

## What deliberately does NOT change

- **The .docx generator and extraction contract** — no visible document
  string moves; the proposed-uplift and ceiling rows stay exactly as the
  nine-round-reviewed contract has them. Sol examined this boundary and
  endorsed it (finding 13), conditional on the click-time guard above.
- **The narrator** — no gate, no re-check (Simon's direction, round 9).
  Extraction keeps reading over-ceiling figures without complaint: legacy
  PDFs and Word-edited documents can still contain them.
- **The legacy PDF path**, and **panel 15% handling** — untouched.

## Consequential work (part of the build, not optional)

- **`drive_form.js` scenarios**: over-ceiling entry → button disabled with
  the right visible reason; correct to exactly-at-ceiling → enabled; court
  change flips the block both ways; click-time guard proven by re-enabling
  the button from the console and clicking; a **real reload** restore test
  (the current restored-draft test simulates the shape, not an actual
  reload — Sol finding 3); 100%-court case at 75% downloads fine.
- **Fixtures** (Sol finding 11): `sample.docx` becomes compliant (75% in a
  50% court is no longer a shape the unedited app can produce). A **new**
  `over_ceiling.docx` fixture carries the over-ceiling extraction case —
  `nasty.docx` keeps its paste-adversarial purpose undiluted. A test asserts
  the over-ceiling document still extracts with no refusal anywhere.
- **Help-text audit** (Sol finding 12): the main help currently says the
  download enables on details + explanations only — it must mention the
  valid-format and ceiling conditions; the page-5 "LAA determines quantum"
  note and the new advice text must state the proposition once, not twice.
  `UPLIFT_PERCENTAGE_GUIDANCE_TEXT` and the court help align with blocking
  behaviour.

## Decision points for Simon (recommendation first)

1. **Mixed-court work** (Sol's HIGH find — the plan's biggest open
   question). The form records ONE court and the ceiling follows it. What
   should a solicitor select when the claimed work spans court levels (e.g.
   proceedings transferred up mid-case)? (a) Adopt the rule "the court
   applicable to the work covered by this claim" and say it in the court
   help; (b) something stricter (e.g. one summary per court level). Your
   costs-draftsman answer needed — without a stated rule, choosing the
   highest court involved quietly exposes the 100% cap for lower-court work.
2. **Decimals.** The gate regex allows two decimal places; the input's
   `step` is 1. (a) Whole percentages only — tighten the regex, keep
   `step=1` (recommended; is a 12.5% uplift ever actually claimed?);
   (b) allow decimals and set `step=0.01`.
3. **APP_VERSION.** (a) Fold into the unreleased 1.13 (recommended — Sol's
   argument: version boundaries mark *released* behaviour, and no 1.13
   document has ever left the building); (b) bump to 1.14 so the version
   stamps the validation regime.
4. **Stage 2 intro line.** (a) Include it (recommended — the expectation is
   set where the explanations are written); (b) final page only.
5. **Matter-type/court conflict.** "Care & Supervision – High Court" matter
   type can sit beside Court = "Family Court / County Court"; the ceiling
   follows the Court field and the two silently disagree. (a) Non-blocking
   notice when they conflict, Court stays authoritative (recommended);
   (b) leave for a later round. Related question, no urgency: should venue
   come out of the Matter Type list now Court is its own field? (Touching
   those strings touches the extraction contract — recommend not now.)
