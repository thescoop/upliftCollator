/**
 * Builds the .docx test fixtures with the REAL generator — the same
 * docx-summary.js the browser loads — and with labels, category titles and
 * version constants read live out of content-data.js, so what the Python
 * tests read is what the app ships. A hand-copied label here would go stale
 * the day the wording changed and the fixture would silently start testing a
 * document the app can no longer produce. Run from anywhere:
 *
 *     node _narrator/tests/build_docx_fixture.js
 *
 * Deterministic on purpose: fixed createdIso, fixed generated date, and the
 * generator's own fixed zip timestamp mean identical inputs give
 * byte-identical files, so a fixture diff in git always means the generator
 * or the data changed — never the clock.
 *
 * Three fixtures:
 *   sample.docx  — the ordinary route: panel, three Stage 1 ticks, two
 *                  evidenced Stage 2 factors, evidence confirmed.
 *   deemed.docx  — the deemed-threshold route: panel ticked, Stage 1 empty,
 *                  so the sentinel AND the deemed line are printed.
 *   nasty.docx   — adversarial input a solicitor could genuinely produce by
 *                  pasting: an explanation carrying current heading-looking
 *                  lines, tab-delimited detail/item rows, and a control
 *                  character. The paragraph contract must keep ALL of it
 *                  inert inside the explanation.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..', '..');
const FIXTURES = path.join(__dirname, 'fixtures');
const build = require(path.join(REPO, 'docx-summary.js'));

// content-data.js is a plain browser script with top-level consts, so they
// never land on the vm context's global. Appending an expression makes them
// the script's completion value, which runInContext returns.
const CONTENT = vm.runInContext(
    fs.readFileSync(path.join(REPO, 'content-data.js'), 'utf8') +
    '\n;({ QUESTION_BLOCKS, APP_VERSION, APP_NAME, APP_RELEASE_DATE, LAA_GUIDE_VERSION_INFO_CONST })',
    vm.createContext({})
);

// entry('s1_...') → {checked, label, code, categoryTitle} exactly as the form's
// syncFormDataFromDom records it from content-data.js.
function entry(key, explanation) {
    for (const block of CONTENT.QUESTION_BLOCKS) {
        for (const chk of (block.checkboxes || [])) {
            if (chk.key === key) {
                const e = { checked: true, label: chk.label, code: chk.code };
                if (block.page !== 1) {
                    e.categoryTitle = block.title;
                    e.explanation = explanation || '';
                }
                return e;
            }
        }
    }
    throw new Error('No such key in content-data.js: ' + key);
}

const META = {
    appName: CONTENT.APP_NAME,
    appVersion: CONTENT.APP_VERSION,
    appReleaseDate: CONTENT.APP_RELEASE_DATE,
    guideVersionInfo: CONTENT.LAA_GUIDE_VERSION_INFO_CONST,
    generatedDateText: '7 August 2026',
    createdIso: '2026-08-07T09:00:00Z'
};

function write(name, formData, metaOverrides) {
    const bytes = build(formData, { ...META, ...metaOverrides });
    const dest = path.join(FIXTURES, name);
    fs.writeFileSync(dest, Buffer.from(bytes));
    console.log('wrote', dest, bytes.length, 'bytes');
}

// ── sample.docx ────────────────────────────────────────────────────────────
write('sample.docx', {
    caseDetails: {
        feeEarnerName: 'Jane Doe',
        matterType: 'Public Law Children',
        caseMatterName: 'Re X (Local Authority care proceedings)',
        courtLevel: 'County Court'
    },
    panelMembership: {
        panel_membership_resolution: entry('panel_membership_resolution'),
        panel_membership_children: entry('panel_membership_children')
    },
    stage1: {
        s1_cse_detailed_knowledge: entry('s1_cse_detailed_knowledge'),
        s1_cse_marshalling_evidence: entry('s1_cse_marshalling_evidence'),
        s1_circ_legal_issues: entry('s1_circ_legal_issues')
    },
    stage2: {
        s2_care_vulnerable_client: entry('s2_care_vulnerable_client',
            'Client has diagnosed PTSD and a learning disability assessed at '
            + 'borderline range. Conducted instructions across six shorter '
            + 'attendances, used plain-language summaries, and brought an '
            + 'intermediary to the FHDRA.'),
        s2_resp_no_counsel_drafting: entry('s2_resp_no_counsel_drafting',
            'Drafted the full position statement, the Scott Schedule, and the '
            + 'section 7 response without recourse to Counsel, all settled in '
            + 'advance of the case management hearing.')
    },
    finalUpliftPercent: '75',
    evidenceOnFileConfirmed: true
}, {
    headerSubtitle: 'Uplift Justification  |  Re X (Local Authority care proceedings)',
    ceilingPercent: 50,
    thresholdSatisfied: true,
    thresholdDeemedOnly: false
});

// ── deemed.docx ────────────────────────────────────────────────────────────
write('deemed.docx', {
    caseDetails: {
        feeEarnerName: 'A. Panel-Member',
        matterType: 'Private Law Children',
        caseMatterName: 'Synthetic Deemed 0001',
        courtLevel: 'County Court'
    },
    panelMembership: {
        panel_membership_children: entry('panel_membership_children')
    },
    stage1: {},
    stage2: {
        s2_resp_no_counsel_drafting: entry('s2_resp_no_counsel_drafting',
            'Drafted every position statement and the final threshold document '
            + 'without recourse to counsel throughout the proceedings.')
    },
    finalUpliftPercent: '20',
    evidenceOnFileConfirmed: false
}, {
    headerSubtitle: 'Uplift Justification  |  Synthetic Deemed 0001',
    ceilingPercent: 50,
    thresholdSatisfied: true,
    thresholdDeemedOnly: true
});

// ── nasty.docx ─────────────────────────────────────────────────────────────
// The pasted block is exactly the kind of thing _PLAN.md's outstanding item 4
// recorded against the PDF format: a working note quoting a previous summary.
// Every line of it must come back inside the explanation, and none of it may
// act as structure. The \u000B (vertical tab) exercises the generator's XML cleaning; it
// must arrive as a space, not break the file.
const pastedBlock = [
    'From my working note of the previous summary:',
    'MATTER DETAIL',
    'Matter\tFake pasted matter',
    'STAGE 1 : Threshold route',
    'A01\t' + entry('s1_cse_detailed_knowledge').label,
    'STAGE 2 : Level of enhancement',
    'CARE 05\t' + entry('s2_care_vulnerable_client').label,
    'PROPOSED UPLIFT',
    'Solicitor’s proposed uplift\t95%',
    'EVIDENCE ON FILE : Confirmed',
    'The vertical\u000Btab above and this line complete the paste.'
].join('\n');

write('nasty.docx', {
    caseDetails: {
        feeEarnerName: 'C. Adversarial-Solicitor with an Unusually Long Name for Testing',
        matterType: 'Public Law Children',
        // A matter name that IMITATES the next detail field, the trap the PDF
        // reader needed its longest-run logic for. One paragraph per detail
        // makes it inert here, and the fixture proves that stays true.
        caseMatterName: 'In the High Court: Re X and Y (a very long synthetic matter name)',
        courtLevel: 'High Court'
    },
    panelMembership: {},
    stage1: {
        s1_cse_detailed_knowledge: entry('s1_cse_detailed_knowledge')
    },
    stage2: {
        s2_complexity_legal_issues: entry('s2_complexity_legal_issues', pastedBlock)
    },
    finalUpliftPercent: '40',
    evidenceOnFileConfirmed: false
}, {
    headerSubtitle: 'Uplift Justification  |  In the High Court Re X and Y (a very long syn',
    ceilingPercent: 100,
    thresholdSatisfied: true,
    thresholdDeemedOnly: false
});
