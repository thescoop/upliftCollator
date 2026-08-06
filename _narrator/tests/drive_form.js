/**
 * Drives the real form in a real browser. Run:
 *
 *     node _narrator/tests/drive_form.js [output-dir]
 *
 * WHY THIS EXISTS. `script.js` has no unit tests, and on 6 August 2026 that let a
 * feature reach completion in a state where it could not work at all: the deemed
 * threshold route (Spec Para 7.23(a)) let a panel member through to Stage 2 with
 * nothing ticked at Stage 1, but `updateStage2Visibility()` was never recomputed
 * on that path, so Stage 2 arrived soft-disabled with `pointer-events: none`. The
 * solicitor would have reached a page of controls that could not be clicked.
 * Nothing in 305 passing tests could see it, because none of them clicks.
 *
 * So the load-bearing check here is not "is the class absent" but "does the
 * checkbox actually tick when clicked". Read CSS to diagnose; click to verify.
 *
 * Synthetic data only — never drive this against a real matter (GDPR).
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Playwright is installed globally with @playwright/cli rather than as a project
// dependency, so resolve it rather than assuming a path.
function loadPlaywright() {
    const candidates = [];
    try {
        const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
        candidates.push(path.join(root, '@playwright', 'cli', 'node_modules', 'playwright'));
        candidates.push(path.join(root, 'playwright'));
    } catch { /* npm not on PATH; fall through to the bare require */ }
    candidates.push('playwright');
    for (const c of candidates) {
        try { return require(c); } catch { /* try the next one */ }
    }
    throw new Error(
        'Playwright not found. Install it with:\n'
        + '  npm install -g @playwright/cli && playwright-cli install-browser chromium'
    );
}
const { chromium } = loadPlaywright();

const REPO = path.resolve(__dirname, '..', '..');
const URL = 'file://' + path.join(REPO, 'index.html');
const OUT = process.argv[2] || path.join(REPO, '.drive-output');
// Matches ACCEPTABLE_PASSWORDS_NORMALIZED in content-data.js. The gate is a speed
// bump on a public GitHub Pages site, not a secret — it is in the repo already.
const PASSWORD = 'westpier';

const results = [];
function check(name, ok, detail = '') {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  \u2014 ' + detail : ''}`);
}

async function openApp(browser) {
    const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
    const dialogs = [];
    page.on('dialog', async d => { dialogs.push({ type: d.type(), message: d.message() }); await d.accept(); });
    page.on('pageerror', e => check('no page errors', false, e.message));
    await page.goto(URL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('#passwordSubmitButton');
    await page.waitForSelector('#appContainer', { state: 'visible' });
    return { page, dialogs };
}

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const browser = await chromium.launch();

    // ================= ROUTE 1: the deemed threshold =====================
    console.log('\n--- deemed route: panel member, nothing ticked at Stage 1');
    {
        const { page, dialogs } = await openApp(browser);
        const title = await page.title();
        // Derived from content-data.js, not hardcoded here: a hardcoded "v1.12"
        // in this very check survived the version bump to 1.13 and failed the
        // drive — the same lesson as the hardcoded "13" the fourteenth review
        // round caught in the Stage 1 alert.
        const appVersion = (fs.readFileSync(path.join(REPO, 'content-data.js'), 'utf8')
            .match(/const APP_VERSION = "([^"]+)"/) || [])[1];
        check('version injected into the tab title',
            !!appVersion && title.endsWith('v' + appVersion), title);

        // ── Page 1: case details + panel ────────────────────────────────────────
        await page.fill('#feeEarnerName', 'A. Solicitor');
        await page.fill('#caseMatterName', 'Synthetic Test 0001');
        await page.selectOption('#matterType', { index: 1 });
        await page.selectOption('#courtLevel', { index: 1 });
        await page.check('#panel_membership_resolution');

        // ── Page 2: Stage 1, deliberately tick nothing ──────────────────────────
        await page.click('#nextButton');
        await page.waitForTimeout(150);

        const s1Count = await page.locator('#stage1Container input[type=checkbox]').count();
        check('Stage 1 offers 18 labels', s1Count === 18, `found ${s1Count}`);

        const feedbackVisible = await page.locator('#stage1Feedback').isVisible();
        const feedbackText = feedbackVisible
            ? (await page.locator('#stage1Feedback').innerText()).trim() : '';
        check('deemed feedback shown on Stage 1 with nothing ticked',
            feedbackVisible && /deemed satisfied by panel membership/.test(feedbackText),
            feedbackText.slice(0, 80));

        // ── The gate: panel member, nothing ticked, should be let through ───────
        dialogs.length = 0;
        await page.click('#nextButton');
        await page.waitForTimeout(200);

        check('a confirm was raised, not a dead-end alert',
            dialogs.length === 1 && dialogs[0].type === 'confirm',
            dialogs.map(d => d.type).join(','));
        check('the dead-end referral is gone',
            !dialogs.some(d => /Woodruff Billing directly/.test(d.message)));
        check('the confirm cites 7.23(a)',
            dialogs.some(d => /7\.23\(a\)/.test(d.message)));

        const onStage2 = await page.locator('#page3').isVisible();
        check('reached Stage 2 with nothing ticked at Stage 1', onStage2);

        // ── THE BUG: is Stage 2 actually usable? ────────────────────────────────
        const disabledBlocks = await page.locator('#stage2Container .s2-disabled').count();
        check('no Stage 2 block is soft-disabled', disabledBlocks === 0,
            `${disabledBlocks} blocks carry .s2-disabled`);

        const bannerVisible = await page.locator('#stage2DisabledBanner').isVisible();
        check('the blocked banner is hidden for a panel member', !bannerVisible);

        // Prove it by clicking, not by reading CSS.
        const box = page.locator('#s2_resp_no_counsel_advocacy');
        let clicked = false;
        try {
            await box.click({ timeout: 3000 });
            clicked = await box.isChecked();
        } catch (e) { clicked = false; }
        check('a Stage 2 checkbox can actually be clicked', clicked);

        // ── Explanation must come first: Stage 2's own gate blocks navigation
        //    while a ticked factor has no explanation. That gate working is itself
        //    the check — an empty explanation must never reach the PDF.
        let blockedByGate = false;
        dialogs.length = 0;
        await page.click('#nextButton');
        await page.waitForTimeout(250);
        blockedByGate = await page.locator('#page3').isVisible() && dialogs.length > 0;
        check('Stage 2 refuses to advance with a ticked factor left unexplained',
            blockedByGate, dialogs.map(d => d.message.slice(0, 60)).join(' | '));

        await page.fill('#s2_resp_no_counsel_advocacy-explanation',
            'The fee earner conducted the advocacy at the contested interim hearing, '
            + 'which would ordinarily have been briefed to counsel in a case of this kind.');
        await page.waitForTimeout(150);

        await page.click('#nextButton');       // review
        await page.waitForTimeout(200);
        check('reached the review page', await page.locator('#page4Review').isVisible());

        await page.click('#nextButton');       // final
        await page.waitForTimeout(250);
        await page.fill('#finalProposedUpliftPercent', '35');
        await page.waitForTimeout(300);

        const dlDisabled = await page.locator('#downloadSummaryButton').isDisabled();
        check('download enabled once the deemed claim is evidenced', !dlDisabled);

        // ── Produce the PDF ─────────────────────────────────────────────────────
        if (!dlDisabled) {
            const [download] = await Promise.all([
                page.waitForEvent('download', { timeout: 15000 }),
                page.click('#downloadSummaryButton'),
            ]);
            // The name the browser offers is the name the solicitor gets. Every
            // download was "LAA_Uplift_Data_Summary.pdf" until 6 August 2026, so
            // three cases in a morning produced that plus "(1)" and "(2)".
            // Renamed to Uplift_Justification the same day; .docx since v1.13.
            const suggested = download.suggestedFilename();
            check('the download is named for the matter',
                suggested === 'Uplift_Justification-Synthetic Test 0001.docx',
                suggested);

            const dest = path.join(OUT, suggested);
            await download.saveAs(dest);
            check('summary downloaded', fs.existsSync(dest), path.basename(dest));

            // ── Round-trip: the narrator must read back what the browser wrote ──
            // This is the whole extraction contract exercised end to end: real
            // click, real download, real python-docx read. On this deemed route
            // Stage 1 is empty, so the deemed line and the panel tick are what
            // must survive the trip.
            try {
                const out = execSync(
                    `python3 extract.py ${JSON.stringify(dest)}`,
                    { cwd: path.join(REPO, '_narrator'), encoding: 'utf8' });
                const data = JSON.parse(out);
                check('round-trip: deemed threshold read back',
                    data.thresholdDeemed === true);
                check('round-trip: panel membership read back',
                    Object.keys(data.panelMembership || {}).length === 1,
                    Object.keys(data.panelMembership || {}).join(','));
                check('round-trip: Stage 2 factor read back with its explanation',
                    Object.values(data.stage2 || {}).some(e =>
                        e.checked && (e.explanation || '').split(/\s+/).length >= 10));
                check('round-trip: nothing unrecognised',
                    !(data.unrecognised && data.unrecognised.length),
                    JSON.stringify(data.unrecognised || []).slice(0, 120));
            } catch (e) {
                check('round-trip: extract.py read the download', false,
                    String(e.message || e).slice(0, 200));
            }
        }

    }

    // ================= ROUTE 2: the refusals ==============================
    console.log('\n--- refusals: no panel, and a threshold removed late');
    {
        const { page, dialogs } = await openApp(browser);
        // ── A: no panel, nothing ticked → refused, but told about the panels ────
        await page.fill('#feeEarnerName', 'B. Solicitor');
        await page.fill('#caseMatterName', 'Synthetic Test 0002');
        await page.selectOption('#matterType', { index: 1 });
        await page.selectOption('#courtLevel', { index: 1 });
        await page.click('#nextButton');
        await page.waitForTimeout(150);

        check('Stage 1 feedback hidden with no threshold at all',
            !(await page.locator('#stage1Feedback').isVisible()));

        dialogs.length = 0;
        await page.click('#nextButton');
        await page.waitForTimeout(200);

        check('non-panel with nothing ticked is refused',
            await page.locator('#page2').isVisible());
        check('the refusal names the three panels as the way out',
            dialogs.some(d => /Resolution Accredited Specialist Panel/.test(d.message)
                           && /go back to the first page/.test(d.message)),
            (dialogs[0] && dialogs[0].message || '').slice(0, 70));
        check('the refusal cites 7.23(a)', dialogs.some(d => /7\.23\(a\)/.test(d.message)));
        check('no dead-end referral to the firm',
            !dialogs.some(d => /Woodruff Billing directly/.test(d.message)));

        // ── B: the Stage 2 banner is shown to this user ─────────────────────────
        await page.check('#s1_circ_legal_issues');
        await page.waitForTimeout(100);
        await page.click('#nextButton');
        await page.waitForTimeout(200);
        check('reached Stage 2 with a genuine Stage 1 factor',
            await page.locator('#page3').isVisible());

        await page.check('#s2_complexity_legal_issues');
        await page.fill('#s2_complexity_legal_issues-explanation',
            'The case turned on the interplay between two statutory schemes and required '
            + 'research into authorities that had not previously been applied together.');
        await page.waitForTimeout(120);
        await page.click('#nextButton');   // review
        await page.waitForTimeout(180);
        await page.click('#nextButton');   // final
        await page.waitForTimeout(220);

        // Exponent syntax is a number to parseFloat and gibberish to the
        // extraction contract ("5e1%" matches no percentage). The gate must
        // demand a plain decimal. Found by cross-model review, 7 August 2026.
        await page.fill('#finalProposedUpliftPercent', '5e1');
        await page.waitForTimeout(250);
        check('exponent-syntax percentage is refused',
            await page.locator('#downloadSummaryButton').isDisabled());

        await page.fill('#finalProposedUpliftPercent', '30');
        await page.waitForTimeout(250);

        check('download enabled on the ordinary route',
            !(await page.locator('#downloadSummaryButton').isDisabled()));

        // ── C: threshold removed while sitting on the last page ────────────────
        //    The restored-draft shape: a draft saved on the final page is put back
        //    without replaying the navigation gates, so the download button used to
        //    be live with no threshold at all — and the PDF it produced dropped the
        //    whole Stage 2 section silently.
        await page.evaluate(() => {
            const el = document.getElementById('s1_circ_legal_issues');
            el.checked = false;
            el.dispatchEvent(new Event('change'));
        });
        await page.waitForTimeout(250);

        const disabled = await page.locator('#downloadSummaryButton').isDisabled();
        const title = await page.locator('#downloadSummaryButton').getAttribute('title');
        check('download blocked once the threshold is gone', disabled);
        check('and the button says why',
            /threshold test \(CAG 12\.4\) is not met/.test(title || ''),
            (title || '').slice(0, 80));

    }

    await browser.close();
    const failed = results.filter(r => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    if (failed.length) { failed.forEach(f => console.error('  FAILED: ' + f.name)); process.exit(1); }
})().catch(e => { console.error('DRIVE ERROR:', e); process.exit(2); });
