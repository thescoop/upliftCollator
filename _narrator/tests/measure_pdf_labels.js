/**
 * Standalone width audit for every string the PDF prints as an extraction
 * contract, measured with the SAME jsPDF build the browser uses.
 *
 * Why this exists. jsPDF wraps at the column width and marks the continuation in
 * no way at all — no hyphen, no indent, nothing. `_narrator/extract.py` matches
 * Stage 1 and Stage 2 labels by exact string, so a label one point too long
 * silently becomes two lines that match nothing on the way back. That has caused
 * two production defects here. The worst: a Stage 1 label just long enough to
 * wrap meant that ANY claim ticking the vulnerable-client factor produced a PDF
 * the narrator then refused to process.
 *
 * `_resolve_wrapped_label` now rejoins across lines, so a wrap is recoverable —
 * but it is recoverable by a heuristic, and the cheap fix is not to wrap. Run
 * this whenever a label is added or reworded.
 *
 *     node _narrator/tests/measure_pdf_labels.js
 *
 * Geometry is read from script.js's own constants rather than restated, so a
 * change to the margin or body size cannot leave this measuring the wrong column.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const { jsPDF } = require(path.join(ROOT, 'vendor', 'jspdf.umd.min.js'));

function constantFromScript(name, fallback) {
    const src = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
    const m = src.match(new RegExp(`const\\s+${name}\\s*=\\s*(\\d+)`));
    if (!m) {
        throw new Error(
            `could not read ${name} out of script.js. If it was renamed, fix this ` +
            `audit rather than hardcoding the value — the point is that the two agree.`
        );
    }
    return Number(m[1]);
}

const doc = new jsPDF({ unit: 'pt', format: 'a4' });
const MARGIN = constantFromScript('margin');
const BODY = constantFromScript('bodySize');
const PAGE_W = doc.internal.pageSize.width;
const COLUMN = PAGE_W - 2 * MARGIN;

// addCriterion prints "•  " + label in helvetica bold at bodySize, indent 0.
const BULLET = '•  ';

// Evaluated rather than brace-matched. A hand-rolled balanced-bracket scan found
// a "[" inside a comment and tried to parse "[SPECIFY RESULT]" from a retired
// template as code. The file is JavaScript; run it as JavaScript.
const vm = require('vm');
const blocks = vm.runInNewContext(
    fs.readFileSync(path.join(ROOT, 'content-data.js'), 'utf8') + '\n;QUESTION_BLOCKS;'
);

// Strings printed verbatim into the PDF that extract.py matches exactly, but which
// are not checkbox labels. Keep in step with script.js's PDF section.
const STANDALONE = [
    'No Stage 1 threshold factors selected.',
    'Threshold test: deemed satisfied by panel membership (Spec Para 7.23(a)).',
];

// One label wraps, knowingly. `s1_cse_vulnerable_client` is 604.8pt against a
// 495.28pt column, and it is the label whose wrap produced the defect that
// `_resolve_wrapped_label` was written to fix: every claim ticking the
// vulnerable-client factor made a PDF the narrator refused to process. It was
// fixed by teaching extract.py to rejoin continuation lines rather than by
// shortening the label, because the wording is what the LAA reads and it was
// worth the words.
//
// It stays on this list only while extract.py can recover it. Do NOT add a new
// label here to silence this audit: the rejoin is a heuristic that stops at the
// first exact match, and every entry here is a string whose recovery depends on
// it. A new label can simply be made shorter.
const ACCEPTED_WRAPS = new Set(['p2 s1_cse_vulnerable_client']);

const rows = [];
for (const block of blocks) {
    if (block.page !== 2 && block.page !== 3) continue;
    for (const chk of block.checkboxes || []) {
        rows.push({ what: `p${block.page} ${chk.key}`, text: BULLET + chk.label });
    }
}
for (const text of STANDALONE) rows.push({ what: 'standalone', text: BULLET + text });

doc.setFont('helvetica', 'bold');
doc.setFontSize(BODY);

let worst = 0;
const unexpected = [];
const accountedFor = [];
rows.forEach(r => {
    r.width = doc.getTextWidth(r.text);
    r.lines = doc.splitTextToSize(r.text, COLUMN).length;
    r.accepted = ACCEPTED_WRAPS.has(r.what);
    if (r.width > worst && !r.accepted) worst = r.width;
    if (r.lines > 1) (r.accepted ? accountedFor : unexpected).push(r);
});

// A stale exemption is its own defect: it would hide a real wrap under a name
// that no longer measures long.
const staleExemptions = [...ACCEPTED_WRAPS].filter(
    what => !rows.some(r => r.what === what && r.lines > 1)
);

rows.sort((a, b) => b.width - a.width);

console.log(`Column: ${COLUMN.toFixed(2)}pt  (page ${PAGE_W.toFixed(2)}pt - 2 x ${MARGIN}pt margin)`);
console.log(`Font:   helvetica bold ${BODY}pt, as addCriterion sets it`);
console.log(`Measured ${rows.length} strings; widest unexempted ${worst.toFixed(1)}pt; ` +
            `headroom ${(COLUMN - worst).toFixed(1)}pt\n`);
console.log('Widest ten:');
rows.slice(0, 10).forEach(r => {
    const flag = r.lines > 1 ? (r.accepted ? 'wraps*' : ' WRAPS') : '    ok';
    console.log(`  ${flag}  ${r.width.toFixed(1).padStart(7)}pt  ${r.what}`);
});
if (accountedFor.length) {
    console.log(`\n* ${accountedFor.length} known wrap, recovered by ` +
                `extract._resolve_wrapped_label: ${accountedFor.map(r => r.what).join(', ')}`);
}

let failed = false;
if (unexpected.length) {
    failed = true;
    console.error(`\nFAIL: ${unexpected.length} string(s) wrap that are not on the ` +
                  `accepted list. Shorten them.`);
    unexpected.forEach(r => console.error(`  ${r.what} (${r.width.toFixed(1)}pt): ${r.text}`));
}
if (staleExemptions.length) {
    failed = true;
    console.error(`\nFAIL: ACCEPTED_WRAPS names ${staleExemptions.length} string(s) that ` +
                  `no longer wrap: ${staleExemptions.join(', ')}. Remove them, so the ` +
                  `exemption cannot later cover a different string that does.`);
}
if (failed) process.exit(1);

console.log('\nPASS: every measured string fits on one line, or is a recorded exception.');
