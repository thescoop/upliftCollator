# 2024 Standard Civil Contract Specification — verbatim paragraphs

Covers two Specification documents: **Category Specific Rules: Family, Paragraphs
7.20–7.24** (first section, extracted 6 August 2026) and the **General Rules,
Paragraphs 6.12–6.17** (second section, extracted 7 August 2026). The filename
predates the second section and is kept because the repository refers to it.

**This file is the citation source of truth for everything the Uplift Collator says
about panel membership, the deemed threshold test, the guaranteed 15% minimum, the
threshold test itself (6.13) and the level-of-enhancement factors (6.15).**
It is the Specification twin of `_cag-section-12-verbatim.md`, which covers the Costs
Assessment Guidance. Between them they are the only established wording; anything else
is drafting.

**Before adding or changing any citation, quotation or paraphrase of the Specification
anywhere in this repository, check it against this file.** If the wording you want is
not here, it is not established — go back to the source PDF and extend this file rather
than writing from memory. **Treat a gap in this file as a defect, not a shortcut**, in
the same terms as the CAG file: the paragraphs here are the ones that were needed at
the time, and the next question will be about one that was not.

This file exists because the tool was about to rest an entire claim route on Paragraph
7.23(a) — quoting its words in documents sent to the LAA over a solicitor's signature —
with no verified source for them anywhere in the repository. That is the same condition
that produced the twelve fabricated citations found on 4 August 2026, and separately the
2013 panel condition enforced until 5 August 2026 that had been dropped in 2018. Two
different failures, one cause: a legal proposition in the code with no extracted text
behind it.

## Provenance

Extracted twice, independently, on 6 August 2026:

1. `gpt-5.6-sol` fetched the PDF, transcribed 7.20–7.24, then re-fetched and
   string-matched its own transcription.
2. The Claude session downloaded the PDF separately and extracted the same paragraphs
   with `pypdf`, then compared them against that transcription word by word.

The two agree exactly on all five paragraphs, including `means:-` and the spaced
`Family Law - Advanced Accreditation Scheme`. Both oddities are in the source and must
not be "corrected" on reuse. No stray intra-word spacing (the `fee -earner` artefact
seen in the CAG PDF) occurs anywhere in 7.20–7.24.

The document, titled on its cover:

> 2024 Standard Civil Contract
> Specification
> Category Specific Rules:
> Family

Cover date **August 2024**. Paragraphs 7.20–7.24 are all on **PDF page 8 of 45**, under
the headings `Enhancement of Family Prescribed Rates` (7.20–7.22) and `Panel membership
enhancement in Family cases` (7.23–7.24).

- Source PDF: https://assets.publishing.service.gov.uk/media/66a9fef2ce1fd0da7b593038/3_7_2024_Family_Category_Specific_Rules.pdf
- Linked from the LAA collection page: https://www.gov.uk/government/publications/standard-civil-contract-2024
- Commencement of the 2024 contract, 1 September 2024: https://www.gov.uk/government/news/the-2024-standard-civil-contract-now-live
- Contract Extension Notice, 3 December 2025, extending to 23:59:59 on 30 June 2028: https://assets.publishing.service.gov.uk/media/6937f1df7a605b2d61cd8f39/Contract_Extension_Letter_June_2028.pdf

> [note: GOV.UK serves this PDF under at least two asset paths — media IDs
> `66a9fef2ce1fd0da7b593038` and `6a1d79abc7335e2ca6daadb0`. Both were downloaded on
> 6 August 2026 and are byte-identical (MD5 `77fdce84afdd0afe4c0e4b35d9e6ece8`). Two
> different Codex runs cited one path each, which looked like a contradiction and was
> not. If a future check finds the two diverging, the collection page above is
> authoritative.]

> [note: PDF line wrapping, blank layout lines and the running `August 2024` page
> footer have been removed. Wording, spelling, capitalisation and punctuation have not
> been changed.]

## The paragraphs

### 7.20

> The rules on enhancement of Hourly Rates in Paragraphs 6.12 to 6.17 apply to Family Contract Work subject to Paragraphs 7.23 to 7.24.

### 7.21

> No enhancement or potential for enhancement of Hourly Rates may be taken into account for the purpose of determining whether a case escapes from any Standard Fee or whether a half or full Standard Fee is payable on transfer of Provider (see Paragraphs 7.44).

### 7.22

> The percentage by which Hourly Rates for Family Work may be enhanced may never exceed 100% in the High Court, Court of Appeal and Supreme Court and 50% in all other courts.

### 7.23

> Where the work is done by a member of a relevant panel:
>
> (a) the threshold test at Paragraph 6.13 shall be deemed to be satisfied in respect of that work; and
>
> (b) the minimum level of enhancement allowed in respect of that work shall be 15%.

> [note: The chapeau is load-bearing and is quoted with the sub-paragraphs for that
> reason. Both limbs are confined to "work done by a member of a relevant panel", and
> (a) narrows again to "that work". Quoting 7.23(a) without its chapeau produces a
> sentence that appears to deem the threshold satisfied at large.]

### 7.24

> In Paragraph 7.23 “relevant panel” means:-
>
> (a) the panel of Resolution Accredited Specialists;
>
> (b) the Law Society’s Family Law - Advanced Accreditation Scheme;
>
> or
>
> (c) the Law Society’s Children Law Accreditation Scheme.

> [note: There are exactly three panels and no fourth. The tool's three panel
> checkboxes must correspond to these and to nothing else.]

## Provenance across the 2013, 2018 and 2024 contracts

The paragraph numbers are 7.20–7.24 in all three. Each predecessor was downloaded and
read directly on 6 August 2026, not inferred.

**2018** (Family Category Specific Rules, October 2022 reprint —
https://assets.publishing.service.gov.uk/media/6332db86d3bf7f567394f802/2_2018_Standard_Civil_Contract__Family__Category_Spec_Rules_Oct_22.pdf,
page 7 of 36): 7.20–7.23 are word-for-word identical to 2024. 7.24 differs only in
layout — it breaks after `In Paragraph 7.23:` and does not print `or` before limb (c).
The three panels and their order are the same as 2024.

**2013** (amended July 2015 —
https://assets.publishing.service.gov.uk/media/5a7486f440f0b616bcb1732a/category-specific-rules-family.pdf,
page 7 of 37): materially different in four ways.

1. 7.23's chapeau reads "Where the **relevant work** is done by a member of a relevant
   panel".
2. 7.23(a) capitalises "Threshold Test" and cites **Paragraph 6.14**, not 6.13.
3. The limbs are in a different order: (b) is the Children Law scheme and (c) is Family
   Law - Advanced. In 2018 and 2024 those are the other way round.
4. **The Children Law limb carried a restriction that no longer exists.** Verbatim:

> (b) in relation to work done under a Certificate which includes proceedings relating to children, the Law Society’s Children Law Accreditation Scheme;

   followed by a definition:

> “proceedings relating to children” means proceedings in which the welfare of children is determined, including, without limitation, proceedings under the Children Act 1989 or under the inherent jurisdiction of the High Court in relation to children.

> [note: Point 4 is why this section exists. Until 5 August 2026 the tool made its
> Children Panel checkbox conditional on "(and work relates to children)" — a real term,
> of the 2013 contract, dropped in 2018 and absent from the operative 2024 rules. It had
> been enforced against solicitors working under a contract that does not contain it.
> The restriction attaches to the **Children Law** limb only; it never applied to
> Resolution or to Family Law - Advanced. Do not reintroduce it, and do not cite a
> pre-2018 Family Specification for anything.]

## What these paragraphs do and do not say

**Scope.** Both limbs of 7.23 are confined by the chapeau to work done by the panel
member. 7.23(a) narrows further to "that work". Nothing in 7.20–7.24 extends either the
deeming or the 15% to supervision, or to work done by anyone else on the same matter.
The Costs Assessment Guidance says so expressly, at CAG 12.22 (quoted in full in
`_cag-section-12-verbatim.md`):

> The minimum guaranteed enhancement is not available for supervision or to work done by other fee-earners. When preparing the bill for assessment, the narrative must clearly state the fee-earner for whom the enhancement is claimed and the basis for the enhancement.

> [note: The second sentence is an instruction to the draftsman and is the reason the
> tool requires a fee earner's name before it will treat the threshold as deemed. A
> panel tick with no name states neither the fee-earner nor a basis, so it cannot
> support the claim CAG 12.22 requires the narrative to make. An earlier draft of this
> file quoted only the first sentence, unmarked — the elision removed the very sentence
> that governs what the narrative must contain.]

**Extent, for the panel member's own work.** CAG 12.21:

> Where the fee-earner is a member of the accredited specialist panel of Resolution, the Law Society Children Panel or the Law Society Panel Advanced, the enhancement is applied to all work done in any family case.

> [note: The words are "all work done in any family case" — the paragraph does not
> itself repeat "by that fee-earner". That limitation comes from 7.23's chapeau and
> from CAG 12.22, not from 12.21. Stated separately here because a draft of this file
> silently folded the limitation into a report of 12.21's wording, which is the class
> of small confident addition this repository has been bitten by twice.]

**Not cumulative.** 7.23(b)'s 15% is a floor, not an addition. CAG 12.23:

> As indicated in paragraph 12.3 above, the Panel Membership enhancement is a guaranteed minimum enhancement, and is not payable in addition to any enhancement allowed under the general Specification.

**What 7.23(a) does not do.** It deems the threshold test satisfied. It says nothing
about the *level* of enhancement beyond the 15% floor in 7.23(b), and it does not deem
any CAG 12.9 factor to be made out. A claim above 15% still has to be earned at Stage 2
on the facts. Nothing in 7.23 permits a narrative to assert that the work was
exceptional, complex, novel or weighty.

---

# General Rules — Paragraphs 6.12–6.17

**Added 7 August 2026** because the redesigned .docx wanted to print "(Spec para
6.15)" against the Stage 2 selections, and no verbatim source for anything in
Section 6 existed in this repository — the same gap this file's own rule treats as a
defect. These paragraphs also underwrite the app's existing narrative citations of
Spec 6.13 and Spec 6.15.

## Provenance

This is a DIFFERENT document from the Family rules above: the general Specification.
Extracted twice, independently, on 7 August 2026, by the same method as 7.20–7.24:

1. `gpt-5.6-sol` fetched the PDF, transcribed 6.12–6.17, then re-fetched the same
   asset and string-matched its own transcription — exact match on all six.
2. The Claude session downloaded the PDF separately (MD5
   `e35d07595f16d5e0c7802ebef61ff120`) and extracted the same page with `pypdf`,
   then compared word by word against that transcription.

The two agree exactly on all six paragraphs. The only differences were two
intra-word spaces introduced by `pypdf`'s text layer — `enhancemen t` (6.12) and
`exceedin g` (6.16) — the same artefact class as the CAG PDF's `fee -earner`. They
are extraction artefacts, not source wording; character-for-character the texts are
identical once whitespace is removed. `pypdf` also appended the running `May 2025`
page header to 6.17; it is not part of the paragraph.

The document, titled on its cover:

> 2024 Standard Civil Contract
> Specification:
> General Rules

Cover date **May 2025**. Paragraphs 6.12–6.17 are all on **PDF page 68 of 81**, in
**Section 6 Payment for Licensed Work**, under the heading `Hourly Rates
Enhancements`.

- Source PDF: https://assets.publishing.service.gov.uk/media/682c7ba9a4a41a5b3eb00c95/2_2024_Standard_Civil_Contract_General_Specification.pdf
- Linked from the same LAA collection page as the Family rules: https://www.gov.uk/government/publications/standard-civil-contract-2024

> [note: In 6.15 there is no punctuation after `prepared`, and `and` stands on its
> own printed line before limb (c). That is how the source prints it. Do not
> "correct" either on reuse.]

## The paragraphs

### 6.12

> The following rules apply only to remuneration by way of Prescribed Rates under the Remuneration Regulations (but excluding for this purpose any determination as to whether a case escapes from any Standard Fee or Graduated Fee). No other form of enhancement or uplift is payable except as set out below.

### 6.13

> The threshold test: on assessment of Licensed Work, we may allow fees at more than the Prescribed Rate in respect of any item of work where it appears, taking into account all the relevant circumstances, that:
>
> (a) the work was done with exceptional competence, skill or expertise;
>
> (b) the work was done with exceptional speed; or
>
> (c) the case involved exceptional circumstances or complexity.

### 6.14

> Where we or the court consider that any item of work should be allowed at more than the Prescribed Rate, we may apply to that item of work a percentage enhancement in accordance with the provisions of Paragraphs 6.15 to 6.17 below.

### 6.15

> In determining the percentage by which fees should be enhanced above the Prescribed Rate we shall have regard to:
>
> (a) the degree of responsibility accepted by the legal advisor;
>
> (b) the care, speed and economy with which the case was prepared
>
> and
>
> (c) the novelty, weight and complexity of the case.

### 6.16

> The percentage above the Prescribed Rate by which fees for work may be enhanced shall not exceed 50%. The exception to this is that in proceedings in the High Court, Court of Appeal, Upper Tribunal or Supreme Court, we may allow an enhancement not exceeding 100% where it is considered that, in comparison with work in other proceedings in those courts which would merit 50% enhancement, the item of work relates to exceptionally complex matters which have been handled with exceptional competence or speed.

### 6.17

> We or the court may have regard to the generality of proceedings to which the relevant Prescribed Rates apply in determining what is exceptional within the meaning of this provision.

## What these paragraphs settle

**6.13 is the threshold test, by the paragraph's own label** ("The threshold test:
..."). The Stage 1 route line's citation "(Spec para 6.13)" is correct, whether the
threshold is established by selections (6.13(a)–(c)) or deemed (7.23(a), which
itself names 6.13).

**6.15 is the level-of-enhancement paragraph.** Its three limbs — (a) degree of
responsibility, (b) care, speed and economy, (c) novelty, weight and complexity —
are the groups the CAG 12.9 factors sit inside ("within the limbs of Paragraph
6.15"). The Stage 2 route line therefore cites **Spec para 6.15**; CAG 12.9 supplies
the individual factors beneath it. This also confirms the app's existing
`stage2_intro_narrative` citation ("Spec Para 6.15 / CAG Section 12.5 & 12.9").

**The CAG 12.8 looseness is now fully resolvable.** CAG 12.8 says "the three limbs
of 6.15" in a sentence about the threshold. The General Rules show the threshold
limbs are 6.13(a)–(c) and the 6.15 limbs are the level factors — different limbs,
different paragraphs. CAG 12.8's phrase is a slip for 6.13's limbs; the note in
`_cag-section-12-verbatim.md` (line ~70) and the comment in `content-data.js`
already treat it that way, and this text proves them right.

**Ceilings: 6.16 is the general rule; Family work follows 7.22.** 6.16 allows up to
100% in the High Court, Court of Appeal, **Upper Tribunal** or Supreme Court, and
CAG 12.2 repeats that list — the guidance tracks the general rule. The Family rule
7.22 (above) omits the Upper Tribunal and is the operative ceiling for Family
Contract Work: 7.20 applies Paragraphs 6.12–6.17 to Family work as the route in,
and 7.22 then states the Family-specific ceiling in its own words. Where guidance
and contract diverge, the contract governs.

> [note: An earlier draft of this section claimed the Collator's court list
> already followed the Family rule. It did not — a claim about the code written
> without reading the code, found by the round-8 adversarial review on
> 7 August 2026. The redesigned court list (branch commit `fc0fe15`, never
> shipped) had been built from CAG 12.2's words and offered "Upper Tribunal" at a
> 100% ceiling, which 7.22 does not permit for Family work — and the Upper
> Tribunal does not hear family proceedings at all. The unverified claim is the
> same defect class this file exists to prevent, one level up.]

**"Stage 1" and "Stage 2" are the project's analytical labels**, not the
Specification's. The Specification never uses them. A route line reading
"Established by the Stage 2 selections below (Spec para 6.15)" is sound: the label
is ours, the citation is to the paragraph the selections instantiate.
