/**
 * The stable item codes in content-data.js.
 *
 *     node tests/test_item_codes.js
 *
 * Each Stage 1 and Stage 2 checkbox carries a frozen literal `code` (A01, C07,
 * "CARE 05", "RESP 02") that docx-summary.js prints beside the label. Because
 * the codes are frozen, nothing recomputes them at runtime — which means
 * nothing would notice if a checkbox were inserted, moved or retired and the
 * literals were left describing a different ordering than the file now has.
 *
 * This test is that noticer. It recomputes the ORIGINAL derivation — limb
 * letter (or factor prefix) plus the 1-based index of the checkbox within its
 * block, counting only non-retired boxes — and compares it with the literals.
 *
 * WHEN THIS TEST FAILS, THE FIX IS ALMOST NEVER TO RENUMBER. A code names an
 * item in documents already sitting in live matters; renumbering makes an old
 * document's "CARE 04" point at a different factor. The intended sequence is:
 *
 *   1. Give the new checkbox the next UNUSED number in its block — one that is
 *      neither live nor in RESERVED_ITEM_CODES in content-data.js — leaving
 *      every existing literal alone, and move a retired checkbox's code into
 *      RESERVED_ITEM_CODES so it can never be reissued.
 *   2. Record the divergence here, in EXPECTED_DIVERGENCES, with the date and
 *      the reason — so the check keeps running over everything else.
 *
 * Renumbering is a deliberate decision with a migration behind it, not a way
 * to make a red test go green.
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const REPO = path.resolve(__dirname, '..');

// content-data.js is a plain browser script of top-level consts, so they never
// land on the vm context's global. Appending an expression makes them the
// script's completion value, which runInContext returns. Same trick as
// _narrator/tests/build_docx_fixture.js.
const CONTENT = vm.runInContext(
    fs.readFileSync(path.join(REPO, 'content-data.js'), 'utf8') +
    '\n;({ QUESTION_BLOCKS, RESERVED_ITEM_CODES })',
    vm.createContext({})
);

// The Stage 2 block titles, mapped to their code prefixes. A new Stage 2 block
// with no entry here would silently produce uncoded items, so the absence is
// asserted below rather than tolerated.
const FACTOR_PREFIX = {
    'care': 'CARE',
    'speed': 'SPEED',
    'efficiency': 'EFF',
    'novelty': 'NOV',
    'weight': 'WEIGHT',
    'complexity': 'COMP',
    'degree of responsibility': 'RESP'
};

// key -> the code the derivation now produces, where that DELIBERATELY differs
// from the frozen literal. Empty today: every literal still equals its derived
// value, because nothing has been inserted or retired since the codes were
// frozen on 7 August 2026. Each entry needs a dated one-line reason.
const EXPECTED_DIVERGENCES = {
    // 's2_care_something': 'CARE 07'  // e.g. inserted 3rd, numbered next-unused — DD Month YYYY
};

function derive(blocks) {
    const out = {};
    for (const block of blocks) {
        const title = block.title || '';
        const limb = title.match(/limb \(([abc])\)\s*[:—-]?\s*(.*)$/i);
        const prefix = FACTOR_PREFIX[title.trim().toLowerCase()];
        let index = 0;
        for (const chk of (block.checkboxes || [])) {
            if (chk.retired) continue;         // retired boxes take no number
            index += 1;
            const n = String(index).padStart(2, '0');
            if (limb) out[chk.key] = limb[1].toUpperCase() + n;
            else if (prefix) out[chk.key] = prefix + ' ' + n;
        }
    }
    return out;
}

let checks = 0;
function check(name, fn) {
    fn();
    checks += 1;
    console.log('  ok  ' + name);
}

const derived = derive(CONTENT.QUESTION_BLOCKS);

// ── 1. Every codeable checkbox has a literal, and no other one does ────────
check('page 2 and page 3 checkboxes all carry a literal code', () => {
    const missing = [];
    for (const block of CONTENT.QUESTION_BLOCKS) {
        if (block.page === 1) continue;
        for (const chk of (block.checkboxes || [])) {
            if (chk.retired) continue;
            if (!chk.code) missing.push(block.title + ' / ' + chk.key);
        }
    }
    assert.deepStrictEqual(missing, [],
        'checkboxes with no code (a new Stage 2 block also needs a FACTOR_PREFIX entry): ' +
        missing.join(', '));
});

check('page 1 panel memberships carry no code', () => {
    const stray = [];
    for (const block of CONTENT.QUESTION_BLOCKS) {
        if (block.page !== 1) continue;
        for (const chk of (block.checkboxes || [])) {
            if (chk.code) stray.push(chk.key);
        }
    }
    assert.deepStrictEqual(stray, [],
        'panel memberships are printed as a dash list, not as coded items: ' + stray.join(', '));
});

// ── 2. The frozen literals still match the derivation ──────────────────────
check('every frozen code equals the value the original derivation produces', () => {
    const drift = [];
    for (const block of CONTENT.QUESTION_BLOCKS) {
        for (const chk of (block.checkboxes || [])) {
            if (!chk.code) continue;
            const want = Object.prototype.hasOwnProperty.call(EXPECTED_DIVERGENCES, chk.key)
                ? EXPECTED_DIVERGENCES[chk.key]
                : derived[chk.key];
            if (chk.code !== want) {
                drift.push(chk.key + ': literal ' + JSON.stringify(chk.code) +
                    ', derivation now gives ' + JSON.stringify(want));
            }
        }
    }
    assert.deepStrictEqual(drift, [],
        'Codes have drifted from block order. A checkbox has been inserted, moved or ' +
        'retired. Do NOT renumber to make this pass — read the header of this file:\n    ' +
        drift.join('\n    '));
});

check('the derivation covers exactly the keys that carry a literal', () => {
    const literal = [];
    for (const block of CONTENT.QUESTION_BLOCKS) {
        for (const chk of (block.checkboxes || [])) if (chk.code) literal.push(chk.key);
    }
    assert.deepStrictEqual(literal.slice().sort(), Object.keys(derived).sort());
});

// ── 3. Shape and uniqueness — what the document relies on ──────────────────
check('codes are unique across the whole form', () => {
    const seen = new Map();
    const clashes = [];
    for (const block of CONTENT.QUESTION_BLOCKS) {
        for (const chk of (block.checkboxes || [])) {
            if (!chk.code) continue;
            if (seen.has(chk.code)) clashes.push(chk.code + ': ' + seen.get(chk.code) + ' and ' + chk.key);
            seen.set(chk.code, chk.key);
        }
    }
    assert.deepStrictEqual(clashes, [], 'duplicate codes: ' + clashes.join(', '));
});

check('Stage 1 codes are LETTER + 2 digits, Stage 2 codes are PREFIX + space + 2 digits', () => {
    const bad = [];
    for (const block of CONTENT.QUESTION_BLOCKS) {
        const isStage1 = block.page === 2;
        for (const chk of (block.checkboxes || [])) {
            if (!chk.code) continue;
            const ok = isStage1 ? /^[ABC]\d{2}$/.test(chk.code)
                : /^[A-Z]+ \d{2}$/.test(chk.code);
            if (!ok) bad.push(chk.key + ' = ' + JSON.stringify(chk.code));
        }
    }
    assert.deepStrictEqual(bad, [], 'malformed codes: ' + bad.join(', '));
});

check('a Stage 1 code letter matches the limb its block names', () => {
    const bad = [];
    for (const block of CONTENT.QUESTION_BLOCKS) {
        if (block.page !== 2) continue;
        const limb = (block.title || '').match(/limb \(([abc])\)/i);
        assert.ok(limb, 'Stage 1 block title must name its limb: ' + block.title);
        for (const chk of (block.checkboxes || [])) {
            if (chk.code && chk.code[0] !== limb[1].toUpperCase()) {
                bad.push(chk.key + ' = ' + chk.code + ' in ' + block.title);
            }
        }
    }
    assert.deepStrictEqual(bad, [], bad.join(', '));
});

// ── 4. The codes the printed sample documents show ─────────────────────────
// Spot-checks pinned by hand against the signed-off design mockups, so that a
// wholesale regeneration of the literals could not quietly pass tests 1-3.
check('the codes shown in the signed-off design samples are still those codes', () => {
    const PINNED = {
        s1_cse_detailed_knowledge: 'A01',
        s1_cse_marshalling_evidence: 'A03',
        s1_speed_proactive_pursuit: 'B01',
        s1_circ_legal_issues: 'C01',
        s2_care_vulnerable_client: 'CARE 05',
        s2_resp_no_counsel_drafting: 'RESP 02',
        s2_efficiency_less_time: 'EFF 01'
    };
    const byKey = {};
    for (const block of CONTENT.QUESTION_BLOCKS) {
        for (const chk of (block.checkboxes || [])) byKey[chk.key] = chk.code;
    }
    for (const key of Object.keys(PINNED)) {
        assert.strictEqual(byKey[key], PINNED[key],
            key + ' must stay ' + PINNED[key] + ' — it is printed in documents already issued');
    }
});

// ── 5. Retired codes stay retired ───────────────────────────────────────────
// RESERVED_ITEM_CODES is the registry of codes that once named a checkbox and
// must never name another. A live checkbox wearing a reserved code would make
// an old document's code point at a different item — the exact failure the
// freeze exists to prevent.
check('no live checkbox uses a reserved code, and retired boxes have no code', () => {
    assert.ok(Array.isArray(CONTENT.RESERVED_ITEM_CODES),
        'RESERVED_ITEM_CODES must exist in content-data.js');
    const reserved = new Set(CONTENT.RESERVED_ITEM_CODES);
    for (const block of CONTENT.QUESTION_BLOCKS) {
        for (const chk of (block.checkboxes || [])) {
            if (chk.retired) {
                assert.strictEqual(chk.code, undefined,
                    chk.key + ' is retired: its code belongs in RESERVED_ITEM_CODES, not on the checkbox');
                continue;
            }
            if (chk.code !== undefined) {
                assert.ok(!reserved.has(chk.code),
                    chk.key + ' wears reserved code ' + chk.code + ' — reserved codes are never reissued');
            }
        }
    }
});

// ── 6. The full key→code freeze ─────────────────────────────────────────────
// Every mapping as frozen on 7 August 2026. A live key must wear exactly its
// frozen code; a key that disappears or retires must leave its code in
// RESERVED_ITEM_CODES. Editing THIS map is the deliberate migration act, with
// a dated comment — there is no other legitimate way to change a mapping.
const FROZEN_CODES = {
    s1_cse_detailed_knowledge: 'A01',
    s1_cse_difficult_argument: 'A02',
    s1_cse_marshalling_evidence: 'A03',
    s1_cse_effective_tactic: 'A04',
    s1_cse_better_result_current: 'A05',
    s1_cse_less_time: 'A06',
    s1_cse_vulnerable_client: 'A07',
    s1_cse_other: 'A08',
    s1_speed_proactive_pursuit: 'B01',
    s1_speed_urgent_deadlines: 'B02',
    s1_speed_other: 'B03',
    s1_circ_legal_issues: 'C01',
    s1_circ_difficult_instructions: 'C02',
    s1_circ_client_impact: 'C03',
    s1_circ_out_of_hours: 'C04',
    s1_circ_novel_point: 'C05',
    s1_circ_weight: 'C06',
    s1_circ_other: 'C07',
    s2_care_detailed_knowledge: 'CARE 01',
    s2_care_marshalling_evidence: 'CARE 02',
    s2_care_effective_tactic: 'CARE 03',
    s2_care_better_result: 'CARE 04',
    s2_care_vulnerable_client: 'CARE 05',
    s2_care_other: 'CARE 06',
    s2_speed_proactive_pursuit: 'SPEED 01',
    s2_speed_urgent_deadlines: 'SPEED 02',
    s2_speed_out_of_hours: 'SPEED 03',
    s2_speed_other: 'SPEED 04',
    s2_efficiency_less_time: 'EFF 01',
    s2_novelty_difficult_argument: 'NOV 01',
    s2_novelty_novel_point: 'NOV 02',
    s2_weight_client_importance: 'WEIGHT 01',
    s2_weight_volume: 'WEIGHT 02',
    s2_complexity_legal_issues: 'COMP 01',
    s2_complexity_difficult_instructions: 'COMP 02',
    s2_complexity_other: 'COMP 03',
    s2_resp_no_counsel_analysis: 'RESP 01',
    s2_resp_no_counsel_drafting: 'RESP 02',
    s2_resp_no_counsel_advocacy: 'RESP 03',
    s2_resp_addressed_expert_issues: 'RESP 04',
    s2_resp_other: 'RESP 05'
};
check('every frozen mapping is either live and identical, or retired into the registry', () => {
    const live = {};
    for (const block of CONTENT.QUESTION_BLOCKS) {
        for (const chk of (block.checkboxes || [])) {
            if (!chk.retired && chk.code !== undefined) live[chk.key] = chk.code;
        }
    }
    const reserved = new Set(CONTENT.RESERVED_ITEM_CODES);
    for (const [key, code] of Object.entries(FROZEN_CODES)) {
        if (key in live) {
            assert.strictEqual(live[key], code,
                key + ' must keep frozen code ' + code + ' — editing FROZEN_CODES is the only migration path');
        } else {
            assert.ok(reserved.has(code),
                key + ' is gone or retired, but its code ' + code +
                ' is not in RESERVED_ITEM_CODES — old documents would let it be reissued');
        }
    }
    assert.strictEqual(Object.keys(FROZEN_CODES).length, 41,
        'the freeze covers all 41 codes as of 7 August 2026');
    // The reverse direction: a code enters the freeze at birth. A live
    // mapping absent from FROZEN_CODES could later vanish without leaving
    // its code in the registry, permitting reuse against documents issued
    // during its lifetime.
    for (const [key, code] of Object.entries(live)) {
        assert.ok(key in FROZEN_CODES,
            key + ' (' + code + ') is live but not frozen — add it to FROZEN_CODES with a dated comment');
    }
});

console.log('\n' + checks + '/' + checks + ' item-code checks passed.');
