# Uplift Collator - Version History

## Overview
The Uplift Collator is a confidential web-based tool developed by Woodruff Billing Ltd to help UK Family Law solicitors justify enhanced payment rates (uplifts) from the Legal Aid Agency (LAA). All processing occurs client-side to ensure GDPR compliance.

## Version History

### Version 1.11 - August 4, 2026
**Status:** In development on branch `redesign/stage1-labels` (NOT yet on GitHub, NOT yet live)

**Why this version exists — read this before changing any guidance text.**

On 4 August 2026 the tool was found to be quoting the LAA guidance inaccurately, in
twelve separate places, and **every single error made a claim look weaker than the
guidance allows.** Solicitors using this tool were therefore under-claiming. This was
never a calculator bug; the arithmetic was one symptom of a body of text that was
systematically more pessimistic than the document it purported to summarise.

The three that mattered most:

1. **The percentage bands were invented.** `content-data.js` presented a three-band
   ladder — 10-25% / 25-50% / 50-75%+ — introduced as "Consider these bands as a
   general guide", sitting under a heading reading "LAA's Holistic View & Caps" and
   directly beneath a correctly-cited verbatim quote from CAG 12.10. **Those bands
   appear nowhere in the Costs Assessment Guidance.** The only percentages in the whole
   of Section 12 are the 50%/100% caps (12.2) and the 15% panel minimum (12.20). Worse,
   the invented ladder contradicted the paragraph printed immediately above it: CAG
   12.10 says "A maximum enhancement could be payable on the basis of one factor alone
   where it is particularly strong", while the ladder would have held that same
   solicitor to 10-25%.

2. **The comparison benchmark was wrong.** The tool told solicitors to compare with "a
   fee earner of this level" and "a case of this type". CAG 12.8 says the comparison is
   with "the generality of legally aided proceedings to which the prescribed rates
   apply", and CAG 12.11 *expressly rejects* comparing solely with the same category or
   type of proceedings. This is the most expensive error of the twelve: measured against
   other family cases, hard family work looks ordinary; measured as the guidance
   actually directs, it does not. The wrong benchmark was also baked into the narrative
   conclusion, so it reached the LAA on every bill.

3. **Seven citations pointed at paragraphs that do not exist.** Six references to
   `12.8.1 / 12.8.2 / 12.8.3` — the guidance numbers those sub-limbs `12.8(a)/(b)/(c)` —
   and a quote attributed to "CAG 6.17", which does not exist either; those words are in
   CAG 12.8, quoting Paragraph 6.17 of the Specification.

Also corrected: "harder than average" understated CAG 12.8's threshold ("'Exceptional'
has its normal meaning of 'unusual' or 'out of the ordinary', hence more than simply
above the average"); "50% is often the practical cap unless truly extraordinary"
presented a hard statutory cap (12.2) as a soft one; and the form treated instructing
Counsel as ruling out a responsibility claim, where CAG 12.16 makes it harder, not
impossible.

**Key Changes:**
- **The tool no longer suggests a percentage at all.** No computed figure, no range, no
  auto-fill, no default. The solicitor types the figure they are prepared to justify.
  This closes a defect that had already fired twice in opposite directions: in April
  2026 it suggested 10% on a case that merited 30%, and in August 2026 five Stage 1
  ticks reached the 50% cap so that Stage 2 — the stage that actually justifies the
  figure — could no longer move the number. Both are the same failure: the number
  authored the answer. A better-calibrated number is still a number. Under-claiming is
  silent and permanent; over-claiming is visible and gets argued.
- Stage 1 becomes twelve tickable labels with no typing. It is a pass/fail threshold
  (CAG 12.4) that earns nothing, so it should not consume the solicitor's effort — yet
  the form demanded 10+ words on each of 17 boxes and then presented 11 more to someone
  with nothing left to say. That produced a real submission with six well-evidenced
  Stage 1 factors and only two at Stage 2. The cause was structural, not personal.
- Each label carries a "what counts?" expander whose content is quoted and cited from
  CAG 12.8 — the LAA's own examples, never ours. Invented examples read as an
  exhaustive list however they are captioned, so a solicitor whose situation is not
  listed concludes they do not qualify. Each expansion closes with CAG 12.7's own
  non-exhaustive caveat.
- Stage 2 becomes seven blocks, one per factor in CAG 12.9 — 12.10 confirms there are
  exactly seven. Ticked Stage 1 items carry forward pre-selected, with sentence stems
  rather than blank boxes, so the solicitor supplies cause and consequence and the
  output is already narrative prose. A stem is a completion task, not a writing task.
- The worked example sentences, previously held in textarea placeholders and destroyed
  by the first keystroke, are now shown persistently. They were the most useful content
  in the form and nobody could read them while typing.
- Degree of Responsibility can now be **absent**. CAG 12.9(a) defines it narrowly —
  work done without recourse to counsel, plus addressing evidential issues that would
  have taken an expert's time — and per 12.16, where counsel was instructed throughout
  there is little to claim. A forced closing paragraph would be thin, defensive, and
  would end the narrative on its weakest point.
- The form now asks **which court**. The ceiling is 50%, but 100% in the High Court,
  Upper Tribunal, Court of Appeal or Supreme Court (CAG 12.2). The tool never asked, so
  it silently halved the ceiling for anyone above the County Court.
- **The narrative may now state that supporting evidence is on the case file only where
  the solicitor has said so.** The finished narrative can close "Evidence supporting
  these assertions can be found within the case file" — an assertion to the LAA about
  the state of a file, made under the fee earner's name, which earlier versions added
  automatically to every narrative whether or not anyone had considered it. A tick on
  the final page now carries it, and the sentence is omitted without one. The tick is
  deliberately **optional**: a box that must be ticked to proceed is a rubber stamp, and
  a stamped confirmation is worth no more than the automatic sentence it replaces.
  Leaving it untouched costs one sentence and blocks nothing.
- Panel membership keeps its question, because CAG 12.22 requires the narrative to name
  the fee-earner and the basis, but it no longer feeds any calculation. The guaranteed
  15% (12.20) is applied at bill-drafting and is not payable in addition to a general
  enhancement (12.23) — it is a floor, not an ingredient.

**Technical Changes:**
- `_cag-section-12-verbatim.md` added: a verified verbatim extraction of CAG Section 12,
  banked in the repo as **the citation source of truth**. Produced by gpt-5.6-sol and
  independently verified by re-extracting the PDF and string-matching twelve
  load-bearing quotes. Check every future citation against it.
- `content-data.js`: `NARRATIVE_TEMPLATES` and `QUESTION_BLOCKS` rewritten. Stage 1
  checkboxes gain `what_counts` and `stage2_factor`; Stage 2 gains `carried_from`,
  `stem`, `example` and `origin`. New constants `STAGE1_THRESHOLD_BANNER`,
  `WHAT_COUNTS_CAVEAT` and `LEGACY_LABEL_ALIASES`.
- `content-data.js`: `LEGACY_LABEL_ALIASES` maps all 28 pre-v1.11 label strings to their
  keys. **This is load-bearing.** `_narrator/extract.py` matches ticked criteria in a
  submitted PDF by label *text*, and since commit `2ba3adb` an unmatched label stops the
  run rather than being silently dropped. Without this map, every PDF generated before
  v1.11 — including any already sitting in a live client matter — would fail to extract.
  The retired keys deliberately remain in `NARRATIVE_TEMPLATES` so those PDFs render
  exactly as they did when produced.
- `_narrator/templates.py`: `_extract_balanced()` now skips `//` and `/* */` comments and
  recognises backticks. It previously read the apostrophe in prose like "the solicitor's
  own words" as an opening string delimiter, which made every following brace invisible
  and produced a bracket-counting error that gave no hint of the real cause.
- `content-data.js`: `APP_VERSION` 1.10 → 1.11, `APP_RELEASE_DATE` to 4 August 2026.
- The evidence confirmation spans four files, because a tick in a browser reaches the
  narrative only through the PDF: the control in `index.html`, `formData
  .evidenceOnFileConfirmed` and an `EVIDENCE ON FILE` section in `script.js`,
  `extract_evidence_confirmation()` in `_narrator/extract.py`, and the existing gate in
  `_narrator/skeleton.py`. The PDF prints the line in **both** states, because a line
  present only when confirmed would leave silence meaning two different things — the
  solicitor declined, or the PDF predates the question. The extractor reads only an
  exact `Evidence on file: Confirmed`, so a declined or damaged line reads as false: an
  absent sentence costs nothing, an unsupported one is a false statement to the LAA.
- `_narrator/extract.py` now also reads the `Court:` line into
  `caseDetails.courtLevel`. It has been printed since v1.11 but never read, so the
  ceiling that applies to a claim was visible only to a human reading the PDF. Nothing
  computes with it; it belongs in `narrative-input.json` beside the percentage claimed.
- **260 tests** pass (was 253). The new ones fix the reading of the confirmation in the
  direction that matters: "Not confirmed" contains the word "confirmed", so a looser
  search would read a refusal as a confirmation.

**Deliberately NOT changed — do not "fix" these:**
- The 2024 Costs Assessment Guidance and the Standard Civil Contract Specification are
  two different documents, not two versions of one: the CAG governs assessment, the
  Specification is the contract term permitting enhancement. Automated reviews have now
  flagged this as an inconsistency three times, and all three were wrong.
- The Specification year *was* changed, 2018 → 2024, but on separate and specific
  evidence: the CAG's own definitions section (PDF page 4) states '"the Specification"
  means the 2024 Standard Civil Contract Specification', and the string "2018" appears
  nowhere in the CAG. Decided by Simon on 4 August 2026.
- Novelty and weight are deliberately **not** Stage 1 threshold labels. CAG 12.4(c)'s
  operative threshold is "exceptional circumstances **or** complexity"; novelty and
  weight appear only in 12.8(c)'s heading before being developed as Stage 2
  considerations at 12.9(c). Confirmed with Simon on 4 August 2026 against the practical
  test: he has never seen a claim pass the threshold on documentary weight or novelty
  alone.
- "There is no published scale" must **not** be attributed to CAG 12.11. The word
  "scale" appears nowhere in Section 12. This was a thirteenth would-be misattribution,
  caught in the plan document before it shipped. What 12.11 does say is "Each claim must
  be considered on its own facts."

---

### Version 1.10 - April 29, 2026
**Status:** Latest version (NOT on GitHub)
**Key Changes:**
- Bug fix: Stage 2 selections are no longer silently cleared when the user edits Stage 1's explanation below the 10-word threshold. Previously, trimming a Stage 1 explanation (e.g. while refining wording) would silently wipe every Stage 2 tick — a subtle data-loss bug that punished careful editing.
- New behaviour: when the Stage 1 threshold isn't met, Stage 2 is *soft-disabled* (greyed out, not interactive) and a banner explains why. All ticks remain in place. As soon as Stage 1 is adequately explained again, Stage 2 selections resume counting toward the suggested percentage.
- The forward-navigation gate on the Stage 1 page (alert when threshold not met) is unchanged — users still cannot submit a claim without an adequate Stage 1 explanation. The fix only stops silent data loss while editing.

**Technical Changes:**
- `script.js:687-711`: rewrote `updateStage2Visibility()` to soft-disable rather than clear. Removed the `formData.stage2 = {}` reset and the loop that programmatically unchecked every Stage 2 box. Added class-based disable via `.s2-disabled` and a banner toggle.
- `index.html:147-150`: added `<div id="stage2DisabledBanner">` inside page 3, hidden by default. Bumped four hardcoded v1.9 strings to v1.10.
- `style.css:230-232`: added `.stage2-disabled-banner` and `.s2-disabled` rules. The disabled state uses `opacity: 0.5; pointer-events: none; user-select: none;` so users can see their preserved ticks but cannot interact until Stage 1 is fixed.
- `content-data.js`: APP_VERSION 1.9 → 1.10, APP_RELEASE_DATE updated.

---

### Version 1.9 - April 28, 2026
**Status:** Previous version (NOT on GitHub)
**Key Changes:**
- Recalibrated the on-screen "Suggested: X%" logic so it more honestly reflects realistic LAA enhancement claim norms.
- Per-factor weighting increased from 5% to 10% for the suggestion display. Same case ticking 2 factors will now show "Suggested: 20%" instead of "Suggested: 10%".
- Panel uplift (15%) and overall cap (50%) intentionally unchanged. The 50% cap matches the LAA's own Family/County Court ceiling cited in CAG 12.2.
- Motivation: under the old 5%-per-factor logic, modest solicitors tended to accept the suggested figure verbatim, anchoring claims low. The 10%-per-factor calibration makes the suggestion a more honest starting point.

**Technical Changes:**
- `script.js:254`: `generalFactorsUplift = generalFactorsCount * 10` (was `* 5`).
- `content-data.js`: `UPLIFT_PERCENTAGE_GUIDANCE_TEXT` updated to reference "10% per factor".
- `content-data.js`: `APP_VERSION` bumped 1.8 → 1.9, `APP_RELEASE_DATE` to 28 April 2026.
- Band examples in the guidance text (10–25 / 25–50 / 50%+) intentionally left intact — they remain consistent with the new weighting (1–2 factors maps to 10–25%, 3–5 factors to 25–50%).
- The PDF output is unaffected because it only contains the user's chosen final percentage, never the suggestion. The narrator subproject's 20 unit tests continue to pass.

---

### Version 1.8 - May 31, 2025
**Status:** Previous version (NOT on GitHub)
**Key Changes:**
- Added inline hyperlinks in the About section for easier access to Terms & Conditions
- Added inline hyperlink to HELP in the About section  
- Improved JavaScript event handling for these new inline links
- Refined wording in the About section for clarity
- Added explicit instruction to read T&Cs before first use

**Technical Changes:**
- Added `aboutTermsLinkInline` and `aboutHelpLinkInline` elements to index.html
- Added event listeners in script.js (lines 144-159) to connect inline links to existing modals
- index.html increased from 278 to 289 lines
- script.js remains at 1106 lines but with new functionality

---

### Version 1.7 - May 2025
**Status:** On GitHub (identical to v1.6)
**Key Changes:**
- No functional changes from v1.6
- Appears to be a duplicate/backup of v1.6

---

### Version 1.6 - May 28, 2025
**Status:** On GitHub (current GitHub version)
**Key Changes:**
- Added hypertext links in first paragraph block quote for T&Cs and HELP
- Improved help contents section
- Enhanced explanation of what the tool does
- Added message below password entry stating "An application where no data leaves your computer"

**GitHub Commits:**
- May 23, 2025: Initial commit and first upload
- May 27, 2025: Updated index and style.css for privacy message
- May 28, 2025: Added more explanation and further links to T&Cs and HELP
- June 2, 2025: HTML links in 1st paragraph block quote now have hypertext links

---

### Version 1.5 - May 2025
**Status:** Local only
**Key Changes:**
- Intermediate development version
- Testing and refinement phase

---

### Version 1.3 - May 2025
**Status:** Local only
**Key Changes:**
- Minor improvements and bug fixes
- UI refinements

---

### Version 1.2 - May 2025
**Status:** Local only
**Key Changes:**
- Early development improvements
- Added core functionality enhancements

---

### Version 1.0 - May 23, 2025
**Status:** Local only (original version)
**Key Features:**
- Initial release with core functionality
- Password-protected access (accepts "West Pier" and "Goodlaw")
- Multi-page form for collecting uplift justification data
- PDF generation capability
- Client-side processing (no data sent to servers)
- Based on LAA Costs Assessment Guidance (Version 1a, 23 September 2024)

---

## Core Features (All Versions)

### Security & Privacy
- Password protected access
- All processing occurs client-side
- No data transmitted to external servers
- GDPR compliant

### Functionality
- Multi-step form guiding solicitors through LAA uplift requirements
- Automatic calculation of suggested uplift percentages
- Panel membership recognition (15% minimum for accredited panels)
- Stage 1: Threshold test for exceptional circumstances
- Stage 2: Justification for specific percentage claimed
- PDF generation with formal narrative for LAA submission

### Supported Panels
- Resolution Accredited Specialist Panel
- Law Society Children Panel
- Law Society Family Law Panel Advanced

### Technical Stack
- HTML5/CSS3/JavaScript (vanilla)
- jsPDF for PDF generation
- Marked.js for Markdown rendering
- No server-side components required

---

## Version Numbering Convention
- 1.x - Major feature additions or significant changes
- x.x - Minor improvements, bug fixes, or UI enhancements

---

## GitHub Repository
**URL:** https://github.com/thescoop/upliftCollator
**Current Version on GitHub:** v1.6/v1.7 (identical versions)
**Recommended Action:** Update to v1.8 for improved user experience

---

## Document Information
**Created:** August 19, 2025
**Last Updated:** August 19, 2025
**Maintained by:** Woodruff Billing Ltd

---

## Notes for Future Updates
- Always test thoroughly before deploying
- Maintain backward compatibility with existing PDF outputs
- Ensure continued compliance with LAA guidance updates
- Keep client-side processing architecture for GDPR compliance
- Consider adding version number display in the application UI