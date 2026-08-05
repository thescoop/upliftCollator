# Agreed programme — settled 4 August 2026

## BUILD STATUS — updated 5 August 2026, end of session

Work is on branch **`redesign/stage1-labels`**. **Nothing is on `main`, so nothing is
live.** Only a merge to `main` publishes to solicitors.

### Done and committed

| Commit | What |
|---|---|
| `bc57575` | Last open question closed: novelty and weight stay out of Stage 1 |
| `e1a5557` | Stage 1 → 13 tick-only labels; Stage 2 → 7 CAG 12.9 factor blocks; all citation and benchmark fixes; invented bands deleted; `APP_VERSION` 1.11 |
| `603dfbb` | Legacy label aliases wired; `_narrator/` green at 251 tests |
| `44a6c94` | Sol's review applied — the narrowing qualifiers we had invented, removed; 253 tests |

- **`_cag-section-12-verbatim.md` is now the citation source of truth.** Check every
  citation against it before writing one. It is verified: extracted by gpt-5.6-sol and
  independently re-checked by string-matching twelve load-bearing quotes against a
  second extraction of the PDF.
- **`_narrator/` is finished for this phase: 253 tests pass.** The legacy-label
  regression is proven by deliberate breakage — disabling the alias wiring puts all 28
  historical labels into `unrecognised`, as it must.
- Stage 1 is **13** labels, not 12: the tactic/better-result label was split because a
  single disjunctive checkbox was generating a narrative asserting both halves.

### Front end — done in `fc0fe15`

Suggested percentage removed from the UI; court question added with the 50%/100%
ceiling stated as prose; Stage 1 tick-only with the "what counts?" panels; Stage 2
carry-forward with stems and persistent examples; `localStorage` drafts; accessibility
(0 unlabelled inputs, all toggles keyboard-operable). Driven through all five steps in
Chromium, with a generated PDF round-tripped back through `extract.py` and every label
matching.

**Not verified:** appearance in Acrobat, any browser other than Chromium, behaviour with
`localStorage` disabled.

### Done since, 4 August 2026 — and what it turned up

**1. The evidence-on-file confirmation is built and verified end to end.** A tick on
page 5 sets `evidenceOnFileConfirmed`; the PDF carries an `EVIDENCE ON FILE` section;
`_narrator/extract.py` reads it back; the narrator's existing gate does the rest.
Driven in Chromium and round-tripped through `extract.py` and `build_skeleton` in both
states. Decisions banked:

- **The tick is optional** — Simon's call. It never touches the download button. A box
  that must be ticked to proceed is a rubber stamp, worth no more than the automatic
  sentence it replaced.
- **The PDF prints the line in both states.** A line that appeared only when confirmed
  would make silence mean two things: declined, or produced before the question existed.
- **The confirmation is read as two statements that must agree** — the status line and
  the sentence beneath it. Either one alone is a single word away from reversing its
  meaning. A declined, damaged or disagreeing pair reads as false, and unlike a
  criterion label it does *not* stop the run: a missing sentence costs nothing, a false
  one is an unsupported assertion to the LAA.

**2. The CDN libraries are vendored** into `vendor/`, with provenance and update
instructions in `vendor/_PROVENANCE.md`. `jspdf-autotable` was deleted rather than
vendored — it had loaded on every page view since the tool was written and is never
called. `marked` was unpinned (`npm/marked`) and is now fixed at the 15.0.12 that was
live. Verified by driving the whole form with every http(s) request aborted.

**3. Two silent truncation bugs, found by testing the round trip rather than the
code — both pre-existing, both now fixed.** These are the ones worth remembering:

- **A Stage 1 label too long for one PDF line stopped the narrator entirely.** jsPDF
  wraps at the column width and marks the continuation in no way at all, so the
  vulnerable-client label arrived as two lines, matched nothing, and — since `2ba3adb`
  — halted the run. Every case ticking that one factor was affected. Found by ticking
  all thirteen labels and extracting: twelve came back.
- **A long Case / Matter name was truncated to its first line**, putting a shortened
  case identity into the narrative through `{ITEM_OF_WORK}`. Nothing limits that
  field's length in the form.

Both are the same lesson: **the PDF is a text layer with a line width, and anything
that wraps needs rejoining.** If a future change adds a long string to the PDF, test
it at length, not just for correctness.

**And more, from four further Sol passes over the fixes themselves** — each one an
edge the round before it did not reach:

- A wrapped matter name whose second line opens `Court:` is indistinguishable from
  the real Court field. Case details are now read as the **longest run of candidate
  lines whose fields appear in the order the PDF prints them** — the only property
  of this text that is reliable. **The format stays ambiguous in principle**: a
  value wrapping onto a line beginning with the label of the very next field is
  still read as that field.
- A solicitor pasting boilerplate containing a whole confirmation block into an
  explanation could have outranked their own refusal. The **last heading** now
  marks the real section — found first, read second, so a genuine section whose
  status line is damaged answers "no" instead of deferring to an intact copy
  higher up the document. Its *last* occurrence is also what ends the section
  above it, or a pasted block still truncated Stage 2 where it appeared.
- **Exact label matching is not the same as safety.** Damage can turn one real label
  into a *different* real label: drop the parenthetical from the legacy Stage 1
  "Difficulty in taking instructions (client/witnesses)" and what remains is the
  current Stage 2 label word for word. Accepted, it would have filed a threshold
  factor as a level factor and reported a clean run. The key must now belong to the
  section it was read from — **in the `--from-json` recovery path too**, which
  initially bypassed the check, so the file the stop had just written could be
  re-run unedited and accepted, **and under `PANEL MEMBERSHIP`**, which had no
  guard at all. That last one was the worst of the whole session: panel membership
  carries a *guaranteed* 15% (CAG 12.20), so a criterion label read there produced
  "A minimum enhancement of 15% is claimed … as a member of the Unusually detailed
  knowledge applied" — a guaranteed entitlement asserted to the LAA on the strength
  of a factor ticked somewhere else. A damaged Stage 1 heading is enough to cause it.

**Five review rounds, and every round found defects in the round before it.** Four
of the five found something in the *previous fixes* rather than the original code,
including one fix that introduced the very regression it was written to remove. The
practice that caught them: send the fixes back, not just the original change, and
verify each test by reverting its fix to confirm the test actually fails.

**4. `extract.py` now reads the `Court:` line** into `caseDetails.courtLevel`,
anchored to line start so a matter named "High Court: Re X and Y" cannot answer the
court question.

**281 tests pass.** Verified against eleven generated PDFs, seven of them with the
page breaks walked across the new section, and every fix checked by reverting it to
confirm a test fails.

### Panel membership — settled 5 August 2026

Sol's finding 6 was researched to primary sources and applied. Both extra conditions
are gone, and the answer was not "no source" but "the source says the opposite".

**The paragraph that decided it was missing from our own citation file.**
`_cag-section-12-verbatim.md` ran 12.20 straight to 12.22. CAG **12.21** says:

> Where the fee-earner is a member of the accredited specialist panel of Resolution,
> the Law Society Children Panel or the Law Society Panel Advanced, the enhancement
> is applied to **all work done in any family case**.

Verified from the guidance PDF in this repo, not from a search result. It is now in
the verbatim file with a note. **Treat a gap in that file as a defect**: the tool
asserted a restriction the guidance contradicts, for want of a paragraph nobody had
extracted because nobody had needed it yet.

- **"the work undertaken falls within the scope of this accreditation"** — no source.
  Absent from the 2024 General Specification (6.12–6.17), the 2024 Family Category
  Specific Rules (7.20–7.24), their 2018 equivalents, and the Remuneration
  Regulations 2013. Removed from both narrative templates.
- **"(and work relates to children)"** — a *real* term, but of the **2013** Family
  Specification (para 7.24(b), limiting the Children Panel to work "under a
  Certificate which includes proceedings relating to children"). Dropped in the 2018
  rules; the operative 2024 rules name the scheme bare (7.24(c)). The tool was
  enforcing a contract term that expired eight years ago. Removed from the label,
  and the old string added to `LEGACY_LABEL_ALIASES` — it is printed into every PDF
  produced before this date and is the only thing keeping those matters extractable.

**The operative contract is the 2024 Standard Civil Contract** (General Specification
May 2025, Family Rules August 2024), extended to 30 June 2028. `content-data.js`
already cites 2024; no change needed. The 2018 contract governs legacy matters only.

**Specification 7.23(a) — recorded, deliberately not relied on.** The same paragraph
that sets the 15% floor also provides that where the work is done by a panel member
"**the threshold test at Paragraph 6.13 shall be deemed to be satisfied** in respect
of that work". CAG Section 12 never mentions this; it exists only in the contract.
Read strictly, a panel member cannot fail Stage 1, and `script.js` was stopping them
there with "the threshold test (CAG 12.4) is not met... there is nothing further to
do in this tool."

**Simon's call: the tool still requires at least one Stage 1 tick.** His reasoning —
anyone with substantial Stage 2 material will have a Stage 1 hook, and panel
membership already guarantees 15% before the form is opened, so this tool is only
ever about beating 15%. The counter-argument, kept because an assessor could make it:
**Responsibility and Weight are Stage 2 orphans**, so a panel member who ran a heavy
case without counsel may genuinely have nothing to tick at Stage 1 while having a
strong claim above 15%.

What changed instead is the message. It no longer states the threshold "is not met"
(which 7.23(a) contradicts), no longer implies the solicitor is finished, and now
points at the two orphans by name. **It also said "the twelve" — Stage 1 has been
thirteen labels since the tactic/better-result split.** The count is now derived from
`QUESTION_BLOCKS` so it cannot go stale again.

If 7.23(a) is ever relied on, the work is: a `isThresholdSatisfied()` alongside
`isAnyStage1ThresholdTrulyMet()` — **do not overload the existing one**, the PDF's
`No Stage 1 threshold factors selected.` sentinel and the narrator both depend on it
meaning exactly "a Stage 1 label is ticked". The narrator needs no structural change:
`skeleton.py` already appends Stage 1 and Stage 2 independently and
`extraction_is_empty` already passes on Stage 2 alone.

**Verified:** 287 tests; each of the three fixes confirmed by reverting it and
watching tests fail (removing the alias fails 8, including the fixture-PDF test).
Driven end to end in Chromium with all three panels ticked, a 46-character
fee-earner name and an 85-character case name — both of which wrapped in the PDF —
then round-tripped through `extract.py` with every field and label recovered and
nothing unrecognised.

### Still outstanding

1. The merged editable narrative page, and `.docx` output. Untouched.
2. Terms clause 2 says data "is processed locally within the User's web browser" —
   true, and not contradicted by `localStorage`, but it does not mention that drafts now
   persist between sessions on a possibly shared machine. The on-page privacy note
   covers it; the Terms would be better with one sentence added.
3. Judgement call made, reversible in one line: a **ticked** item in the optional
   Responsibility section still requires its explanation. Only an untouched section is
   exempt. Change it if you would rather ticks there stood alone.
4. **The older section headers are still matched as the first bare occurrence
   anywhere in the document**, so a solicitor who pastes a working note containing a
   line reading `DISCLAIMER` or `PROPOSED UPLIFT` into an explanation truncates the
   section they are in, silently. `EVIDENCE ON FILE` is now the only one that is
   safe — it requires its own status line *and* is taken at its last occurrence.
   The others were deliberately left alone: tightening them changes how PDFs already
   sitting in live matters are read, which is not a change to make in passing. Worth
   doing properly one day, with the legacy fixtures in front of you. **Do not
   describe the others as handled** — an earlier version of this file called the
   evidence pattern "immune" while a pasted block still truncated Stage 2.

### Two things to decide next session

- **Sol argued novelty and weight should return to Stage 1** and was told not to, since
  Simon settled it. Its argument: CAG 12.8(c)'s heading, expressly introduced as
  threshold guidance, names "exceptional circumstances, novelty, weight or complexity".
  The counter, which stands: 12.4(c) is the operative threshold and says "circumstances
  **or** complexity", and 12.8's headings are demonstrably loose — the same paragraph
  cites "the three limbs of 6.15" where 12.4 puts the threshold at 6.13. Recorded
  because it is the argument an assessor could make back.
- ~~**Sol's finding 6 was never applied.**~~ **CLOSED 5 August 2026 — both conditions
  removed.** See "Panel membership" below.

### Known, deliberate, do not "fix"

- Retired legacy templates still contain the old narrowing language ("exceptional
  economy", "significant evidential issues"). They are not offered to new users; they
  exist so pre-v1.11 PDFs render as they did when produced. Changing them would
  rewrite history.
- `MAIN_HELP_TEXT_MARKDOWN` repeats its opening paragraph. Cosmetic, noticed late.

---

Entry point for the next session. **Direction is fully settled; nothing is blocked.**
This supersedes the earlier version of this file, which described a percentage
range and an embedded XML payload — both of those were dropped, deliberately, and
the reasoning is below.

**This is a deliberate decision to change the tool solicitors use.** The standing
rule has been "narrator work never touches the Collator"; it is set aside on
purpose for this programme.

## The last open question — CLOSED, 4 August 2026

**Should novelty and weight be Stage 1 threshold labels? No.** Simon confirmed he has
never seen a claim pass the threshold on documentary weight or novelty alone, which
was the practical test. Both this session and gpt-5.6-sol had independently reached
the same answer from the guidance: 12.4(c)'s operative threshold is "exceptional
circumstances **or complexity**", and novelty and weight appear only in 12.8(c)'s
heading before being developed as Stage 2 considerations at 12.9(c).

**Consequences, now fixed:** the labels below are the complete Stage 1 set — twelve as
drafted here, **thirteen as built**, the tactic/better-result label having since been
split because one disjunctive checkbox generated a narrative asserting both halves. And
the Stage 2 orphan set is `{Responsibility, Weight}` — both must be collected
separately at Stage 2 because nothing carries them forward.

Nothing is now open. Build it.

---

## How publishing works — read before touching anything

GitHub Pages, re-verified 4 August 2026 by `gh api repos/thescoop/upliftCollator/pages`:

```
build_type: legacy
source:     { branch: "main", path: "/" }
```

There is also **no `.github/workflows/`**, so nothing can auto-deploy.

**Only `main` is live.** Every push to `main` republishes the repo root instantly,
with no build step and no approval. `woodruffbilling.co.uk` (Weebly) links out to
`https://thescoop.github.io/upliftCollator/`, so that *is* production.

Therefore:

- **Work on a branch**, and **push the branch freely** — pushing a branch publishes
  nothing. Do push it: it is off-machine backup and it lets the other machine and
  Codex see the work.
- **Preview locally** by opening `index.html` in a browser. The app is pure
  client-side, so a local file is a complete working preview.
- **Merging to `main` is the go-live moment.** Nothing before that is visible to
  solicitors.
- Rollback is `git revert` plus a push — about thirty seconds.

`vercel.json` and `_vercel-should-build.sh` are inert here; they are for a future
Vercel move.

## Gate — resolve before merging to main

**There are two live Collators and they have already diverged.** GitHub Pages has
v1.10; the Solicitor Portal at `wb-website-gilt.vercel.app` has a v1.8 copy *ported
into its bundle*, still carrying the silent Stage 2 data-loss bug fixed in v1.10.
Nobody uses the portal yet, so it is currently harmless — but it is the copy that
goes live when that site launches, and every change made now widens the gap. Fix by
making the portal link to the canonical copy rather than embedding it.

---

## The finding that reframed this programme

`content-data.js:325–327` presented a three-band percentage ladder — 10-25% /
25-50% / 50-75%+ — introduced as "Consider these bands as a general guide", placed
under a heading reading "LAA's Holistic View & Caps" and directly beneath a
correctly-cited verbatim quote from CAG 12.10.

**Those bands appear nowhere in the Costs Assessment Guidance.** Section 12's only
figures are the 50%/100% caps (12.2) and the 15% panel minimum (12.20). Worse, the
invented ladder *contradicts* the paragraph it sits under: 12.10 says "A maximum
enhancement could be payable on the basis of one factor alone where it is
particularly strong", while the ladder would hold that same solicitor to 10-25%.

Verified by reading Section 12 directly (pages 50–55 of the guidance PDF in this
repo), then independently by gpt-5.6-sol, which confirmed it and **found eleven
further misattributions — every one biased toward under-claiming**, including:

- **The comparison benchmark is wrong.** The tool says compare with "a fee earner of
  this level" and "a case of this type". CAG 12.8 says the comparison is with "the
  generality of legally aided proceedings to which the prescribed rates apply", and
  12.11 expressly rejects comparing solely with the same category or type of
  proceedings. Measured against other family cases the work looks ordinary;
  measured as the guidance directs, it looks hard.
- **"Harder than average" understates the threshold.** 12.8: "'Exceptional' has its
  normal meaning of 'unusual' or 'out of the ordinary', hence more than simply above
  the average."
- **"50% is often the practical cap unless truly extraordinary"** — below the High
  Court it is a hard cap (12.2), not a soft one with an exception.
- **Seven bad citations**: six references to `12.8.1 / 12.8.2 / 12.8.3`, which do not
  exist (they are `12.8(a)/(b)/(c)`), and a quote cited to "CAG 6.17", which does not
  exist either — the words are in CAG 12.8, quoting Specification 6.17.

**So this was never a calculator bug.** The arithmetic was one symptom of a text
that is systematically more pessimistic than the guidance it summarises. All of the
above is in scope.

---

## Workstream 1 — the suggested percentage

### Settled: the tool suggests nothing

No computed percentage, no range, no auto-fill. The solicitor types the figure they
are prepared to justify.

Simon was asked to settle what a replacement range should say and could not — which
was the right instinct. The April 2026 failure (suggested 10% on a 30% case) and the
August 2026 failure (five Stage 1 ticks hit the cap, Stage 2 became pointless) are
**the same failure**: the number authored the answer. A better-calibrated number is
still a number. Under-claiming is silent and permanent; over-claiming is visible and
gets argued. A tool that names a figure under-anchors invisibly, forever.

### What replaces it

Delete the invented bands and state only what the guidance actually says:

- The ceiling is **50%**, or **100%** in the High Court, Upper Tribunal, Court of
  Appeal or Supreme Court (12.2). **Ask which court** — the tool currently never
  does, so it silently halves the ceiling for anyone above the County Court.
- Panel members already have a guaranteed **15%** floor (12.20), applied
  automatically at bill-drafting and **not payable in addition** to the general
  enhancement (12.23). Useful framing: *"you already have 15% — this tool is about
  whether the case justifies more."*
- **"A maximum enhancement could be payable on the basis of one factor alone where
  it is particularly strong"** (12.10, verbatim). This is the sentence that does the
  work the invented bands were presumably meant to do, and it is real.
- There is no published scale; each claim is considered on its own facts (12.11).

Keep the panel question — CAG 12.22 requires the narrative to name the fee-earner
and the basis — but it stops feeding any calculation.

### Also in this workstream

- **Correct the Counsel framing.** Per CAG 12.16, instructing Counsel makes a
  responsibility claim *harder, not impossible*, and the fourth item (addressed
  expert/evidential issues) is not gated on Counsel at all. The form reads as binary.

## Workstream 2 — the form redesign

### Stage 1 becomes tickable labels, no typing

About ten multiple-choice labels. Stage 1 is a pass/fail threshold (CAG 12.4) and
earns nothing, so it should not consume the solicitor's effort — yet the form
currently demands 10+ words on all 17 boxes and then presents 11 more to someone who
has nothing left. That is the cause of the six-Stage-1-versus-two-Stage-2
submission, and it is structural rather than personal.

Fully generic wording is safe **because** of the carry-forward below: no ticked point
is ever left unevidenced, so the document as a whole is never boilerplate. Stage 1's
contribution to the narrative should be deliberately brief — it is the claim; Stage 2
is the evidence. CAG 12.7 expects exactly that overlap.

### The Stage 1 labels — DRAFT, 4 August 2026

Reconciled from two independent drafts (this session's, and gpt-5.6-sol working
blind from the guidance with no sight of this file). They converged on ten of
twelve, which is good corroboration that CAG 12.8 is the right raw material.

**Fixed warning above the list** — holds the 12.8 threshold and encodes 12.11's
rejection of category-based reasoning:

> Tick only where this was unusual or out of the ordinary — not merely above
> average — compared with legally aided work generally. No category of case is
> exceptional in itself.

Sol's draft ended "The fact that this is a family case does not itself justify an
enhancement." Simon cut it, correctly — the tool is family-only, so it states the
obvious. The 12.11 guard is kept in the shorter form above, because the error it
prevents (reasoning that a *type* of case is inherently exceptional) is **more**
likely in a family-only tool, not less.

**Limb (a) — exceptional competence, skill or expertise**

1. Applied unusually detailed knowledge of the law or procedure relevant to this case
2. Pursued an unusual or difficult legal argument
3. Identified and marshalled evidence with unusual skill
4. Adopted a particularly effective tactic, or conducted the case so well that the
   client obtained a better result than would usually be expected
5. Completed the work in materially less time than a reasonable fee earner would
   ordinarily have required
6. Took instructions from and effectively represented a child, a seriously mentally
   unwell client, or another very vulnerable client, requiring unusual skill

**Limb (b) — exceptional speed**

7. Proactively obtained a resolution of the client's problem with unusual speed
8. Carried out substantial work at short notice to meet an urgent deadline or hearing

**Limb (c) — exceptional circumstances or complexity**

9. The legal, expert or other evidential issues were exceptionally complex
10. Taking instructions from the client or other witnesses was exceptionally difficult
11. The issues affecting the client — such as liberty, the family home, domestic
    abuse or destitution — gave rise to exceptional circumstances
12. The case required substantial out-of-hours work in exceptional circumstances

**Novelty and weight are deliberately absent** — pending Simon's confirmation. The
operative threshold at 12.4(c) is "exceptional circumstances **or complexity**";
novelty and weight appear only in 12.8(c)'s *heading* and are developed as Stage 2
considerations at 12.9(c). 12.8's headings are demonstrably loose (it also cites
"the three limbs of 6.15" where 12.4 says the threshold is 6.13), so 12.4 governs.
Cost is low: Stage 1 needs only one limb, and weight still drives the percentage at
Stage 2. **Consequence: the Stage 2 orphan set is `{Responsibility, Weight}`, not
just Responsibility.**

Wording is verb-first past tense so the labels drop into the narrative in house
style. Each carries its own threshold word; the banner does the rest.

### Help beside each label — "what counts?"

Agreed 4 August 2026. Each label gets a small **"what counts?"** toggle that expands
two or three lines **in place**, collapsed by default.

- **Content is CAG 12.8's own examples, quoted and cited — never ours.** 12.8 is the
  LAA's own list of what each limb looks like, and every label above derives from it.
  Invented examples read as an exhaustive list however they are captioned, so a
  solicitor whose situation is not listed concludes they do not qualify — the exact
  narrowing bias this programme exists to remove. Close each with 12.7 in the LAA's
  words: "in neither case can an exhaustive list of features of a case be identified".
- **Not inside the label.** Label text becomes narrative text and forms the
  extraction contract, so it stays short and stable. Help text is neither.
- **Not a modal.** The tool's existing `CONTEXTUAL_HELP_TEXTS` pattern covers the
  list and loses the solicitor's place — twelve times over. Expand in place instead.
- **Collapsed by default, but the trigger always visible.** All twelve expanded is a
  wall of text, which recreates the fatigue the redesign exists to fix; all twelve
  hidden behind a modal is help nobody reads.
- **Write each string once and use it in both stages.** The example that justified
  ticking at Stage 1 is the context needed to write the consequence at Stage 2.

At Stage 2, "typical answers" genuinely apply — and that content already exists.
The `placeholder_example` strings in `content-data.js` are well-written model
sentences sitting in the one container that destroys itself on the first keystroke.
Rescue them and show them persistently beside the sentence stems.

### Stage 2 carries Stage 1 forward, as guided prose

The ticked Stage 1 items reappear pre-selected, each with **sentence stems** rather
than a blank box — "The urgency arose because…", "As a result…" — so the solicitor
supplies cause and consequence and the output is already narrative. A stem is a
completion task, not a writing task.

**Some Stage 2 factors have no Stage 1 origin and must be added separately.**
Omitting them would automate the exact bug this programme exists to fix — the real
submission left the entire Responsibility block empty.

Of the seven factors in CAG 12.9, against the Stage 1 labels above:

| Stage 2 factor | Carried forward from |
|---|---|
| Care — 12.9(b)(i) | labels 3, 6 |
| Speed — 12.9(b)(ii) | labels 7, 8 |
| Efficiency — 12.9(b)(iii) | label 5 |
| Complexity — 12.9(c)(iii) | label 9 |
| Novelty — 12.9(c)(i) | label 2 (partially) |
| **Weight — 12.9(c)(ii)** | **nothing — orphan** |
| **Degree of Responsibility — 12.9(a)** | **nothing — orphan** |

Efficiency was previously recorded here as an orphan; that was wrong. CAG 12.8(a)
includes work "carried out… in a way that has required less time than would have
been expected of a notional reasonable fee-earner", which is the threshold-stage
twin of 12.9(b)(iii) — hence label 5, and hence efficiency carries forward normally.
Weight becomes an orphan only if novelty/weight stay out of Stage 1 (open question
above).

### Degree of Responsibility — the closing paragraph

**It is not "how much did this weigh on me".** CAG 12.9(a) defines it narrowly: "the
extent to which the provider has carried out work without recourse to counsel,
whether in relation to analysis and planning of the case, drafting or advocacy",
plus addressing evidential issues that would otherwise have taken an expert's time.

That is a different factor from **Care** (12.9(b)(i), "the skill with which the
fee-earner has carried out work"). They are orthogonal: enormous care with low
responsibility (counsel led, you prepared meticulously for them), or high
responsibility with unremarkable care (you did it all yourself because no counsel was
available). **Do not prompt with "did anything need extra care?"** — that collects
care answers filed under responsibility, so the same facts appear twice in the
narrative and read as padding, or as double-counting one fact to inflate the claim.

**It does make the right closing paragraph**, but because it is the only factor
describing the *shape of the whole retainer* rather than a specific event — across
the case, how much did you carry? CAG 12.16 uses the same framing: whether counsel
"does take an unusual share of the load on a case". That is inherently a summation.

**It must be able to be absent.** Where counsel was instructed throughout, there is
little to claim — 12.16 says that makes the claim "more difficult for the provider
to justify" — and a forced closing paragraph would be thin, defensive, and would
draw attention to the weakest part of the claim. Ending on your weakest point is bad
advocacy. Absent it, the existing conclusion template closes the narrative.

**The expert limb is not gated on counsel.** "The fee-earner has identified or
addressed evidential issues that might otherwise have incurred the time of an expert"
stands alone, so even where counsel ran the advocacy there may be real responsibility
to claim. The form must surface that separately instead of asking one binary counsel
question and closing the section when the answer is "yes".

Keep the four existing Responsibility prompts as ticks that jog the memory and feed
one consolidated paragraph; a bare box headed "responsibility" will get a vague
answer.

### One narrative page, editable, then download

The review page and the PDF are currently two independent renderings of the same
data, so they can disagree — the solicitor approves one document and sends another.
Merge them: one narrative on screen, editable, with save and download.

Watch the **edit trap**: if the solicitor polishes the prose and then goes back to
change an underlying answer, regeneration wipes what they typed. Keep regeneration
granular, per section, warning only where their edits would actually be lost.

### Output: a plain .docx, no embedded XML payload

The payload idea was dropped, deliberately. It was the right answer to the *old*
design, where the document was machine-generated end to end and any divergence
between visible text and stored data meant corruption. Under the new design the
prose is the solicitor's own and they will edit it in Word — so a consistency check
would fire on exactly the behaviour we want to encourage, and a guard that cries wolf
gets switched off.

Two further reasons: Word's Document Inspector can strip custom XML anyway, so a
reliable text-reading path had to exist regardless; and fixed Stage 1 label strings
are trivially matchable, unlike the free prose that forced `extract.py` into
coordinate-derived reconstruction.

**Condition to bank:** the label strings and heading structure become the extraction
contract, so they must be stable and distinctive.

### Also in scope

- **Save/resume (`localStorage`).** There is none today — no draft saving, no
  `beforeunload` guard. The solicitor is about to be writing substantial original
  prose in a browser tab, so a closed tab destroys real work.
- **Vendor the CDN libraries** into the repo. A firm's network blocking a CDN
  silently breaks the download button with no explanation.
- **Accessibility.** Zero `aria-` attributes, and the explanation textareas have no
  `<label>` — only a placeholder. Those placeholders also hold the worked examples,
  which are the most useful content in the form and vanish on the first keystroke.

## The Collator / Narrator split stays

Decided after establishing that Simon uses narrator output as-is rather than
rewriting it:

- **Collator** — the narrative in the solicitor's own words.
- **Narrator** — the costs-draftsman layer: CAG paragraph signposting, house style,
  bill-format assembly.

**The narrator may re-present, cite and format. It may not add claims.** An
automated layer that "bolsters the significance" of a claim puts assertions the
solicitor never made into a document going to the LAA under their name — the same
failure as the invented bands. This rule is testable: every factual assertion in the
output should trace to solicitor input.

Keeping the split also keeps the citation mapping in tested code (244 tests) rather
than moving it into `script.js`, which has no tests at all. That mapping is
deterministic — responsibility to 12.9(a), care to 12.9(b)(i), speed to 12.9(b)(ii),
efficiency to 12.9(b)(iii), novelty/weight/complexity to 12.9(c)(i)–(iii), the
threshold limbs to 12.8(a)–(c) — and a single tested table permanently kills the
class of miscitation Sol found.

The narrator's Stage 1 templates need rework, since Stage 1 answers change from free
text to selected labels.

### Non-negotiable

**`extract.py` stays.** Every PDF already sitting in a live matter must keep working.
The DOCX path is added alongside, never swapped in.

---

## Release shape

Simon's call, 4 August 2026: **one release, not two.** A smaller correctness-only
patch (bands, citations, benchmark, auto-fill) was offered and declined — those fixes
ship *with* the redesign rather than ahead of it. They must not be dropped.

`APP_VERSION` is 1.10 and bumps with this work. Log the change in
`VERSION_HISTORY.md` with the reasoning — particularly the misattribution finding, so
a future auditor can see why the text moved — and note it in `_narrator/HANDOFF.md`.

## Do not "fix" this

`content-data.js:9` cites the **2024 Costs Assessment Guidance** and `:37` cites the
**2018 Standard Civil Contract Specification**. These are two different documents,
not two versions of one — the CAG governs assessment, the Specification is the
contract term permitting enhancement. Both are correct and current for their purpose.
**Two separate automated reviews have now flagged this as an inconsistency; both were
wrong.**

## Still outstanding elsewhere

Nothing in `_narrator/` is outstanding. 244 tests pass under WSL and Windows Python;
the Word output was confirmed in Word on 4 August 2026 with Arial Nova Cond Light
resolving correctly.
