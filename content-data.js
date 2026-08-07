// --- content-data.js ---
// This file stores the static data for the LAA Uplift Data Capture Web Application.

// Version Information
// 1.11 never shipped. The whole redesign was built under it on
// redesign/stage1-labels and none of it reached main, so the compatibility rule
// stays "v1.10 or earlier ⇒ legacy label set" and every "pre-v1.11" comment in
// this file remains accurate as a boundary. Bumped to 1.12 on 6 August 2026 for
// the deemed-threshold route and the two new Stage 1 labels, because a released
// 1.11 and this build would otherwise be two different label sets under one
// number — and the label set is the extraction contract. Bumped to 1.13 on
// 7 August 2026 when the output became .docx (1.12, like 1.11, never shipped):
// the output format is as much of the extraction contract as the label set, so
// two formats must not share a number — and it buys a diagnostic for free: a
// PDF stamped v1.13 or later cannot be the app's own work.
const APP_VERSION = "1.13";
const APP_RELEASE_DATE = "7 August 2026";
const APP_NAME = "Uplift Collator";

const LAA_GUIDE_URL = "https://assets.publishing.service.gov.uk/media/66f13cfa76558d051527abb9/Costs_Assessment_Guidance_2024_SCC_-_Version_1a-_23_September_2024.pdf";
const LAA_GUIDE_VERSION_INFO_CONST = "Based on LAA Costs Assessment Guidance (Version 1a, 23 September 2024)";
const LAA_PUBLICATIONS_PAGE_URL = "https://www.gov.uk/government/collections/legal-aid-guidance-for-professionals";


// Passwords for the welcome screen (normalized: lowercase, no spaces)
const ACCEPTABLE_PASSWORDS_NORMALIZED = [
    "westpier", // for "West Pier" or "WestPier"
    "goodlaw"   // for "Goodlaw"
    // Add more acceptable normalized passwords here, e.g., "anotherpassword"
];

// --- NARRATIVE TEMPLATES (For Woodruff Billing's internal narrative compilation from the solicitor's summary document) ---
// Placeholders: {UPLIFT_PERCENT}, {ITEM_OF_WORK}, {FEE_EARNER_NAME}, {PANEL_NAME}, {USER_EXPLANATION}
// {ITEM_OF_WORK} will be: formData.caseDetails.matterType + ": " + formData.caseDetails.caseMatterName
// {USER_EXPLANATION} will be replaced by the solicitor's text, formatted as a blockquote.
// --- NARRATIVE TEMPLATES ---
//
// Rewritten 4 August 2026 with the v1.11 redesign. Three classes of correction
// were made at the same time, all verified against `_cag-section-12-verbatim.md`:
//
//  1. CITATIONS. The limb headers cited "CAG Section 12.8.1 / 12.8.2 / 12.8.3".
//     No such paragraphs exist — the guidance numbers its sub-limbs 12.8(a),
//     12.8(b) and 12.8(c). Six citations were wrong in this object alone.
//  2. THE COMPARISON BENCHMARK. The conclusion claimed the work was exceptional
//     "beyond that normally expected for a fee earner of this level". CAG 12.8
//     says the comparison is "with the generality of legally aided proceedings to
//     which the prescribed rates apply", and 12.11 expressly rejects comparing
//     solely within the same category or type of proceedings. The old wording
//     measured the case against the wrong yardstick, and against that yardstick
//     hard work looks ordinary.
//  3. THE SPECIFICATION YEAR. The intro said "2018 Standard Civil Contract
//     Specification". Every "Spec Para" number quoted here was taken from the 2024
//     CAG, whose definitions section (PDF page 4) states: '"the Specification"
//     means the 2024 Standard Civil Contract Specification'. The string "2018"
//     appears nowhere in the CAG. Corrected to 2024 on Simon's decision,
//     4 August 2026.
//
// RETIRED KEYS. Five Stage 1 keys and several Stage 2 keys left QUESTION_BLOCKS in
// the redesign but REMAIN HERE deliberately, at the bottom of the object. PDFs
// already sitting in live matters contain those criteria, and `_narrator/` must
// keep rendering them exactly as it did when they were produced. They are no longer
// offered to new users. Do not delete them; see LEGACY_LABEL_ALIASES.
const NARRATIVE_TEMPLATES = {
    // Singular variants, added 1 August 2026. A claim resting on one factor is
    // common, and the plural wording does not merely read awkwardly there — a
    // single factor cannot be weighed "individually and/or cumulatively", which
    // is the sentence carrying the whole justification. skeleton.py picks by
    // count; see _pick_by_count().
    "intro": "An enhancement of {UPLIFT_PERCENT}% is claimed on the {ITEM_OF_WORK} work due to the following exceptional factors, reflecting the principles in CPR 44.4(3) and relevant LAA Costs Assessment Guidance (CAG) and the 2024 Standard Civil Contract Specification (referred to as 'Spec'):\n\n",
    "intro_singular": "An enhancement of {UPLIFT_PERCENT}% is claimed on the {ITEM_OF_WORK} work due to the following exceptional factor, reflecting the principles in CPR 44.4(3) and relevant LAA Costs Assessment Guidance (CAG) and the 2024 Standard Civil Contract Specification (referred to as 'Spec'):\n\n",

    // Deemed-route variants of the two above, naming the fee earner. On the
    // ordinary route the threshold rests on features of the case and the
    // unqualified wording is right. On the deemed route it rests entirely on one
    // named person's panel membership: Spec Para 7.23's chapeau confines the
    // deeming to "work done by a member of a relevant panel", and CAG 12.22
    // excludes supervision and other fee earners outright. An unqualified claim on
    // a bill with a second fee earner would extend the deeming over work it never
    // covered — which is also the one thing CAG 12.22 tells the draftsman to make
    // clear: "the narrative must clearly state the fee-earner for whom the
    // enhancement is claimed and the basis for the enhancement".
    "intro_deemed": "An enhancement of {UPLIFT_PERCENT}% is claimed on the {ITEM_OF_WORK} work carried out by {FEE_EARNER_NAME}, due to the following exceptional factors, reflecting the principles in CPR 44.4(3) and relevant LAA Costs Assessment Guidance (CAG) and the 2024 Standard Civil Contract Specification (referred to as 'Spec'):\n\n",
    "intro_deemed_singular": "An enhancement of {UPLIFT_PERCENT}% is claimed on the {ITEM_OF_WORK} work carried out by {FEE_EARNER_NAME}, due to the following exceptional factor, reflecting the principles in CPR 44.4(3) and relevant LAA Costs Assessment Guidance (CAG) and the 2024 Standard Civil Contract Specification (referred to as 'Spec'):\n\n",
    // The scope qualifier these two templates used to carry — "and the work
    // undertaken falls within the scope of this accreditation" — was removed on
    // 5 August 2026. It has no source. It is absent from the 2024 General
    // Specification (6.12–6.17), the 2024 Family Category Specific Rules
    // (7.20–7.24), their 2018 equivalents and the Remuneration Regulations 2013,
    // and CAG 12.21 says the opposite: "Where the fee-earner is a member of the
    // accredited specialist panel of Resolution, the Law Society Children Panel
    // or the Law Society Panel Advanced, the enhancement is applied to all work
    // done in any family case." A qualifier the guidance contradicts, volunteered
    // in a narrative to the LAA, invites a challenge nothing requires.
    "panel_membership": "**Panel Membership (CAG Section 12.20-12.23):**\nA minimum enhancement of 15% is claimed as the fee earner ({FEE_EARNER_NAME}) is a member of the {PANEL_NAME}. This is a guaranteed minimum enhancement.",
    // Now identical to the singular, because "this accreditation" / "those
    // accreditations" was the only thing that differed. Deliberately kept rather
    // than deleted: skeleton.py asks for it by name via _pick_by_count(), and a
    // membership count is still the right axis if the wording ever diverges
    // again. Do not "tidy" this away without changing that call.
    "panel_membership_plural": "**Panel Membership (CAG Section 12.20-12.23):**\nA minimum enhancement of 15% is claimed as the fee earner ({FEE_EARNER_NAME}) is a member of the {PANEL_NAME}. This is a guaranteed minimum enhancement.",

    // --- Stage 1: the threshold test -------------------------------------------
    // Stage 1 is pass/fail (CAG 12.4) and earns nothing, so its contribution to the
    // narrative is deliberately brief: it states the claim, and Stage 2 evidences
    // it. CAG 12.7 expects exactly that overlap ("There is clearly some overlap
    // between the factors that will justify enhancement under the 'threshold test'
    // and the factors determining the level of enhancement"). These templates
    // therefore carry no {USER_EXPLANATION} — from v1.11 Stage 1 collects no prose.
    "threshold_intro_narrative": "\n**LAA Threshold Test (Qualifying for Enhancement - Spec Para 6.13 / CAG Section 12.4):**\nThe work meets the threshold for enhancement because, compared with the generality of legally aided proceedings to which the prescribed rates apply:",

    // Used INSTEAD of threshold_intro_narrative when the solicitor ticked nothing
    // at Stage 1 and the threshold is deemed satisfied by panel membership. Both
    // the quotation and the paragraph number are checked against
    // _spec-7.20-7.24-verbatim.md, which is the source of truth for the
    // Specification exactly as _cag-section-12-verbatim.md is for the guidance.
    //
    // It opens on the entitlement rather than on the absence of factors. Leading
    // with "no threshold factor is asserted" would be true and would also be an
    // admission against interest in the first line of a bill narrative, for no
    // gain: the absence is evident the moment an assessor looks for the list. The
    // absence is still stated — third sentence — because an assessor must not have
    // to discover it.
    //
    // Every assertion traces to something the solicitor entered: the name they
    // typed, the panel they ticked, and the fact that no Stage 1 box is ticked.
    // The rest is citation, which the narrator may add. It asserts nothing about
    // the work itself, which is the whole point of a deemed threshold — it is a
    // matter of contractual entitlement, not a claim about the case.
    //
    // Scope is confined to the named fee earner, because Spec Para 7.23's chapeau
    // confines it and CAG 12.22 excludes supervision and other fee earners. On a
    // bill with a second fee earner an unqualified claim would extend the deeming
    // to work it never covered.
    "threshold_deemed_narrative": "\n**LAA Threshold Test (Qualifying for Enhancement - Spec Para 6.13 / CAG Section 12.4):**\nThe threshold test at Spec Para 6.13 is deemed to be satisfied in respect of the work carried out by {FEE_EARNER_NAME}, who is a member of the {PANEL_NAME}. Spec Para 7.23(a) provides that where work is done by a member of a relevant panel \"the threshold test at Paragraph 6.13 shall be deemed to be satisfied in respect of that work\". This claim relies on that provision, and not on any of the threshold factors described at CAG Section 12.8. The level of enhancement claimed is addressed below.",
    "s1_competence_skill_expertise_header_narrative": "  The work was done with **exceptional competence, skill or expertise** (Spec Para 6.13(a) / CAG Section 12.8(a)):",
    "s1_cse_detailed_knowledge": "    - Unusually detailed knowledge relevant to this case was applied.",
    "s1_cse_difficult_argument": "    - An unusual or difficult legal argument was pursued.",
    "s1_cse_marshalling_evidence": "    - Evidence was identified and marshalled with unusual skill.",
    "s1_cse_effective_tactic": "    - A particularly effective tactic was adopted.",
    "s1_cse_better_result_current": "    - The case was conducted so well that the client obtained a better result than might usually have been expected.",
    "s1_cse_less_time": "    - The work required less time than would have been expected of a notional reasonable fee-earner.",
    "s1_cse_vulnerable_client": "    - Instructions were taken from, and effective representation provided for, a client who was a child, seriously mentally unwell or otherwise very vulnerable, requiring unusual skill.",
    // The three limb "other" templates. They assert the limb — which is the
    // operative test at Spec 6.13 — and defer the substance to Stage 2, where
    // the solicitor writes it. CAG 12.7 is cited because it is the paragraph
    // that makes asserting the limb without one of 12.8's examples legitimate.
    "s1_cse_other": "    - The work was done with exceptional competence, skill or expertise in a respect other than the examples given at CAG 12.8(a), which are expressly not exhaustive (CAG 12.7). The circumstances are set out below.",
    "s1_exceptional_speed_header_narrative": "  The work was done with **exceptional speed** (Spec Para 6.13(b) / CAG Section 12.8(b)):",
    "s1_speed_proactive_pursuit": "    - A resolution of the client's problem was proactively obtained with unusual speed.",
    "s1_speed_urgent_deadlines": "    - Substantial work was carried out at short notice to meet an urgent deadline or hearing.",
    "s1_speed_other": "    - The work was done with exceptional speed in a respect other than the examples given at CAG 12.8(b), which are expressly not exhaustive (CAG 12.7). The circumstances are set out below.",
    "s1_exceptional_circumstances_complexity_header_narrative": "  The case involved **exceptional circumstances or complexity** (Spec Para 6.13(c) / CAG Section 12.8(c)):",
    "s1_circ_legal_issues": "    - The legal, expert or other evidential issues were exceptionally complex.",
    "s1_circ_difficult_instructions": "    - Taking instructions from the client or other witnesses was exceptionally difficult.",
    "s1_circ_client_impact": "    - The issues affecting the client gave rise to exceptional circumstances.",
    "s1_circ_out_of_hours": "    - The case required substantial out-of-hours work.",
    // Both assert the operative limb — exceptional circumstances or complexity —
    // with novelty or volume as the cause. Neither says novelty or weight is
    // itself the threshold, because Spec Para 6.13(c) does not say that. See the
    // limb (c) block comment in QUESTION_BLOCKS for the whole reasoning.
    "s1_circ_novel_point": "    - A novel point of law or legal context made the case exceptionally complex.",
    "s1_circ_weight": "    - The volume of documentation, material or issues gave rise to exceptional circumstances.",
    "s1_circ_other": "    - The case involved exceptional circumstances or complexity in a respect other than the examples given at CAG 12.8(c), which are expressly not exhaustive (CAG 12.7). The circumstances are set out below.",

    // --- Stage 2: the level of enhancement --------------------------------------
    // One header per factor in CAG 12.9. There are exactly seven, which 12.10
    // confirms when it refers to "the above seven factors".
    "stage2_intro_narrative": "\n**Determining the Level of Enhancement (Justifying the % - Spec Para 6.15 / CAG Section 12.5 & 12.9):**\nOnce the threshold test is met, the level of enhancement is justified by the following factors:",
    "stage2_intro_narrative_singular": "\n**Determining the Level of Enhancement (Justifying the % - Spec Para 6.15 / CAG Section 12.5 & 12.9):**\nOnce the threshold test is met, the level of enhancement is justified by the following factor:",

    "s2_care_header_narrative": "  **Care** (CAG 12.9(b)(i)):",
    "s2_care_detailed_knowledge": "    - Unusually detailed knowledge was applied to this case.{USER_EXPLANATION}",
    "s2_care_marshalling_evidence": "    - Evidence was identified and marshalled with unusual skill.{USER_EXPLANATION}",
    "s2_care_effective_tactic": "    - A particularly effective tactic was adopted.{USER_EXPLANATION}",
    "s2_care_better_result": "    - The case was conducted so well that the client obtained a better result than might usually have been expected.{USER_EXPLANATION}",
    "s2_care_vulnerable_client": "    - Particular care was required and shown in dealing with a vulnerable client.{USER_EXPLANATION}",
    "s2_care_other": "    - Exceptional competence, skill or expertise was shown in the following respect.{USER_EXPLANATION}",

    "s2_speed_header_narrative": "  **Speed** (CAG 12.9(b)(ii)):",
    "s2_speed_proactive_pursuit": "    - The case was proactively pursued, obtaining a resolution with unusual speed.{USER_EXPLANATION}",
    "s2_speed_urgent_deadlines": "    - Substantial work was carried out at short notice to meet an urgent deadline or hearing.{USER_EXPLANATION}",
    "s2_speed_other": "    - Exceptional speed was achieved in the following respect.{USER_EXPLANATION}",
    "s2_speed_out_of_hours": "    - Substantial out-of-hours work was required.{USER_EXPLANATION}",

    "s2_efficiency_header_narrative": "  **Efficiency** (CAG 12.9(b)(iii)):",
    "s2_efficiency_less_time": "    - Less time was claimed than might otherwise have been expected.{USER_EXPLANATION}",

    "s2_novelty_header_narrative": "  **Novelty** (CAG 12.9(c)(i)):",
    "s2_novelty_difficult_argument": "    - An unusual or difficult legal argument was pursued.{USER_EXPLANATION}",
    "s2_novelty_novel_point": "    - The case involved a novel point of law or legal context.{USER_EXPLANATION}",

    "s2_weight_header_narrative": "  **Weight** (CAG 12.9(c)(ii)):",
    "s2_weight_client_importance": "    - The importance of the case to the client was a factor in the level of enhancement.{USER_EXPLANATION}",
    "s2_weight_volume": "    - The volume of documentation or other material, or the number of issues arising, was a factor in the level of enhancement.{USER_EXPLANATION}",

    "s2_complexity_header_narrative": "  **Complexity** (CAG 12.9(c)(iii)):",
    "s2_complexity_legal_issues": "    - Complexity related to legal issues, questions of expert evidence or other evidential issues.{USER_EXPLANATION}",
    "s2_complexity_difficult_instructions": "    - Complexity arose from difficulty in taking instructions from the client or other witnesses.{USER_EXPLANATION}",
    "s2_complexity_other": "    - The case involved exceptional circumstances or complexity in the following respect.{USER_EXPLANATION}",

    // Degree of Responsibility closes the narrative. It is the only factor in 12.9
    // describing the shape of the whole retainer rather than a single event, and
    // CAG 12.16 uses the same framing (whether counsel "does take an unusual share
    // of the load on a case"). It is ALSO the factor that may legitimately be
    // absent: where counsel was instructed throughout there is little to claim
    // (12.16 — "any claim for enhancement may be more difficult for the provider to
    // justify"), and a forced closing paragraph would end the narrative on its
    // weakest point. skeleton.py omits the whole block when nothing is ticked.
    "s2_responsibility_header_narrative": "  **Degree of responsibility accepted by the fee earner** (CAG 12.9(a)):",
    "s2_resp_no_counsel_analysis": "    - Analysis and planning of the case was undertaken without recourse to counsel.{USER_EXPLANATION}",
    "s2_resp_no_counsel_drafting": "    - Drafting was undertaken without recourse to counsel.{USER_EXPLANATION}",
    "s2_resp_no_counsel_advocacy": "    - Advocacy was undertaken without recourse to counsel.{USER_EXPLANATION}",
    "s2_resp_addressed_expert_issues": "    - Evidential issues were identified or addressed that might otherwise have incurred the time of an expert.{USER_EXPLANATION}",
    "s2_resp_other": "    - The fee earner accepted a degree of responsibility beyond the considerations identified at CAG 12.9(a), which are expressly not exhaustive (CAG 12.7).{USER_EXPLANATION}",

    // The conclusion no longer asserts the wrong comparison. CAG 12.8 sets the
    // benchmark as the generality of legally aided proceedings; the previous
    // wording ("for a fee earner of this level") measured the case against its own
    // peer group, which is the comparison 12.11 rejects.
    "conclusion": "\nThese factors, individually and/or cumulatively, made the work exceptional when compared with the generality of legally aided proceedings to which the prescribed rates apply, justifying the enhancement claimed.",
    "conclusion_singular": "\nThis factor made the work exceptional when compared with the generality of legally aided proceedings to which the prescribed rates apply, justifying the enhancement claimed.",
    "evidence_on_file": "Evidence supporting these assertions can be found within the case file.",
    "evidence_on_file_singular": "Evidence supporting this assertion can be found within the case file.",

    // --- RETIRED KEYS ------------------------------------------------------------
    // Not offered to new users. Retained so `_narrator/` still renders PDFs that
    // were produced before v1.11 exactly as it did at the time. See the note at the
    // top of this object and LEGACY_LABEL_ALIASES below.
    "s1_cse_effective_tactic_or_better_result_legacy": "    - A particularly effective tactic was adopted, or the case was conducted so well that the client obtained a better result than might usually have been expected.",
    "s1_cse_better_result": "    - A better result ([SPECIFY RESULT]) was achieved than might usually have been expected, directly attributable to the exceptional skill applied.{USER_EXPLANATION}",
    "s1_circ_expert_evidence": "    - Complex questions of expert evidence from [NUMBER] experts in [FIELD(S)] required careful analysis.{USER_EXPLANATION}",
    "s1_circ_evidential_issues": "    - Significant evidential issues, such as [SEEKING/CHALLENGING EVIDENCE/TRACING ASSETS], added to the complexity.{USER_EXPLANATION}",
    "s1_circ_novelty": "    - The case presented novel points of law or a unique factual matrix concerning [SPECIFY NOVEL ASPECTS].{USER_EXPLANATION}",
    "s1_circ_weight_volume": "    - The sheer volume of documentation ([APPROX PAGES/FILES]) or number of distinct issues ([NUMBER]) constituted exceptional weight.{USER_EXPLANATION}",
    "s2_care_speed_economy_header_narrative": "  **Care, speed, and economy** (CAG 12.9(b)):",
    "s2_cse_care_skill": "    - Exceptional care and skill were demonstrated in the overall management and presentation of the case, particularly in [SPECIFY ASPECT].{USER_EXPLANATION}",
    "s2_cse_care_vulnerable_client": "    - Particular care was taken in dealing with a vulnerable client, demonstrating [EMPATHY/PATIENCE/ADAPTED TECHNIQUES].{USER_EXPLANATION}",
    "s2_care_effective_tactic_or_better_result_legacy": "    - A particularly effective tactic was adopted, or the case was conducted so well that the client obtained a better result than might usually have been expected.{USER_EXPLANATION}",
    "s2_cse_speed": "    - (As detailed in Stage 1, if applicable) The work was conducted with exceptional speed.{USER_EXPLANATION}",
    "s2_cse_economy_efficiency": "    - The case was handled with exceptional economy, resulting in [LESS TIME CLAIMED/FEWER DISBURSEMENTS] due to [EFFICIENT PLANNING/EFFECTIVE STRATEGY].{USER_EXPLANATION}",
    "s2_novelty_weight_complexity_header_narrative": "  **Novelty, weight, and complexity of the case** (CAG 12.9(c)):",
    "s2_nwc_novelty_law": "    - (As detailed in Stage 1, if applicable) The case involved novel points of law or legal context.{USER_EXPLANATION}",
    "s2_nwc_weight_docs_issues": "    - (As detailed in Stage 1, if applicable) The case involved exceptional weight (documentation/number or importance of issues).{USER_EXPLANATION}",
    "s2_nwc_complexity_overall": "    - (As detailed in Stage 1, if applicable) The overall complexity of the legal and factual matrix was exceptional.{USER_EXPLANATION}"
};

// The banner that sits above the Stage 1 labels. It holds CAG 12.8's threshold
// ("'Exceptional' has its normal meaning of 'unusual' or 'out of the ordinary',
// hence more than simply above the average") and encodes 12.11's rejection of
// category-based reasoning. The second sentence matters MORE in a family-only tool,
// not less: the error it prevents is concluding that a type of case is inherently
// exceptional.
const STAGE1_THRESHOLD_BANNER = "Tick only where this was unusual or out of the ordinary — not merely above average — compared with legally aided work generally. No category of case is exceptional in itself.";

// Rendered once beneath any expanded "what counts?" panel, rather than repeated in
// all sixteen strings. CAG 12.7, verbatim.
const WHAT_COUNTS_CAVEAT = "CAG 12.7: \"In neither case can an exhaustive list of features of a case be identified that will demonstrate the presence of these factors, and each claim must be considered on its own merits\". These examples are the guidance's own. They are not a complete list, and your case does not have to match one of them.";

// THE `code` PROPERTY IS A FROZEN LITERAL, NOT A DERIVED NUMBER.
//
// Every Stage 1 and Stage 2 checkbox carries a short stable identifier — A01,
// C07, "CARE 05", "RESP 02" — printed beside its label in the .docx summary so
// a fee earner and a costs draftsman can refer to a specific item by name over
// the phone. Page-1 panel memberships have no code: they are printed as a dash
// list inside MATTER DETAIL, not as coded items.
//
// The values were originally DERIVED from block order — limb letter (or factor
// prefix) plus the 1-based index of the checkbox within its block, counting
// only non-retired boxes. They are now written out as literals, and that is the
// point: a code identifies an item for as long as the item exists. Reordering
// the checkboxes, retiring one, or inserting a new one in the middle MUST NOT
// renumber the codes around it — a document printed last year would then name
// a different item than the same code names today.
//
// So: a new checkbox takes the next unused number in its block (not the next
// index), and a retired checkbox's number is never reused. `tests/test_item_codes.js`
// recomputes the original derivation and compares it with these literals; it is
// expected to fail the moment an insertion or a retirement would have shifted
// anything. That failure is the prompt to make a deliberate decision and update
// the test's frozen expectations — never to renumber the document.
//
// When a checkbox is retired: set `retired: true` on it, delete its `code`,
// and move that code HERE so no future checkbox can be given it. The app
// hides retired boxes from the form (script.js filters them at render), the
// generator never prints them, and the extractor treats their old codes as
// unknown — so an old document naming one fails closed with a diagnostic.
// Empty today; the guard test fails if any live code appears in it.
const RESERVED_ITEM_CODES = [];
const QUESTION_BLOCKS = [
    // PAGE 1 Content Block (Panel Membership)
    //
    // Retained because CAG 12.22 requires the bill narrative to "clearly state the
    // fee-earner for whom the enhancement is claimed and the basis for the
    // enhancement". From v1.11 it no longer feeds any calculation: the guaranteed
    // 15% (12.20) is applied at bill-drafting and is NOT payable in addition to the
    // general enhancement (12.23), so it is a floor, not an ingredient.
    //
    // 5 August 2026: the Children Panel label lost its "(and work relates to
    // children)" qualifier. It was a genuine term of the 2013 Family
    // Specification (para 7.24(b)), removed in 2018 and absent from the
    // operative 2024 Family Category Specific Rules (para 7.24(c) names the
    // scheme bare). CAG 12.21 puts it beyond doubt: the enhancement "is applied
    // to all work done in any family case". The old string is in
    // LEGACY_LABEL_ALIASES and must stay there — it is printed into every PDF
    // produced before that date *on which the Children Panel was ticked*. Not
    // every PDF: an unticked panel prints nothing, or "None selected.".
    {
        page: 1,
        id: "panel",
        title: "Family Panel Membership",
        // Deliberate template exception: these three extraction keys are rendered
        // together through the umbrella `panel_membership` template so multiple
        // memberships read as one natural sentence rather than three duplicates.
        checkboxes: [
            { label: "Fee earner is on Resolution Accredited Specialist Panel", key: "panel_membership_resolution", explanation: false },
            { label: "Fee earner is on Law Society Children Panel", key: "panel_membership_children", explanation: false },
            { label: "Fee earner is on Law Society Family Law Panel Advanced", key: "panel_membership_advanced", explanation: false },
        ],
        columns_for_sub_options: 1
    },

    // ===========================================================================
    // PAGE 2 — STAGE 1: the threshold test (CAG 12.4)
    // ===========================================================================
    //
    // TICK ONLY. No typing. Stage 1 is pass/fail and earns nothing, so it must not
    // consume the solicitor's effort — the previous version demanded 10+ words on
    // each of 17 boxes and then presented 11 more at Stage 2 to someone who had
    // nothing left to say. That is what produced the real submission with six
    // well-evidenced Stage 1 factors and only two at Stage 2, and it is a
    // structural fault rather than a personal one.
    //
    // Generic wording is safe here BECAUSE of `stage2_factor` below: every ticked
    // label reappears at Stage 2 and is evidenced there, so no ticked point is ever
    // left bare and the document as a whole is never boilerplate.
    //
    // THE LABEL STRINGS ARE THE EXTRACTION CONTRACT. `_narrator/extract.py` matches
    // ticked criteria by label text via `templates.label_to_key_lookup()`, and an
    // unmatched label stops the run (commit 2ba3adb). Changing a label here without
    // adding the old string to LEGACY_LABEL_ALIASES breaks every PDF already
    // sitting in a live matter. Keep them short, stable and distinctive.
    //
    // `what_counts` is quoted from CAG 12.8 and cited — never invented. Invented
    // examples read as an exhaustive list however they are captioned, so a
    // solicitor whose situation is not listed concludes they do not qualify. That
    // is the exact narrowing bias this redesign exists to remove.
    //
    // `stage2_factor` names the CAG 12.9 factor this label carries forward into.
    // Every label has one. A label without one would vanish silently between the
    // stages, which is the bug class this whole programme is about.
    {
        page: 2,
        id: "s1_competence",
        title: "Threshold limb (a): exceptional competence, skill or expertise",
        main_question_text: "Was the work done with exceptional competence, skill or expertise?",
        main_toggle_id: "s1_competence_main_toggle",
        narrative_header_key: "s1_competence_skill_expertise_header_narrative",
        cag_citation: "CAG 12.8(a) / Spec 6.13(a)",
        checkboxes: [
            {
                label: "Applied unusually detailed knowledge relevant to this case",
                key: "s1_cse_detailed_knowledge",
                code: "A01",
                explanation: false,
                stage2_factor: "care",
                what_counts: "CAG 12.8(a) gives this example: \"the fee-earner demonstrates unusually detailed knowledge relevant to the case\"."
            },
            {
                label: "Pursued an unusual or difficult legal argument",
                key: "s1_cse_difficult_argument",
                code: "A02",
                explanation: false,
                stage2_factor: "novelty",
                what_counts: "CAG 12.8(a) gives this example: \"skilfully pursues an unusual or difficult legal argument\". At Stage 2, the solicitor's explanation must address whether this involved a novel point of law or legal context."
            },
            {
                label: "Identified and marshalled evidence with unusual skill",
                key: "s1_cse_marshalling_evidence",
                code: "A03",
                explanation: false,
                stage2_factor: "care",
                what_counts: "CAG 12.8(a) includes \"unusual skill in identifying and marshalling evidence in pursuing or defending a case\"."
            },
            {
                label: "Adopted a particularly effective tactic",
                key: "s1_cse_effective_tactic",
                code: "A04",
                explanation: false,
                stage2_factor: "care",
                what_counts: "CAG 12.8(a) gives this example: \"identifying a particularly effective tactic on behalf of the client\"."
            },
            {
                label: "Obtained a better result than might usually have been expected",
                key: "s1_cse_better_result_current",
                code: "A05",
                explanation: false,
                stage2_factor: "care",
                what_counts: "CAG 12.8(a) says the provider \"may have conducted the case so well that the client has received a better result than might usually have been expected\"."
            },
            {
                label: "Required less time than expected of a notional reasonable fee-earner",
                key: "s1_cse_less_time",
                code: "A06",
                explanation: false,
                stage2_factor: "efficiency",
                what_counts: "CAG 12.8(a): enhancement \"may be indicated under this heading where the provider has carried out the case or particular work in a way that has required less time than would have been expected of a notional reasonable fee-earner\"."
            },
            {
                label: "Took instructions from and effectively represented a child, a seriously mentally unwell client, or another very vulnerable client",
                key: "s1_cse_vulnerable_client",
                code: "A07",
                explanation: false,
                stage2_factor: "care",
                what_counts: "CAG 12.8(a): \"Another example of unusual skill may be taking instructions and providing effective representation for a client who is a child, is seriously mentally ill or is otherwise very vulnerable.\""
            },
            // The "other" option, added 5 August 2026. See the note above
            // LIMB_OTHER_RATIONALE below for why all three exist.
            {
                label: "The work showed exceptional competence, skill or expertise in some other way",
                key: "s1_cse_other",
                code: "A08",
                explanation: false,
                // Says nothing on its own, so script.js refuses to produce a summary
                // unless some Stage 2 factor carrying this key is ticked and
                // explained. See unevidencedOtherFactors().
                requires_stage2: true,
                stage2_factor: "care",
                what_counts: "The examples above are the guidance's own, and CAG 12.7 says they are not a complete list: \"in neither case can an exhaustive list of features of a case be identified that will demonstrate the presence of these factors, and each claim must be considered on its own merits\". The test you are asserting here is the limb itself — Spec Para 6.13(a), that the work was done with exceptional competence, skill or expertise. Tick this only if that is true and none of the examples above fits; you will be asked to say what it was at Stage 2."
            },
        ],
        columns_for_sub_options: 1
    },
    {
        page: 2,
        id: "s1_speed",
        title: "Threshold limb (b): exceptional speed",
        main_question_text: "Was the work done with exceptional speed?",
        main_toggle_id: "s1_speed_main_toggle",
        narrative_header_key: "s1_exceptional_speed_header_narrative",
        cag_citation: "CAG 12.8(b) / Spec 6.13(b)",
        checkboxes: [
            {
                label: "Proactively obtained a resolution of the client's problem with unusual speed",
                key: "s1_speed_proactive_pursuit",
                code: "B01",
                explanation: false,
                stage2_factor: "speed",
                what_counts: "CAG 12.8(b): enhancement may arise \"where the fee-earner has proactively pursued a case, for example in obtaining with unusual speed rehousing, community care support, receipt of welfare benefits, an injunction, release from mental health detention or other resolution of the client’s problem\"."
            },
            {
                label: "Carried out substantial work at short notice to meet an urgent deadline or hearing",
                key: "s1_speed_urgent_deadlines",
                code: "B02",
                explanation: false,
                stage2_factor: "speed",
                what_counts: "CAG 12.8(b): it \"may also be justified if the fee-earner carries out substantial work at short notice because of urgent deadlines\"."
            },
            {
                label: "The work was done with exceptional speed in some other way",
                key: "s1_speed_other",
                code: "B03",
                explanation: false,
                // Says nothing on its own, so script.js refuses to produce a summary
                // unless some Stage 2 factor carrying this key is ticked and
                // explained. See unevidencedOtherFactors().
                requires_stage2: true,
                stage2_factor: "speed",
                what_counts: "The examples above are the guidance's own, and CAG 12.7 says they are not a complete list: \"in neither case can an exhaustive list of features of a case be identified that will demonstrate the presence of these factors, and each claim must be considered on its own merits\". The test you are asserting here is the limb itself — Spec Para 6.13(b), that the work was done with exceptional speed. Tick this only if that is true and neither example above fits; you will be asked to say what it was at Stage 2."
            },
        ],
        columns_for_sub_options: 1
    },
    {
        page: 2,
        id: "s1_circumstances",
        // Heading follows CAG 12.4(c), which is the operative threshold —
        // "exceptional circumstances or complexity". 12.8(c)'s own heading adds
        // novelty and weight, but 12.8's headings are demonstrably loose (it also
        // refers to "the three limbs of 6.15" where 12.4 puts the threshold at
        // 6.13), so 12.4 governs.
        //
        // The title and the narrative header therefore keep the operative wording
        // and MUST NOT drift to 12.8(c)'s heading. A narrative asserting
        // "exceptional circumstances, novelty, weight or complexity (Spec Para
        // 6.13(c))" would attribute to the contract words the contract does not
        // contain — the exact class of defect this tool exists to remove, and this
        // time in the direction that invites challenge rather than under-claiming.
        // Novelty and weight are instances beneath the limb, not a fourth limb.
        //
        // The novelty and weight labels were added on 6 August 2026, REVERSING the
        // decision recorded here on 4 August 2026. What changed was the question,
        // not the evidence. On 4 August the question was "should weight or novelty
        // pass the threshold on their own?" — Simon's answer was no, from never
        // having seen such a claim succeed, and that answer still stands. On
        // 6 August the question was "can a solicitor whose case really is
        // exceptional for one of those reasons say so at all?", and the answer was
        // that they could not: Stage 1 had no wording for it, so the tool turned
        // them away.
        //
        // The two are reconciled in the labels themselves, which do not claim the
        // thing Simon rejected. Each asserts the limb — exceptional circumstances
        // or complexity — with novelty or volume as the cause of it, and each
        // carries `requires_stage2`, so neither can reach the LAA without
        // particulars behind it at Stage 2. Weight or novelty alone, bare and
        // unevidenced, is exactly as unclaimable as it was before.
        title: "Threshold limb (c): exceptional circumstances or complexity",
        main_question_text: "Did the case involve exceptional circumstances or complexity?",
        main_toggle_id: "s1_circumstances_main_toggle",
        narrative_header_key: "s1_exceptional_circumstances_complexity_header_narrative",
        cag_citation: "CAG 12.8(c) / Spec 6.13(c)",
        checkboxes: [
            {
                label: "The legal, expert or other evidential issues were exceptionally complex",
                key: "s1_circ_legal_issues",
                code: "C01",
                explanation: false,
                stage2_factor: "complexity",
                what_counts: "CAG 12.8(c): \"Complexity may relate to legal issues, questions of expert evidence or other evidential issues, for instance seeking or challenging witness evidence in possession proceedings based on allegations of nuisance.\""
            },
            {
                label: "Taking instructions from the client or other witnesses was exceptionally difficult",
                key: "s1_circ_difficult_instructions",
                code: "C02",
                explanation: false,
                stage2_factor: "complexity",
                what_counts: "CAG 12.8(c): complexity \"may also take into account difficulty in taking instructions from the client or other witnesses\"."
            },
            {
                label: "The issues affecting the client gave rise to exceptional circumstances",
                key: "s1_circ_client_impact",
                code: "C03",
                explanation: false,
                stage2_factor: "weight",
                what_counts: "CAG 12.8(c) includes \"the nature of the issues as they affect the client, such as liberty, right to remain in the country, the roof over the client’s head, addressing domestic abuse or avoiding destitution\". At Stage 2 this feeds weight, which CAG 12.9(c)(ii) says \"may also refer to the importance of the case to the client\"."
            },
            {
                label: "The case required substantial out-of-hours work",
                key: "s1_circ_out_of_hours",
                code: "C04",
                explanation: false,
                stage2_factor: "speed",
                what_counts: "CAG 12.8(c): \"A case requiring substantial out of hours work may also be considered to fall under this limb or particular work may be considered under 6.15(b) of the Specification\". This carries forward to speed at Stage 2."
            },
            {
                label: "A novel point of law or legal context made the case exceptionally complex",
                // NOT `s1_circ_novelty`. That key already exists in
                // NARRATIVE_TEMPLATES as a RETIRED v1.10 entry, and both JS object
                // literals and json5 resolve a duplicate key to the last
                // occurrence — the retired block sits after the live one, so the
                // retired template would have won, silently. This label would then
                // have rendered into a bill narrative as "The case presented novel
                // points of law or a unique factual matrix concerning [SPECIFY
                // NOVEL ASPECTS]", sending an unfilled placeholder to the LAA,
                // plus a {USER_EXPLANATION} token on a label that carries no
                // explanation. structural_audit.py would have passed it: it checks
                // that a key HAS a template, not that the template is a live one.
                key: "s1_circ_novel_point",
                code: "C05",
                explanation: false,
                // `requires_stage2` on a NAMED label, which until 6 August 2026 was
                // used only for the three "other" labels. The reason differs. An
                // "other" says nothing on its own; this says something, but CAG
                // 12.9(c)(i) is close to an instruction that it be particularised —
                // "it should be clear from the provider's claim whether the case
                // involves a novel point of law or legal context". A tick asserting
                // novelty with nothing identifying the point is not clear from the
                // claim, so the guard applies here too.
                requires_stage2: true,
                stage2_factor: "novelty",
                what_counts: "CAG 12.8(c)'s heading names novelty as a threshold matter: \"The case involved exceptional circumstances, novelty, weight or complexity\". The operative wording is narrower — Spec Para 6.13(c), CAG 12.4(c) and CAG 12.12(c) all say \"exceptional circumstances **or complexity**\" — so this label asserts that limb, with the novel point as what made the case complex. It does not assert that novelty by itself passes the threshold, and an assessor reading 12.4(c) could argue that it cannot. CAG 12.9(c)(i) supplies the phrase: \"it should be clear from the provider's claim whether the case involves a novel point of law or legal context\". Because it must be clear, this tick will not stand alone — you will be asked at Stage 2 to identify the point and say what made it novel."
            },
            {
                label: "The volume of documentation, material or issues gave rise to exceptional circumstances",
                key: "s1_circ_weight",
                code: "C06",
                explanation: false,
                // Flagged for the reason Simon gave on 4 August 2026 when he
                // rejected weight as a threshold label outright: he has never seen
                // a claim pass on documentary weight alone. A bare tick asserting
                // exceptional volume with no figure anywhere in the document is
                // that claim. The flag makes it impossible to file.
                requires_stage2: true,
                stage2_factor: "weight",
                what_counts: "CAG 12.8(c)'s heading names weight as a threshold matter: \"The case involved exceptional circumstances, novelty, weight or complexity\". The operative wording is narrower — Spec Para 6.13(c), CAG 12.4(c) and CAG 12.12(c) all say \"exceptional circumstances **or complexity**\" — so this label asserts that limb, with the volume as what gave rise to it. Tick it with your eyes open: an assessor can argue that volume is a Stage 2 consideration under CAG 12.9(c)(ii) and not a threshold matter at all, and a claim resting on bulk alone is the weakest kind there is. It will not stand alone — you will be asked at Stage 2 for the actual volume, in files, pages or issues. **If what gives this case its weight is what was at stake for the client rather than its bulk, tick \"The issues affecting the client gave rise to exceptional circumstances\" above instead.** That is the other half of CAG 12.9(c)(ii), and ticking both for the same fact double-counts it."
            },
            {
                label: "The case involved exceptional circumstances or complexity in some other way",
                key: "s1_circ_other",
                code: "C07",
                explanation: false,
                // Says nothing on its own, so script.js refuses to produce a summary
                // unless some Stage 2 factor carrying this key is ticked and
                // explained. See unevidencedOtherFactors().
                requires_stage2: true,
                stage2_factor: "complexity",
                what_counts: "The examples above are the guidance's own, and CAG 12.7 says they are not a complete list: \"in neither case can an exhaustive list of features of a case be identified that will demonstrate the presence of these factors, and each claim must be considered on its own merits\". The test you are asserting here is the limb itself — Spec Para 6.13(c), that the case involved exceptional circumstances or complexity. Tick this only if that is true and none of the examples above fits; you will be asked to say what it was at Stage 2. It carries forward to **Complexity**, because CAG 12.9(c)(iii) refers back to the discussion at 12.8(c) — but this limb covers circumstances *as well as* complexity, and CAG 12.9 has no general \"circumstances\" factor. If what makes the case worth more is really its weight, the speed it demanded, the care it took or the responsibility carried, tick that factor at Stage 2 as well and explain it there."
            },
        ],
        columns_for_sub_options: 1
    },

    // ===========================================================================
    // PAGE 3 — STAGE 2: the level of enhancement (CAG 12.9)
    // ===========================================================================
    //
    // One block per factor in CAG 12.9. There are exactly seven, which 12.10
    // confirms when it speaks of "the above seven factors".
    //
    // `carried_from` lists the Stage 1 keys that pre-select this item. `stem` is a
    // sentence opening rather than a blank box — a completion task, not a writing
    // task — so what the solicitor types is already narrative prose. `example` is
    // the worked model sentence, which in previous versions lived in the textarea
    // placeholder and was destroyed by the first keystroke; it is now shown
    // persistently beside the stem.
    //
    // `origin: "independent"` marks an item with no Stage 1 carrier, which must
    // therefore be offered on its own. Omitting these would automate the exact bug
    // this redesign exists to fix — the real submission that prompted it left the
    // entire Responsibility block empty.
    {
        page: 3,
        id: "s2_care",
        title: "Care",
        cag_citation: "CAG 12.9(b)(i)",
        factor: "care",
        narrative_header_key: "s2_care_header_narrative",
        factor_description: "CAG 12.9(b)(i): \"aspects of the skill with which the fee-earner has carried out work within the case and in particular the care with which the fee-earner has dealt with a vulnerable client\".",
        checkboxes: [
            { label: "Unusually detailed knowledge applied", key: "s2_care_detailed_knowledge", code: "CARE 01", explanation: true, carried_from: ["s1_cse_detailed_knowledge"], stem: "That knowledge mattered here because…", example: "e.g., An exceptional understanding of [obscure case law/specific local authority policy] regarding [topic] was crucial because..." },
            // Label deliberately NOT "Unusual skill in marshalling evidence" — that
            // exact string is a pre-v1.11 Stage 1 label in LEGACY_LABEL_ALIASES, and
            // label_to_key_lookup() raises on one label mapping to two keys.
            { label: "Evidence marshalled with unusual skill", key: "s2_care_marshalling_evidence", code: "CARE 02", explanation: true, carried_from: ["s1_cse_marshalling_evidence"], stem: "The evidence required this skill because…", example: "e.g., The case required collating and analysing over [number] pages of [type of evidence, e.g., medical records/financial statements] to distil key facts about..." },
            { label: "Particularly effective tactic", key: "s2_care_effective_tactic", code: "CARE 03", explanation: true, carried_from: ["s1_cse_effective_tactic"], stem: "The tactic adopted was… and it was particularly effective because…", example: "e.g., Instead of [standard approach], we strategically opted for [specific tactic, e.g., an early without prejudice offer / a specific type of application], which led to..." },
            { label: "Better result than might usually have been expected", key: "s2_care_better_result", code: "CARE 04", explanation: true, carried_from: ["s1_cse_better_result_current"], stem: "The result obtained was… and the way the case was conducted contributed by…", example: "e.g., The client obtained [specific result], rather than [result that would usually have been expected], because the case was conducted by..." },
            { label: "Particular care with a vulnerable client", key: "s2_care_vulnerable_client", code: "CARE 05", explanation: true, carried_from: ["s1_cse_vulnerable_client"], stem: "The client's circumstances required… and so the work involved…", example: "e.g., Dealing with a client who [specific vulnerability, e.g., had severe anxiety / was a non-English speaker requiring an interpreter for every meeting] necessitated [specific adaptations, e.g., shorter, more frequent meetings / using visual aids] to ensure effective instructions..." },
            // Carries the limb (a) "other". The stem does the work the fixed
            // labels do elsewhere: without it this box invites "the case was
            // very difficult", which asserts nothing an assessor can weigh.
            { label: "Exceptional competence, skill or expertise shown in some other way", key: "s2_care_other", code: "CARE 06", explanation: true, carried_from: ["s1_cse_other"], stem: "What the fee earner did was… and what made it exceptional rather than merely competent was…", example: "e.g., Set out the specific thing done, and why it went beyond what a reasonable fee earner would ordinarily have done on a legally aided case — not why the case was hard, but what the fee earner brought to it." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    },
    {
        page: 3,
        id: "s2_speed",
        title: "Speed",
        cag_citation: "CAG 12.9(b)(ii)",
        factor: "speed",
        narrative_header_key: "s2_speed_header_narrative",
        factor_description: "CAG 12.9(b)(ii): \"will involve similar considerations as in paragraph 12.8(b) above in relation to exceptional speed\".",
        checkboxes: [
            { label: "Case proactively pursued to a rapid resolution", key: "s2_speed_proactive_pursuit", code: "SPEED 01", explanation: true, carried_from: ["s1_speed_proactive_pursuit"], stem: "The urgency arose because… and as a result…", example: "e.g., Given the imminent risk of [e.g., eviction/child removal], we proactively [action, e.g., issued an emergency application] within [timeframe, e.g., 24 hours of instruction], resulting in..." },
            { label: "Substantial work at short notice for an urgent deadline", key: "s2_speed_urgent_deadlines", code: "SPEED 02", explanation: true, carried_from: ["s1_speed_urgent_deadlines"], stem: "The deadline was… and meeting it required…", example: "e.g., Urgent instructions were received on [date] requiring [specific work, e.g., preparation for a short-notice hearing] by [deadline date/time] due to [reason for urgency], necessitating immediate and focused work..." },
            { label: "Substantial out-of-hours work", key: "s2_speed_out_of_hours", code: "SPEED 03", explanation: true, carried_from: ["s1_circ_out_of_hours"], stem: "The out-of-hours work was necessary because…", example: "e.g., Substantial work was unavoidably performed outside normal hours on [e.g., weekend of date / evenings of dates] to [reason, e.g., prepare for an emergency hearing / meet an unexpected court deadline]..." },
            { label: "Exceptional speed achieved in some other way", key: "s2_speed_other", code: "SPEED 04", explanation: true, carried_from: ["s1_speed_other"], stem: "The speed was exceptional because… and it was achieved by…", example: "e.g., Set out what was done, how quickly, and what the ordinary timescale would have been — the comparison is with legally aided proceedings generally, not with other family cases." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    },
    {
        page: 3,
        id: "s2_efficiency",
        title: "Efficiency",
        cag_citation: "CAG 12.9(b)(iii)",
        factor: "efficiency",
        narrative_header_key: "s2_efficiency_header_narrative",
        factor_description: "CAG 12.9(b)(iii): \"a reward for the provider for claiming less time or less in disbursements than might otherwise have been expected, whether because of the way in which particular items of work have been carried out or because of the way in which the case has been planned more generally\".",
        checkboxes: [
            { label: "Less time or fewer disbursements claimed than might otherwise have been expected", key: "s2_efficiency_less_time", code: "EFF 01", explanation: true, carried_from: ["s1_cse_less_time"], stem: "The time saved came from… and amounted to roughly…", example: "e.g., By [e.g., front-loading negotiations / proposing a streamlined directions timetable that was adopted by the court], the case was resolved more efficiently, likely saving [X hours / specific costs] compared to a more protracted approach, because..." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    },
    {
        page: 3,
        id: "s2_novelty",
        title: "Novelty",
        cag_citation: "CAG 12.9(c)(i)",
        factor: "novelty",
        narrative_header_key: "s2_novelty_header_narrative",
        factor_description: "CAG 12.9(c)(i): \"it should be clear from the provider’s claim whether the case involves a novel point of law or legal context\".",
        checkboxes: [
            { label: "Unusual or difficult legal argument", key: "s2_novelty_difficult_argument", code: "NOV 01", explanation: true, carried_from: ["s1_cse_difficult_argument"], stem: "The argument was… and any novelty in the point of law or legal context arose because…", example: "e.g., The argument concerned [specific issue]; the point of law or legal context was novel because..." },
            // Deliberately NOT "Novel point of law or legal context". The legacy
            // alias block below maps "A novel point of law or legal context" to
            // s2_novelty_difficult_argument, and the two would then differ by one
            // leading article. Both are Stage 2, so the section-membership guard
            // could not tell a wrap-damaged one from the other; and anyone later
            // "tidying" this label to add the article would give
            // label_to_key_lookup() one label mapping to two keys, which raises at
            // load and kills the narrator for every document, not just novelty
            // ones. "Novelty in the" shares no opening with "A novel point", so
            // there is nothing to tidy them together.
            { label: "Novelty in the point of law or legal context", key: "s2_novelty_novel_point", code: "NOV 02", explanation: true, carried_from: ["s1_circ_novel_point"], stem: "The novel point of law or legal context was… and it was novel because…", example: "e.g., The point concerned [specific issue]; it was novel because [there was no reported authority on it / the provision had not previously been applied to facts of this kind], and dealing with it required..." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    },
    {
        page: 3,
        id: "s2_weight",
        title: "Weight",
        cag_citation: "CAG 12.9(c)(ii)",
        factor: "weight",
        narrative_header_key: "s2_weight_header_narrative",
        // Weight has TWO halves, and as of 6 August 2026 both are carried forward.
        // CAG 12.9(c)(ii) covers "the volume of documentation, other material, or
        // the number of issues arising" AND "the importance of the case to the
        // client". The client-importance half arrives from Stage 1 label
        // s1_circ_client_impact; the volume half now arrives from s1_circ_weight,
        // added when limb (c) gained a weight label.
        //
        // Both remain independently tickable — carry-forward pre-ticks a box, it
        // does not gate it — so weight can still be claimed at Stage 2 by a
        // solicitor who did not tick either Stage 1 label. What changed is that a
        // Stage 1 weight tick is no longer an orphan: s1_circ_weight carries
        // `requires_stage2`, and this is the item that satisfies it.
        //
        // _PLAN.md recorded Responsibility and Weight as the two Stage 2 "orphans".
        // That was only ever half right — the client-importance half has had a
        // carrier since the redesign. Responsibility is now the only factor block
        // with no Stage 1 route into it at all, which is by design: there is no
        // threshold limb about carrying a case without counsel.
        factor_description: "CAG 12.9(c)(ii): weight \"may refer to the volume of documentation, other material, or the number of issues arising\". It \"may also refer to the importance of the case to the client\".",
        checkboxes: [
            { label: "Importance of the case to the client", key: "s2_weight_client_importance", code: "WEIGHT 01", explanation: true, carried_from: ["s1_circ_client_impact"], stem: "What was at stake for the client was… and that meant…", example: "e.g., The proceedings affected the client's [e.g., fundamental right to family life / risk of homelessness], requiring..." },
            { label: "Volume of documentation, material or issues", key: "s2_weight_volume", code: "WEIGHT 02", explanation: true, carried_from: ["s1_circ_weight"], stem: "The volume was… and dealing with it required…", example: "e.g., The disclosure, exceeding [e.g., 10 lever arch files / 2000 pages], related to [type of documents] and required time to review and schedule for..." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    },
    {
        page: 3,
        id: "s2_complexity",
        title: "Complexity",
        cag_citation: "CAG 12.9(c)(iii)",
        factor: "complexity",
        narrative_header_key: "s2_complexity_header_narrative",
        factor_description: "CAG 12.9(c)(iii) refers back to 12.8(c): complexity \"may relate to legal issues, questions of expert evidence or other evidential issues\", and \"may also take into account difficulty in taking instructions from the client or other witnesses\".",
        checkboxes: [
            { label: "Complexity relating to legal, expert or evidential issues", key: "s2_complexity_legal_issues", code: "COMP 01", explanation: true, carried_from: ["s1_circ_legal_issues"], stem: "The complexity lay in… and dealing with it required…", example: "e.g., The case involved interplay between [legal area 1] and [legal area 2], specifically concerning [the difficult point of law], which required research into..." },
            { label: "Difficulty in taking instructions", key: "s2_complexity_difficult_instructions", code: "COMP 02", explanation: true, carried_from: ["s1_circ_difficult_instructions"], stem: "Taking instructions was difficult because… and so…", example: "e.g., The client's [e.g., trauma / learning disability / distrust of authority] affected obtaining a coherent history and instructions, requiring multiple attendances and..." },
            { label: "Exceptional circumstances or complexity of some other kind", key: "s2_complexity_other", code: "COMP 03", explanation: true, carried_from: ["s1_circ_other"], stem: "The circumstances were… and dealing with them required…", example: "e.g., Set out what the circumstances were and what they demanded of the fee earner. \"Exceptional\" has its normal meaning of unusual or out of the ordinary (CAG 12.8), so say what made this case unlike the run of legally aided work. If the circumstances bear on weight, speed, care or responsibility rather than on complexity, tick that factor too and explain it there — this box files the claim under CAG 12.9(c)(iii)." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    },
    {
        page: 3,
        id: "s2_responsibility",
        title: "Degree of responsibility",
        cag_citation: "CAG 12.9(a)",
        factor: "responsibility",
        narrative_header_key: "s2_responsibility_header_narrative",
        // Placed LAST because it closes the narrative: it is the only factor in
        // 12.9 that describes the shape of the whole retainer rather than a single
        // event, and CAG 12.16 frames it the same way ("whether counsel does take
        // an unusual share of the load on a case"). That is inherently a summation.
        //
        // It is NOT "how much did this weigh on me", and it must never be prompted
        // with "did anything need extra care?" — care is a separate, orthogonal
        // factor at 12.9(b)(i). Collecting care answers here makes the same facts
        // appear twice in the narrative, reading as padding or as double-counting
        // one fact to inflate the claim.
        //
        // It may legitimately be ABSENT. Per 12.16, where counsel was instructed
        // throughout there is little to claim, and a forced closing paragraph would
        // be thin, defensive, and would end the narrative on its weakest point.
        // Nothing here is required.
        optional_section: true,
        factor_description: "CAG 12.9(a): \"the extent to which the provider has carried out work without recourse to counsel, whether in relation to analysis and planning of the case, drafting or advocacy\". It also identifies this consideration: \"Another point may be that the fee-earner has identified or addressed evidential issues that might otherwise have incurred the time of an expert\".",
        // CAG 12.16, in the LAA's own words. Instructing counsel makes this claim
        // harder, not impossible — the previous version of the form read as binary.
        counsel_note: "Instructing counsel does not rule this out. CAG 12.16: \"That does not mean that a provider can never claim an enhancement where they have instructed counsel\" — though it \"may be more difficult for the provider to justify\". The fourth item below is not about counsel at all, so it can apply even where counsel ran the advocacy. If none of these fit, leave the whole section blank: the narrative closes perfectly well without it.",
        checkboxes: [
            { label: "Analysis and planning without counsel", key: "s2_resp_no_counsel_analysis", code: "RESP 01", explanation: true, origin: "independent", stem: "Across the case I carried… without counsel, which mattered because…", example: "e.g., The fee earner undertook case analysis and strategic planning, including [e.g., identifying key legal arguments / devising the evidential strategy], without recourse to counsel..." },
            { label: "Drafting without counsel", key: "s2_resp_no_counsel_drafting", code: "RESP 02", explanation: true, origin: "independent", stem: "I drafted… myself, which might otherwise have involved counsel because…", example: "e.g., Drafting of [e.g., a detailed Threshold Agreement / a nuanced position statement addressing multiple allegations] was handled entirely by the fee earner..." },
            { label: "Advocacy without counsel", key: "s2_resp_no_counsel_advocacy", code: "RESP 03", explanation: true, origin: "independent", stem: "I conducted the advocacy at… which might typically have been briefed because…", example: "e.g., The fee earner conducted advocacy at the [e.g., contested interim hearing / directions hearing involving complex legal argument] which might typically have been briefed to Counsel because..." },
            { label: "Addressed evidential issues that might otherwise have needed an expert", key: "s2_resp_addressed_expert_issues", code: "RESP 04", explanation: true, origin: "independent", stem: "I addressed… myself, which avoided…", example: "e.g., By meticulously [e.g., cross-referencing medical records with witness statements / researching technical financial data], the fee earner was able to address [specific expert/evidential issue] directly, thereby avoiding the need and cost of instructing a separate expert in..." },
            // The ONLY "other" added at Stage 2, on 6 August 2026. Four were
            // proposed — one per factor lacking one — and three were cut on the
            // ground that CAG 12.7 makes the *features* of a case non-exhaustive,
            // not the factors' own definitions. Efficiency is defined at
            // 12.9(b)(iii) by its outcome ("claiming less time or less in
            // disbursements"), with "whether because of… or because of…" already
            // covering any cause; novelty at 12.9(c)(i) simply *is* "a novel point
            // of law or legal context"; weight at 12.9(c)(ii) has both of its
            // halves on the page. An "other" in any of those is outside the factor
            // as the LAA wrote it, and would collect the padding this file warns
            // about twenty lines above.
            //
            // Responsibility is different, and 12.9(a) says so in its own
            // construction: "one consideration will be… Another point may be" —
            // expressly open-ended. It is also the one factor with no Stage 1 route
            // into it, so a solicitor who carried an unusual share of the load in a
            // way none of the four items describes has nowhere else to say it.
            // Simon's decision, 6 August 2026, choosing the narrowest of three
            // options put to him.
            { label: "Responsibility accepted in some other way", key: "s2_resp_other", code: "RESP 05", explanation: true, origin: "independent", stem: "I carried… and the responsibility mattered because…", example: "e.g., Identify the work or decision the fee earner was responsible for, say how that responsibility came to rest with them rather than with counsel or a colleague, and explain what turned on it. CAG 12.16 frames this as \"an unusual share of the load\" — so say what made the share unusual. Ordinary conduct of a case is not this factor." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    }
];

// --- LEGACY LABEL ALIASES ----------------------------------------------------
//
// WHY THIS EXISTS. `_narrator/extract.py` reads a submitted summary — .docx
// since v1.13, PDF for every earlier matter — and matches each
// ticked criterion by its LABEL TEXT, using `templates.label_to_key_lookup()`,
// which is built from QUESTION_BLOCKS above. Since commit 2ba3adb a label that
// matches nothing stops the run rather than being silently dropped — deliberately,
// because silently dropping a factor loses part of the solicitor's claim.
//
// The v1.11 redesign reworded every Stage 1 and Stage 2 label. Without this map,
// every PDF generated before v1.11 — including any already sitting in a live matter
// — would fail to extract and the narrator would refuse to run on it. `_PLAN.md`
// records keeping those PDFs working as non-negotiable.
//
// Each entry maps a PRE-v1.11 label string to the key it had at the time. The
// retired keys are still present in NARRATIVE_TEMPLATES, so an old PDF renders
// exactly as it would have done when it was produced. Nothing here is offered to
// new users.
//
// DO NOT EDIT these strings to match current wording — they are historical records
// of what was printed on documents that already exist. Add to this map whenever a
// live label changes; never rewrite an existing entry.
const LEGACY_LABEL_ALIASES = {
    // Stage 1 — pre-v1.11 wording
    "Unusually detailed knowledge demonstrated": "s1_cse_detailed_knowledge",
    "Unusual/difficult legal argument skilfully pursued": "s1_cse_difficult_argument",
    "Unusual skill in marshalling evidence": "s1_cse_marshalling_evidence",
    "Particularly effective tactic identified/implemented": "s1_cse_effective_tactic",
    "Work completed in significantly less time": "s1_cse_less_time",
    "Better result achieved than usually expected": "s1_cse_better_result",
    "Exceptional skill with vulnerable client": "s1_cse_vulnerable_client",
    "Case proactively pursued (e.g., rapid re-housing, injunction)": "s1_speed_proactive_pursuit",
    "Substantial work at very short notice for urgent deadlines": "s1_speed_urgent_deadlines",
    "Complex legal issues arose": "s1_circ_legal_issues",
    "Complex questions of expert evidence": "s1_circ_expert_evidence",
    "Significant other evidential issues": "s1_circ_evidential_issues",
    "Difficulty in taking instructions (client/witnesses)": "s1_circ_difficult_instructions",
    "Exceptional impact of issues on client (liberty, housing etc.)": "s1_circ_client_impact",
    "Substantial and unavoidable out-of-hours work": "s1_circ_out_of_hours",
    "Novel points of law or unique factual matrix": "s1_circ_novelty",
    "Exceptional weight (documentation volume / number of issues)": "s1_circ_weight_volume",
    // Stage 2 — pre-v1.11 wording
    "Significant analysis/planning without Counsel": "s2_resp_no_counsel_analysis",
    "Complex drafting without Counsel": "s2_resp_no_counsel_drafting",
    "Advocacy undertaken without Counsel": "s2_resp_no_counsel_advocacy",
    "Addressed expert/evidential issues (reducing expert/Counsel need)": "s2_resp_addressed_expert_issues",
    "Exceptional care/skill in case management/presentation": "s2_cse_care_skill",
    "Particular care with vulnerable client": "s2_cse_care_vulnerable_client",
    "Work conducted with exceptional speed (as per Stage 1)": "s2_cse_speed",
    "Exceptional economy (less time/disbursements claimed)": "s2_cse_economy_efficiency",
    "Novel points of law or legal context (as per Stage 1)": "s2_nwc_novelty_law",
    "Exceptional weight (docs/issues) (as per Stage 1)": "s2_nwc_weight_docs_issues",
    "Overall complexity was exceptional (as per Stage 1)": "s2_nwc_complexity_overall",
    // v1.11 wording replaced after citation/bias review. These remain extraction
    // contracts for PDFs generated between the redesign and this correction.
    "Applied unusually detailed knowledge of the law or procedure relevant to this case": "s1_cse_detailed_knowledge",
    "Adopted a particularly effective tactic, or obtained a better result than would usually be expected": "s1_cse_effective_tactic_or_better_result_legacy",
    "Completed the work in materially less time than a reasonable fee earner would ordinarily have required": "s1_cse_less_time",
    "The case required substantial out-of-hours work in exceptional circumstances": "s1_circ_out_of_hours",
    "Particularly effective tactic, or a better result than usually expected": "s2_care_effective_tactic_or_better_result_legacy",
    "A novel point of law or legal context": "s2_novelty_difficult_argument",
    "The case was of exceptional importance to the client": "s2_weight_client_importance",
    "Exceptional volume of documentation, material or issues": "s2_weight_volume",
    "Exceptionally complex legal, expert or evidential issues": "s2_complexity_legal_issues",
    "Exceptional difficulty in taking instructions": "s2_complexity_difficult_instructions",
    "Significant analysis and planning without counsel": "s2_resp_no_counsel_analysis",
    "Complex drafting without counsel": "s2_resp_no_counsel_drafting",
    // Panel membership. The parenthetical was dropped on 5 August 2026: it
    // enforced a condition from the *2013* Family Specification (para 7.24(b),
    // limiting the Children Panel to work "under a Certificate which includes
    // proceedings relating to children"), which was removed in the 2018 rules
    // and is absent from the operative 2024 rules (para 7.24(c) names the scheme
    // with no qualifier). Every PDF produced before that date still carries the
    // long label, so this alias is the only thing keeping those matters
    // extractable. Panel keys render through the umbrella `panel_membership`
    // template rather than one of their own — templates.py allows that.
    "Fee earner is on Law Society Children Panel (and work relates to children)": "panel_membership_children"
};


// --- HELP TEXTS (Markdown format) ---
const MAIN_HELP_TEXT_MARKDOWN = `
# Understanding LAA Enhancements

This tool helps solicitors provide structured information for claiming an enhancement (uplift) on hourly rates in Legal Aid Agency (LAA) family cases. Enhancements are for work that is **exceptional.**


**Contents:**
*   How This Tool Works & Data Privacy
*   When to Consider an Enhancement Claim
*   The LAA's Two-Stage Process for Enhancements
    *   Stage 1: Threshold Test
    *   Stage 2: Determining the Level of Enhancement
*   Maximum Enhancement Percentages
*   Family Panel Membership
*   How the Percentage is Applied (by the LAA)
*   Using this Tool
*   Acronyms & Key Terms

## How This Tool Works & Data Privacy
This tool is a client-side web application. All data entered by the User is processed locally within the User's web browser.
*   No data entered into the Tool is automatically transmitted to Woodruff Billing Ltd. or any third party via the internet by the Tool itself.
*   The User is solely responsible for saving the Word summary (.docx) generated by the Tool and for the secure handling and transmission of this document to Woodruff Billing Ltd.


## When to Consider an Enhancement Claim
LAA enhancements are not designed for every legally aided family case. CAG 12.8 says "the case must be viewed as exceptional in one of the ways referred to in Paragraph 6.13 of the Specification". It gives the comparison as "with the generality of legally aided proceedings to which the prescribed rates apply" and says: "‘Exceptional’ has its normal meaning of “unusual” or “out of the ordinary”, hence more than simply above the average." CAG 12.11 adds that the comparison is "not solely with cases within the same category of law (in non-family cases) or with cases of the same type of proceedings".

Before using this tool, critically assess if the case truly stands out due to:
*   Exceptional Competence, Skill, or Expertise
*   Exceptional Speed
*   Exceptional Circumstances or Complexity

Routine difficulties or standard complexities inherent in many family law cases will not typically meet the 'exceptional' threshold. Use this tool to record the facts relied on for the threshold test and the factors relied on for the amount claimed.

This tool helps solicitors provide structured information for claiming an enhancement (uplift) on hourly rates in Legal Aid Agency (LAA) family cases. Enhancements are for work that is **exceptional.**


## The LAA's Two-Stage Process for Enhancements:

### Stage 1: Threshold Test (CAG Section 12.4)
First, the work must meet **at least ONE** of these primary criteria — unless the fee earner is on one of the three family panels, in which case the threshold is deemed satisfied for their own work and the tool will let you through without one (see below).

Panel membership sits outside that test. A guaranteed minimum of 15% is payable for work carried out by a fee-earner on one of the three panels (CAG 12.20) — though **not** for supervision, and not for work done by other fee-earners (CAG 12.22). It is a floor rather than an addition: it is not payable on top of a general enhancement (CAG 12.23), so this tool is about whether the case justifies more than 15%.

Spec Para 7.23(a) also deems the Paragraph 6.13 threshold satisfied for that fee-earner's own work. **The tool relies on that**: a panel member who ticks nothing at Stage 1 may still go on to Stage 2 and build a claim above 15%, resting the threshold on 7.23(a) rather than on any factor. It will say so on the face of the summary document and in the narrative, naming the fee earner, because the deeming reaches only their work and CAG 12.22 requires the narrative to state whose claim it is.

Do that with your eyes open. Nothing then supports the claim except Stage 2, and an assessor who reads exceptional complexity at Stage 2 will ask why limb (c) was not claimed at Stage 1. If a threshold factor genuinely applies, tick it.

Tick whichever factors apply. Stage 1 is tick-only; explanations are collected at Stage 2, where they count. The three headings are the limbs of Spec Para 6.13 — they group the factors and are not themselves tickable.

Fifteen of the factors are the guidance's own examples, and CAG 12.7 says they are **not** an exhaustive list. Each limb therefore ends with an "in some other way" option, which claims the limb itself rather than one of the examples. Tick one of those only where the limb genuinely applies and none of the examples fits — you will have to say what it was at Stage 2, and the form will not produce a summary until you do.

1.  **Exceptional competence, skill, or expertise:**
    *   The fee earner demonstrates unusually detailed knowledge.
    *   Skilfully pursues an unusual or difficult legal argument.
    *   Shows unusual skill in marshalling evidence.
    *   Identifies a particularly effective tactic.
    *   Completes work in less time than expected.
    *   Achieves a better result than usually expected.
    *   Shows exceptional skill with a vulnerable client (e.g., child, serious mental illness, learning disabilities).
    *(LAA Costs Assessment Guidance (CAG) Section 12.8(a))*

2.  **Exceptional speed:**
    *   The fee earner proactively pursues the case to a swift resolution (e.g., obtaining re-housing, injunctions).
    *   Undertakes substantial work at short notice due to urgent deadlines (e.g., deportation, urgent hearings).
    *(CAG Section 12.8(b))*

3.  **Exceptional circumstances or complexity:**
    *   This can include: complex legal, expert or other evidential issues; difficulty taking instructions; the nature of issues affecting the client (such as liberty, the right to remain, housing, domestic abuse or avoiding destitution); or substantial out-of-hours work.
    *(CAG Section 12.8(c))*

---
### Stage 2: Determining the Level of Enhancement (CAG Section 12.5 & 12.9)
Once the Stage 1 threshold test is satisfied — by ticking at least one Stage 1 factor, or by panel membership under Spec Para 7.23(a) — these Stage 2 sections allow you to detail the factors relevant to the *amount* of enhancement claimed. Provide an explanation for each selected Stage 2 factor.

1.  **Degree of responsibility accepted by the fee earner:**
    *   Extent of work done without recourse to Counsel (e.g., analysis, planning, drafting, advocacy).
    *   Addressing evidential issues that might otherwise have incurred the time of an expert.
    *(CAG Section 12.9(a))*

2.  **Care, speed, and economy:**
    *   **Care:** Skill in doing work, particular care shown to vulnerable clients.
    *   **Speed:** As in Stage 1.
    *   **Economy/Efficiency:** A reward for claiming less time or disbursements due to effective work or good planning.
    *(CAG Section 12.9(b))*

3.  **Novelty, weight, and complexity of the case:**
    *   These are separate factors relevant to the *amount* of uplift. At Stage 2, record any novel point of law or legal context, the volume or importance giving the case weight, and the complexity relied on.
    *(CAG Section 12.9(c))*

---
## Maximum Enhancement Percentages (Spec 7.22 / CAG Section 12.2):
*   **Up to 50%** for most cases (e.g., Family Court, County Court).
*   **Up to 100%** for cases in the High Court, Court of Appeal, or Supreme Court (Spec 7.22 — the Family rule; CAG 12.2's general list also names the Upper Tribunal, which does not hear family proceedings).

## Family Panel Membership (CAG Section 12.20-12.23):
*   A **guaranteed minimum enhancement of 15%** may be applicable (if fee earner name provided & panel selected) for work by fee earners on specific Law Society or Resolution panels.
*   This is a *minimum*; if the general criteria above justify a higher percentage, that higher percentage would be claimed. It is **NOT** in addition to an enhancement claimed under the general criteria.

## How the Percentage is Applied (by the LAA):
Once the threshold is met, the CAG 12.9 factors determine the amount of enhancement. CAG 12.10 says higher levels are likely where more factors are present or where any factor is strongly present; a maximum enhancement can be payable on the basis of one particularly strong factor alone.

---
## Using this Tool:
1.  Complete **Page 1: Case Details & Panel Membership**.
2.  Proceed to **Page 2: Stage 1 - Threshold Test**. Tick whichever factors apply. The three category headings are not tickable. Stage 1 is tick-only — no explanations here.
3.  If the Stage 1 threshold is met, you will proceed to **Page 3: Stage 2 - Level of Enhancement**. Provide explanations for each factor selected.
4.  On **Page 4: Statement Review**, review your selections and explanations.
5.  Proceed to **Page 5: Finalise & Download**. Enter your **Proposed Uplift %**.
6.  Click **"Download Word Summary"**. The downloaded Word document (.docx) should be sent to Woodruff Billing Ltd.
7.  The "Download Word Summary" button will only be enabled if the mandatory case details and required Stage 2 explanations are provided.

## Acronyms & Key Terms <!-- ADDED SECTION -->

> **Acronyms**
>
> LAA CAG - refers to the Legal Aid Agency's Costs Assessment Guidance.
>
> Spec - refers to the 2024 Standard Civil Contract Specification.

`;

const UPLIFT_PERCENTAGE_GUIDANCE_TEXT = `
# Guidance on Determining Your Proposed Uplift Percentage

**How the tool now works.** Earlier versions displayed a percentage calculated from selected boxes. That calculation has been removed. Stage 1 selections determine only whether the threshold is met; Stage 2 records the factors relevant to the amount; and the proposed percentage is entered by the user.

Sections labelled **Quoted guidance** reproduce words from the LAA's Costs Assessment Guidance. Sections labelled **Drafting note** explain how this form uses that guidance; they are editorial advice, not quotations from the LAA.

### 1. What the ceiling actually is (CAG 12.2)

   **Quoted guidance:** CAG 12.2 says: "The Specification provides a fixed level of remuneration that may be increased by up to 50%. The rates may be increased potentially by up to 100% in High Court, Upper Tribunal, Court of Appeal or Supreme Court cases."

   **Drafting note:**

   *   Up to **50%** in proceedings below the High Court — this includes the Family Court and the County Court.
   *   Up to **100%** in the **High Court, Court of Appeal or Supreme Court**. The quotation above also names the Upper Tribunal because CAG 12.2 tracks the general Specification rule (6.16); the Family rule, Spec 7.22, omits it, the contract governs family work, and family proceedings are not heard there — so this form does not offer it.
   *   Check which applies before you decide. If your case was in one of those higher courts, your ceiling is 100%, not 50%.
   *   The 50% and 100% figures are caps, not targets, and they are the **only** enhancement percentages in Section 12 apart from the 15% panel minimum. The guidance publishes no bands, no ladder and no scale of any kind.

### 2. You do not need every factor (CAG 12.10)

   **Quoted guidance:**

   > "Enhancement is likely to be allowed at higher levels where more of the above seven factors are present in the case and where any of the factors are strongly present."

   and, in the same paragraph:

   > "A maximum enhancement could be payable on the basis of one factor alone where it is particularly strong."

   **Drafting note:** A single particularly strong factor can support a maximum enhancement; a claim can also rely on a greater number of factors. The guidance does not require several factors to be strongly present.

### 3. What you are comparing against (CAG 12.8 and 12.11)

   **Quoted guidance:** CAG 12.8 gives the comparison as:

   > "with the generality of legally aided proceedings to which the prescribed rates apply"

   and CAG 12.11 expressly rejects the narrower comparison:

   > "the comparison is to be made with other proceedings for which legal aid is available, not solely with cases within the same category of law (in non-family cases) or with cases of the same type of proceedings"

   On the threshold itself, CAG 12.8 says: "‘Exceptional’ has its normal meaning of “unusual” or “out of the ordinary”, hence more than simply above the average."

   **Drafting note:** Apply the published comparison, rather than comparing only with other family cases or with work normal for a fee earner at the same level.

### 4. Panel membership (CAG 12.20 to 12.23)

   **Quoted guidance:**

   > "A guaranteed minimum enhancement of 15% is payable in respect of work carried out by a fee-earner on the Resolution Accredited Specialist Panel, the Law Society’s Children Panel or the Law Society Family Law Panel Advanced."

   CAG 12.21 sets out how widely it applies:

   > "Where the fee-earner is a member of the accredited specialist panel of Resolution, the Law Society Children Panel or the Law Society Panel Advanced, the enhancement is applied to all work done in any family case."

   CAG 12.22 sets the two limits on it:

   > "The minimum guaranteed enhancement is not available for supervision or to work done by other fee-earners. When preparing the bill for assessment, the narrative must clearly state the fee-earner for whom the enhancement is claimed and the basis for the enhancement."

   CAG 12.23 also says:

   > "As indicated in paragraph 12.3 above, the Panel Membership enhancement is a guaranteed minimum enhancement, and is not payable in addition to any enhancement allowed under the general Specification."

   **Drafting note:**

   *   Treat the 15% as a minimum, not an additional bonus.
   *   The useful way to think about it: **the panel member's own work already carries 15%. This tool is about whether the case justifies more.** It does not carry it for supervision, or for work done by anyone not on a panel (12.22) — so it is a floor under part of the bill, not all of it.
   *   The panel question is still asked because CAG 12.22 requires the bill narrative to "clearly state the fee-earner for whom the enhancement is claimed and the basis for the enhancement".
   *   **It applies to all work done in any family case** (12.21). Do not narrow it yourself — there is no requirement that the work fall "within the scope of" the accreditation, and none that Children Panel work relate to children. That condition was a term of the *2013* Family Specification; it was dropped in 2018 and is absent from the operative 2024 Family Category Specific Rules, which name the scheme with no qualifier at all (para 7.24(c)). This tool asserted it until 5 August 2026.

### 5. Each claim stands on its own facts (CAG 12.11)

   **Quoted guidance:**

   > "Each claim must be considered on its own facts."

   **Drafting note:** Section 12 does not provide a tariff or percentage bands. Use Stage 2 to record the specific facts relied on for each selected factor: what happened, why the work was necessary, and what followed.
`;

// --- CONTEXTUAL HELP TEXTS ---
const CONTEXTUAL_HELP_TEXTS = {
    matterTypeHelp: {
        title: "Help: Matter Type",
        content: `
Select the primary category of legally aided work this uplift data capture relates to.
This helps categorize the work for internal processing and can sometimes influence how enhancement arguments are framed. Examples:

*   **Care & Supervision:** Public law Children Act proceedings instigated by the Local Authority (s.31 CA89).
*   **Care & Supervision - High Court:** As above, but where the proceedings are heard in the High Court.
*   **Other Public Law:** Includes applications like Emergency Protection Orders, Secure Accommodation Orders, or other public law children matters not under s.31 (e.g., adoption related to care).
*   **Private Law Family:** Disputes between private individuals concerning children (e.g., Child Arrangements Orders for contact/residence, Specific Issue, Prohibited Steps).
*   **Private Law Finance:** Financial remedy proceedings ancillary to divorce/dissolution of civil partnership, or Schedule 1 Children Act financial provision claims.
*   **Domestic Abuse:** Applications for Non-Molestation Orders or Occupation Orders under the Family Law Act 1996.
*   **Adoption / Placement (Post 01/10/07):** Specific to adoption proceedings or placement orders made after this date.
*   **Other Public Law - High Court:** As "Other Public Law" but heard in the High Court.

If unsure, select the closest match or consult Woodruff Billing Ltd.
        `
    },
    finalUpliftHelp: {
        title: "Help: Proposed Uplift Percentage",
        content: UPLIFT_PERCENTAGE_GUIDANCE_TEXT // Reuses the detailed uplift guidance
    },
    persuasiveArgumentsHelp: {
        title: "Help: Crafting Persuasive Uplift Arguments",
        content: `
### Key Principles for Persuasive Arguments:

*   **Be Specific:** Avoid generic statements. Quantify where possible (e.g., "reviewed 500 pages of evidence," "hearing lasted 3 hours longer than scheduled," "researched obscure 19th-century case law for 2 hours").
*   **Link Directly to LAA Criteria:** Explicitly state which LAA criterion (e.g., "exceptional competence," "unusual complexity," "degree of responsibility") your point supports. Refer to specific sub-points if applicable.
*   **Focus on 'Exceptional':** Clearly explain *why* the work undertaken, or the circumstances faced, were "unusual" or "out of the ordinary" — CAG 12.8's own test — measured against "the generality of legally aided proceedings to which the prescribed rates apply". Do **not** measure it against what is normal for a fee earner of your level, or against other cases of this type: CAG 12.11 rejects that comparison, and it is the comparison under which genuinely hard work looks ordinary. What made this case stand out from legally aided work as a whole?
*   **Show, Don't Just Tell:** Provide concrete examples and details of the skill, complexity, speed, or responsibility. Instead of "complex legal issues," state "complex legal issues regarding the interplay of international relocation conventions and domestic wardship."
*   **Detail the Impact:** Describe how the exceptional work, skill, or circumstance positively impacted the case outcome, the client's position, or the efficiency of proceedings.
*   **Brevity and Clarity:** Be concise but ensure all necessary justifying details are present. Use clear, professional language. Avoid jargon where simpler terms suffice.
*   **Consistency and Evidence:** Ensure your explanations are consistent with the evidence available on the case file. The narrative here flags points for the detailed LAA submission, which will be cross-referenced with file notes.
*   **Cumulative Effect:** If multiple factors apply, briefly note how they compounded the exceptional nature of the work.
        `
    }
};

const TERMS_AND_CONDITIONS_MARKDOWN = `
**Terms & Conditions of Use: Woodruff Billing Ltd. Uplift Justification Collator**

1.  **Purpose & Intended Use:** This Uplift Justification Collator tool ("the Tool") is provided by Woodruff Billing Ltd. for the exclusive use of its solicitor clients ("Users"). The Tool is designed to assist Users in structuring information and justifications for claiming enhancements on hourly rates in legally aided family law cases for submission to Woodruff Billing Ltd.

2.  **Data Handling & Privacy:**
    *   The Tool is a client-side web application. All data entered by the User is processed locally within the User's web browser.
    *   No data entered into the Tool is automatically transmitted to Woodruff Billing Ltd. or any third party via the internet by the Tool itself.
    *   The User is solely responsible for saving the Word summary (.docx) generated by the Tool and for the secure handling and transmission of this document to Woodruff Billing Ltd.

3.  **Accuracy of Information:**
    *   The User is solely responsible for the accuracy, completeness, and veracity of all information and justifications entered into the Tool and subsequently provided to Woodruff Billing Ltd. via the generated document.
    *   Woodruff Billing Ltd. relies on the information provided by the User and is not responsible for verifying the accuracy of User-supplied data at the input stage through this Tool.

4.  **Proposed Uplift Percentage:** The Tool does not calculate or suggest a percentage. The User enters a proposed percentage after completing the threshold and level-of-enhancement sections. The final percentage claimed will be determined by Woodruff Billing Ltd. after reviewing the case and the information provided.

5.  **Output (Word Summary):** The Word summary generated by the Tool is a collation of the User's inputs. This document will be used by Woodruff Billing Ltd. as a basis for preparing the detailed LAA narrative for the enhancement claim.

6.  **No Guarantee of Outcome:** Use of this Tool does not guarantee a successful enhancement claim or any specific level of uplift. All claims are subject to assessment by the LAA according to their current guidance and regulations.

7.  **Intellectual Property:** This Tool is the property of Woodruff Billing Ltd.

8.  **Limitation of Liability:** Woodruff Billing Ltd. shall not be liable for any errors or omissions in the information entered by the User.

9.  **Acceptance of Terms:** By using this Tool, Users agree to these Terms & Conditions.

*${LAA_GUIDE_VERSION_INFO_CONST}*
`;
