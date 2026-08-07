/**
 * The explanation paragraph is mandatory in the extraction grammar: the
 * parser consumes exactly one paragraph after every Stage 2 item row, so a
 * ticked factor with an empty explanation must still print a paragraph. The
 * app's wizard gate blocks empty explanations from reaching a download, but
 * the generator cannot assume its caller is the app (this fixture-style call
 * is itself the proof), so it emits the fixed sentinel
 * "No explanation was provided."; _narrator/extract_docx.py maps it back to
 * "". This test pins the generator half of that agreement, including the
 * deliberate collision: a solicitor who literally types the sentinel produces
 * byte-identical output and reads back as "" — accepted, because the typed
 * sentence asserts exactly the absence the empty string records.
 *
 *   node tests/test_empty_explanation.js
 */
'use strict';
const path = require('path');
const vm = require('vm');
const fs = require('fs');

const REPO = path.resolve(__dirname, '..');
const build = require(path.join(REPO, 'docx-summary.js'));
const fflate = require(path.join(REPO, 'vendor', 'fflate.umd.min.js'));
const CONTENT = vm.runInContext(
    fs.readFileSync(path.join(REPO, 'content-data.js'), 'utf8') +
    '\n;({ QUESTION_BLOCKS, APP_VERSION, APP_NAME, APP_RELEASE_DATE, LAA_GUIDE_VERSION_INFO_CONST })',
    vm.createContext({})
);

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
    throw new Error('no such key: ' + key);
}

const formData = {
    caseDetails: {
        feeEarnerName: 'Jane Doe', matterType: 'Public Law Children',
        caseMatterName: 'Empty Explanation 0001', courtLevel: 'County Court'
    },
    panelMembership: {},
    stage1: { s1_cse_detailed_knowledge: entry('s1_cse_detailed_knowledge') },
    stage2: {
        s2_care_vulnerable_client: entry('s2_care_vulnerable_client', ''),
        s2_resp_no_counsel_drafting: entry('s2_resp_no_counsel_drafting',
            'Drafted everything without counsel.')
    },
    finalUpliftPercent: '20',
    evidenceOnFileConfirmed: true
};
const meta = {
    appName: CONTENT.APP_NAME, appVersion: CONTENT.APP_VERSION,
    appReleaseDate: CONTENT.APP_RELEASE_DATE,
    guideVersionInfo: CONTENT.LAA_GUIDE_VERSION_INFO_CONST,
    generatedDateText: '7 August 2026', createdIso: '2026-08-07T09:00:00Z',
    ceilingPercent: 50, thresholdSatisfied: true, thresholdDeemedOnly: false
};

let failures = 0;
function check(name, ok, detail) {
    console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (ok ? '' : '  — ' + detail));
    if (!ok) failures += 1;
}

const bytes = build(formData, meta);
const parts = fflate.unzipSync(bytes);
const docXml = fflate.strFromU8(parts['word/document.xml']);

const SENTINEL = '>No explanation was provided.<';
const careRow = docXml.indexOf('CARE 05');
const respRow = docXml.indexOf('RESP 02');
const sentinelAt = docXml.indexOf(SENTINEL);

check('the empty explanation prints the sentinel paragraph',
    sentinelAt !== -1, 'sentinel text missing from document.xml');
check('the sentinel sits between the empty item row and the next row',
    careRow !== -1 && respRow !== -1 && careRow < sentinelAt && sentinelAt < respRow,
    `order was CARE@${careRow} sentinel@${sentinelAt} RESP@${respRow}`);
check('exactly one sentinel — the typed explanation is untouched',
    docXml.indexOf(SENTINEL, sentinelAt + 1) === -1
    && docXml.includes('>Drafted everything without counsel.<'),
    'sentinel duplicated or typed explanation missing');

// The deliberate collision, pinned: typing the sentinel is byte-identical to
// typing nothing, so the round trip to "" is a documented equivalence rather
// than an accident of string comparison.
const typedFormData = JSON.parse(JSON.stringify(formData));
typedFormData.stage2.s2_care_vulnerable_client.explanation = 'No explanation was provided.';
const typedBytes = build(typedFormData, meta);
check('a typed sentinel produces byte-identical output to an empty explanation',
    Buffer.compare(Buffer.from(bytes), Buffer.from(typedBytes)) === 0,
    'outputs differ — the collision is no longer total, revisit the parser mapping');

// If invoked with --emit <path>, write the docx for cross-language checks.
const emitAt = process.argv.indexOf('--emit');
if (emitAt !== -1 && process.argv[emitAt + 1]) {
    fs.writeFileSync(process.argv[emitAt + 1], Buffer.from(bytes));
    console.log('emitted', process.argv[emitAt + 1]);
}

process.exit(failures ? 1 : 0);
