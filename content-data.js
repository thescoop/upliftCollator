// --- content-data.js ---
// This file stores the static data for the LAA Uplift Data Capture Web Application.

// Version Information
const APP_VERSION = "1.11";
const APP_RELEASE_DATE = "4 August 2026";
const APP_NAME = "Uplift Collator";

const LAA_GUIDE_URL = "https://assets.publishing.service.gov.uk/media/66f13cfa76558d051527abb9/Costs_Assessment_Guidance_2024_SCC_-_Version_1a-_23_September_2024.pdf";
const LAA_GUIDE_VERSION_INFO_CONST = "Based on LAA Costs Assessment Guidance (Version 1a, 23 September 2024)";
const LAA_PUBLICATIONS_PAGE_URL = "https://www.gov.uk/government/collections/legal-aid-guidance-for-professionals";
const LOGO_BASE64 = "data:image/png;base64,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";


// Passwords for the welcome screen (normalized: lowercase, no spaces)
const ACCEPTABLE_PASSWORDS_NORMALIZED = [
    "westpier", // for "West Pier" or "WestPier"
    "goodlaw"   // for "Goodlaw"
    // Add more acceptable normalized passwords here, e.g., "anotherpassword"
];

// const LOGO_BASE64 = "data:image/png;base64, ... [YOUR ACTUAL BASE64 STRING HERE] ... ";
// IMPORTANT: Make sure you have the actual LOGO_BASE64 constant defined in your file
// if you need it for the PDF generation, even though I'm not outputting the long string here.
// The script.js for PDF generation will look for this constant.

// --- NARRATIVE TEMPLATES (For Woodruff Billing's internal narrative compilation from solicitor's PDF data) ---
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
// all thirteen strings. CAG 12.7, verbatim.
const WHAT_COUNTS_CAVEAT = "CAG 12.7: \"In neither case can an exhaustive list of features of a case be identified that will demonstrate the presence of these factors, and each claim must be considered on its own merits\". These examples are the guidance's own. They are not a complete list, and your case does not have to match one of them.";

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
                explanation: false,
                stage2_factor: "care",
                what_counts: "CAG 12.8(a) gives this example: \"the fee-earner demonstrates unusually detailed knowledge relevant to the case\"."
            },
            {
                label: "Pursued an unusual or difficult legal argument",
                key: "s1_cse_difficult_argument",
                explanation: false,
                stage2_factor: "novelty",
                what_counts: "CAG 12.8(a) gives this example: \"skilfully pursues an unusual or difficult legal argument\". At Stage 2, the solicitor's explanation must address whether this involved a novel point of law or legal context."
            },
            {
                label: "Identified and marshalled evidence with unusual skill",
                key: "s1_cse_marshalling_evidence",
                explanation: false,
                stage2_factor: "care",
                what_counts: "CAG 12.8(a) includes \"unusual skill in identifying and marshalling evidence in pursuing or defending a case\"."
            },
            {
                label: "Adopted a particularly effective tactic",
                key: "s1_cse_effective_tactic",
                explanation: false,
                stage2_factor: "care",
                what_counts: "CAG 12.8(a) gives this example: \"identifying a particularly effective tactic on behalf of the client\"."
            },
            {
                label: "Obtained a better result than might usually have been expected",
                key: "s1_cse_better_result_current",
                explanation: false,
                stage2_factor: "care",
                what_counts: "CAG 12.8(a) says the provider \"may have conducted the case so well that the client has received a better result than might usually have been expected\"."
            },
            {
                label: "Required less time than expected of a notional reasonable fee-earner",
                key: "s1_cse_less_time",
                explanation: false,
                stage2_factor: "efficiency",
                what_counts: "CAG 12.8(a): enhancement \"may be indicated under this heading where the provider has carried out the case or particular work in a way that has required less time than would have been expected of a notional reasonable fee-earner\"."
            },
            {
                label: "Took instructions from and effectively represented a child, a seriously mentally unwell client, or another very vulnerable client",
                key: "s1_cse_vulnerable_client",
                explanation: false,
                stage2_factor: "care",
                what_counts: "CAG 12.8(a): \"Another example of unusual skill may be taking instructions and providing effective representation for a client who is a child, is seriously mentally ill or is otherwise very vulnerable.\""
            },
            // The "other" option, added 5 August 2026. See the note above
            // LIMB_OTHER_RATIONALE below for why all three exist.
            {
                label: "The work showed exceptional competence, skill or expertise in some other way",
                key: "s1_cse_other",
                explanation: false,
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
                explanation: false,
                stage2_factor: "speed",
                what_counts: "CAG 12.8(b): enhancement may arise \"where the fee-earner has proactively pursued a case, for example in obtaining with unusual speed rehousing, community care support, receipt of welfare benefits, an injunction, release from mental health detention or other resolution of the client’s problem\"."
            },
            {
                label: "Carried out substantial work at short notice to meet an urgent deadline or hearing",
                key: "s1_speed_urgent_deadlines",
                explanation: false,
                stage2_factor: "speed",
                what_counts: "CAG 12.8(b): it \"may also be justified if the fee-earner carries out substantial work at short notice because of urgent deadlines\"."
            },
            {
                label: "The work was done with exceptional speed in some other way",
                key: "s1_speed_other",
                explanation: false,
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
        // 6.13), so 12.4 governs. Novelty and weight are developed as Stage 2
        // considerations at 12.9(c) and are collected there. Confirmed with Simon
        // on 4 August 2026: he has never seen a claim pass the threshold on
        // documentary weight or novelty alone.
        title: "Threshold limb (c): exceptional circumstances or complexity",
        main_question_text: "Did the case involve exceptional circumstances or complexity?",
        main_toggle_id: "s1_circumstances_main_toggle",
        narrative_header_key: "s1_exceptional_circumstances_complexity_header_narrative",
        cag_citation: "CAG 12.8(c) / Spec 6.13(c)",
        checkboxes: [
            {
                label: "The legal, expert or other evidential issues were exceptionally complex",
                key: "s1_circ_legal_issues",
                explanation: false,
                stage2_factor: "complexity",
                what_counts: "CAG 12.8(c): \"Complexity may relate to legal issues, questions of expert evidence or other evidential issues, for instance seeking or challenging witness evidence in possession proceedings based on allegations of nuisance.\""
            },
            {
                label: "Taking instructions from the client or other witnesses was exceptionally difficult",
                key: "s1_circ_difficult_instructions",
                explanation: false,
                stage2_factor: "complexity",
                what_counts: "CAG 12.8(c): complexity \"may also take into account difficulty in taking instructions from the client or other witnesses\"."
            },
            {
                label: "The issues affecting the client gave rise to exceptional circumstances",
                key: "s1_circ_client_impact",
                explanation: false,
                stage2_factor: "weight",
                what_counts: "CAG 12.8(c) includes \"the nature of the issues as they affect the client, such as liberty, right to remain in the country, the roof over the client’s head, addressing domestic abuse or avoiding destitution\". At Stage 2 this feeds weight, which CAG 12.9(c)(ii) says \"may also refer to the importance of the case to the client\"."
            },
            {
                label: "The case required substantial out-of-hours work",
                key: "s1_circ_out_of_hours",
                explanation: false,
                stage2_factor: "speed",
                what_counts: "CAG 12.8(c): \"A case requiring substantial out of hours work may also be considered to fall under this limb or particular work may be considered under 6.15(b) of the Specification\". This carries forward to speed at Stage 2."
            },
            {
                label: "The case involved exceptional circumstances or complexity in some other way",
                key: "s1_circ_other",
                explanation: false,
                stage2_factor: "complexity",
                what_counts: "The examples above are the guidance's own, and CAG 12.7 says they are not a complete list: \"in neither case can an exhaustive list of features of a case be identified that will demonstrate the presence of these factors, and each claim must be considered on its own merits\". The test you are asserting here is the limb itself — Spec Para 6.13(c), that the case involved exceptional circumstances or complexity. Tick this only if that is true and none of the examples above fits; you will be asked to say what it was at Stage 2."
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
            { label: "Unusually detailed knowledge applied", key: "s2_care_detailed_knowledge", explanation: true, carried_from: ["s1_cse_detailed_knowledge"], stem: "That knowledge mattered here because…", example: "e.g., An exceptional understanding of [obscure case law/specific local authority policy] regarding [topic] was crucial because..." },
            // Label deliberately NOT "Unusual skill in marshalling evidence" — that
            // exact string is a pre-v1.11 Stage 1 label in LEGACY_LABEL_ALIASES, and
            // label_to_key_lookup() raises on one label mapping to two keys.
            { label: "Evidence marshalled with unusual skill", key: "s2_care_marshalling_evidence", explanation: true, carried_from: ["s1_cse_marshalling_evidence"], stem: "The evidence required this skill because…", example: "e.g., The case required collating and analysing over [number] pages of [type of evidence, e.g., medical records/financial statements] to distil key facts about..." },
            { label: "Particularly effective tactic", key: "s2_care_effective_tactic", explanation: true, carried_from: ["s1_cse_effective_tactic"], stem: "The tactic adopted was… and it was particularly effective because…", example: "e.g., Instead of [standard approach], we strategically opted for [specific tactic, e.g., an early without prejudice offer / a specific type of application], which led to..." },
            { label: "Better result than might usually have been expected", key: "s2_care_better_result", explanation: true, carried_from: ["s1_cse_better_result_current"], stem: "The result obtained was… and the way the case was conducted contributed by…", example: "e.g., The client obtained [specific result], rather than [result that would usually have been expected], because the case was conducted by..." },
            { label: "Particular care with a vulnerable client", key: "s2_care_vulnerable_client", explanation: true, carried_from: ["s1_cse_vulnerable_client"], stem: "The client's circumstances required… and so the work involved…", example: "e.g., Dealing with a client who [specific vulnerability, e.g., had severe anxiety / was a non-English speaker requiring an interpreter for every meeting] necessitated [specific adaptations, e.g., shorter, more frequent meetings / using visual aids] to ensure effective instructions..." },
            // Carries the limb (a) "other". The stem does the work the fixed
            // labels do elsewhere: without it this box invites "the case was
            // very difficult", which asserts nothing an assessor can weigh.
            { label: "Exceptional competence, skill or expertise shown in some other way", key: "s2_care_other", explanation: true, carried_from: ["s1_cse_other"], stem: "What the fee earner did was… and what made it exceptional rather than merely competent was…", example: "e.g., Set out the specific thing done, and why it went beyond what a reasonable fee earner would ordinarily have done on a legally aided case — not why the case was hard, but what the fee earner brought to it." },
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
            { label: "Case proactively pursued to a rapid resolution", key: "s2_speed_proactive_pursuit", explanation: true, carried_from: ["s1_speed_proactive_pursuit"], stem: "The urgency arose because… and as a result…", example: "e.g., Given the imminent risk of [e.g., eviction/child removal], we proactively [action, e.g., issued an emergency application] within [timeframe, e.g., 24 hours of instruction], resulting in..." },
            { label: "Substantial work at short notice for an urgent deadline", key: "s2_speed_urgent_deadlines", explanation: true, carried_from: ["s1_speed_urgent_deadlines"], stem: "The deadline was… and meeting it required…", example: "e.g., Urgent instructions were received on [date] requiring [specific work, e.g., preparation for a short-notice hearing] by [deadline date/time] due to [reason for urgency], necessitating immediate and focused work..." },
            { label: "Substantial out-of-hours work", key: "s2_speed_out_of_hours", explanation: true, carried_from: ["s1_circ_out_of_hours"], stem: "The out-of-hours work was necessary because…", example: "e.g., Substantial work was unavoidably performed outside normal hours on [e.g., weekend of date / evenings of dates] to [reason, e.g., prepare for an emergency hearing / meet an unexpected court deadline]..." },
            { label: "Exceptional speed achieved in some other way", key: "s2_speed_other", explanation: true, carried_from: ["s1_speed_other"], stem: "The speed was exceptional because… and it was achieved by…", example: "e.g., Set out what was done, how quickly, and what the ordinary timescale would have been — the comparison is with legally aided proceedings generally, not with other family cases." },
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
            { label: "Less time or fewer disbursements claimed than might otherwise have been expected", key: "s2_efficiency_less_time", explanation: true, carried_from: ["s1_cse_less_time"], stem: "The time saved came from… and amounted to roughly…", example: "e.g., By [e.g., front-loading negotiations / proposing a streamlined directions timetable that was adopted by the court], the case was resolved more efficiently, likely saving [X hours / specific costs] compared to a more protracted approach, because..." },
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
            { label: "Unusual or difficult legal argument", key: "s2_novelty_difficult_argument", explanation: true, carried_from: ["s1_cse_difficult_argument"], stem: "The argument was… and any novelty in the point of law or legal context arose because…", example: "e.g., The argument concerned [specific issue]; the point of law or legal context was novel because..." },
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
        // Weight has TWO halves and only one of them is carried forward. CAG
        // 12.9(c)(ii) covers both "the volume of documentation, other material, or
        // the number of issues arising" AND "the importance of the case to the
        // client". The client-importance half arrives from Stage 1 label
        // s1_circ_client_impact; the volume half has no Stage 1 carrier, because
        // documentary weight is deliberately not a threshold label. So the volume
        // item must be offered independently or it can never be claimed at all.
        factor_description: "CAG 12.9(c)(ii): weight \"may refer to the volume of documentation, other material, or the number of issues arising\". It \"may also refer to the importance of the case to the client\".",
        checkboxes: [
            { label: "Importance of the case to the client", key: "s2_weight_client_importance", explanation: true, carried_from: ["s1_circ_client_impact"], stem: "What was at stake for the client was… and that meant…", example: "e.g., The proceedings affected the client's [e.g., fundamental right to family life / risk of homelessness], requiring..." },
            { label: "Volume of documentation, material or issues", key: "s2_weight_volume", explanation: true, origin: "independent", stem: "The volume was… and dealing with it required…", example: "e.g., The disclosure, exceeding [e.g., 10 lever arch files / 2000 pages], related to [type of documents] and required time to review and schedule for..." },
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
            { label: "Complexity relating to legal, expert or evidential issues", key: "s2_complexity_legal_issues", explanation: true, carried_from: ["s1_circ_legal_issues"], stem: "The complexity lay in… and dealing with it required…", example: "e.g., The case involved interplay between [legal area 1] and [legal area 2], specifically concerning [the difficult point of law], which required research into..." },
            { label: "Difficulty in taking instructions", key: "s2_complexity_difficult_instructions", explanation: true, carried_from: ["s1_circ_difficult_instructions"], stem: "Taking instructions was difficult because… and so…", example: "e.g., The client's [e.g., trauma / learning disability / distrust of authority] affected obtaining a coherent history and instructions, requiring multiple attendances and..." },
            { label: "Exceptional circumstances or complexity of some other kind", key: "s2_complexity_other", explanation: true, carried_from: ["s1_circ_other"], stem: "The circumstances were… and dealing with them required…", example: "e.g., Set out what the circumstances were and what they demanded of the fee earner. \"Exceptional\" has its normal meaning of unusual or out of the ordinary (CAG 12.8), so say what made this case unlike the run of legally aided work." },
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
            { label: "Analysis and planning without counsel", key: "s2_resp_no_counsel_analysis", explanation: true, origin: "independent", stem: "Across the case I carried… without counsel, which mattered because…", example: "e.g., The fee earner undertook case analysis and strategic planning, including [e.g., identifying key legal arguments / devising the evidential strategy], without recourse to counsel..." },
            { label: "Drafting without counsel", key: "s2_resp_no_counsel_drafting", explanation: true, origin: "independent", stem: "I drafted… myself, which might otherwise have involved counsel because…", example: "e.g., Drafting of [e.g., a detailed Threshold Agreement / a nuanced position statement addressing multiple allegations] was handled entirely by the fee earner..." },
            { label: "Advocacy without counsel", key: "s2_resp_no_counsel_advocacy", explanation: true, origin: "independent", stem: "I conducted the advocacy at… which might typically have been briefed because…", example: "e.g., The fee earner conducted advocacy at the [e.g., contested interim hearing / directions hearing involving complex legal argument] which might typically have been briefed to Counsel because..." },
            { label: "Addressed evidential issues that might otherwise have needed an expert", key: "s2_resp_addressed_expert_issues", explanation: true, origin: "independent", stem: "I addressed… myself, which avoided…", example: "e.g., By meticulously [e.g., cross-referencing medical records with witness statements / researching technical financial data], the fee earner was able to address [specific expert/evidential issue] directly, thereby avoiding the need and cost of instructing a separate expert in..." },
        ],
        columns_for_sub_options: 1,
        depends_on_threshold_met: true
    }
];

// --- LEGACY LABEL ALIASES ----------------------------------------------------
//
// WHY THIS EXISTS. `_narrator/extract.py` reads a submitted PDF and matches each
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
*   The User is solely responsible for saving the PDF summary generated by the Tool and for the secure handling and transmission of this PDF to Woodruff Billing Ltd.


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
First, the work must meet **at least ONE** of these primary criteria.

Panel membership sits outside that test. A guaranteed minimum of 15% is payable for work carried out by a fee-earner on one of the three panels (CAG 12.20) — though **not** for supervision, and not for work done by other fee-earners (CAG 12.22). Paragraph 7.23(a) of the 2024 Family Category Specific Rules also deems the Paragraph 6.13 threshold satisfied for that fee-earner's work. This tool nonetheless asks a panel member to tick at least one factor before it will build a claim above 15%. **That is how the tool is set up, not what the rules require.** If your case justifies more than 15% on responsibility or weight alone — neither of which has a Stage 1 equivalent — say so to Woodruff Billing directly rather than treating this form as the limit of what you can claim.

Tick whichever of the thirteen factors apply. Stage 1 is tick-only; explanations are collected at Stage 2, where they count. The three headings below are the limbs of Spec Para 6.13 — they group the factors and are not themselves tickable. The factors are the guidance's own examples and are **not** an exhaustive list (CAG 12.7).

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
If the Stage 1 threshold test is met by selecting at least one Stage 1 factor, these Stage 2 sections allow you to detail the factors relevant to the *amount* of enhancement claimed. Provide an explanation for each selected Stage 2 factor.

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
## Maximum Enhancement Percentages (CAG Section 12.2):
*   **Up to 50%** for most cases (e.g., Family Court, County Court).
*   **Up to 100%** for cases in the High Court, Upper Tribunal, Court of Appeal, or Supreme Court.

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
6.  Click **"Download PDF Summary"**. This PDF should be sent to Woodruff Billing Ltd.
7.  The "Download PDF Summary" button will only be enabled if the mandatory case details and required Stage 2 explanations are provided.

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
   *   Up to **100%** in the **High Court, Upper Tribunal, Court of Appeal or Supreme Court**.
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
    *   The User is solely responsible for saving the PDF summary generated by the Tool and for the secure handling and transmission of this PDF to Woodruff Billing Ltd.

3.  **Accuracy of Information:**
    *   The User is solely responsible for the accuracy, completeness, and veracity of all information and justifications entered into the Tool and subsequently provided to Woodruff Billing Ltd. via the generated PDF.
    *   Woodruff Billing Ltd. relies on the information provided by the User and is not responsible for verifying the accuracy of User-supplied data at the input stage through this Tool.

4.  **Proposed Uplift Percentage:** The Tool does not calculate or suggest a percentage. The User enters a proposed percentage after completing the threshold and level-of-enhancement sections. The final percentage claimed will be determined by Woodruff Billing Ltd. after reviewing the case and the information provided.

5.  **Output (PDF Summary):** The PDF summary generated by the Tool is a collation of the User's inputs. This PDF will be used by Woodruff Billing Ltd. as a basis for preparing the detailed LAA narrative for the enhancement claim.

6.  **No Guarantee of Outcome:** Use of this Tool does not guarantee a successful enhancement claim or any specific level of uplift. All claims are subject to assessment by the LAA according to their current guidance and regulations.

7.  **Intellectual Property:** This Tool is the property of Woodruff Billing Ltd.

8.  **Limitation of Liability:** Woodruff Billing Ltd. shall not be liable for any errors or omissions in the information entered by the User.

9.  **Acceptance of Terms:** By using this Tool, Users agree to these Terms & Conditions.

*${LAA_GUIDE_VERSION_INFO_CONST}*
`;
