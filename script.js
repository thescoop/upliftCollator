// --- Globally Scoped Functions (called by HTML on... attributes) ---
//
// v1.11 removed `updateSuggestedPercentage` from this list, and from the whole
// application. The tool no longer computes, displays or pre-fills a percentage
// of any kind. If you are tempted to restore it because a number "would be
// helpful", read the comment above the Proposed Uplift field in index.html
// first: a displayed figure ends up authoring the solicitor's answer, and the
// direction of that error is always downward.
let _validateField = (el, type) => console.warn("validateField called before DOM fully ready for:", el, type);
let _checkAllPlaceholdersAndExplanationsGlobally = () => console.warn("checkAllPlaceholdersAndExplanationsGlobally called before DOM fully ready");


function validateField(fieldElement, type = 'text') { _validateField(fieldElement, type); }
function checkAllPlaceholdersAndExplanationsGlobally() { _checkAllPlaceholdersAndExplanationsGlobally(); }


document.addEventListener('DOMContentLoaded', () => {
    // --- Welcome Screen Elements ---
    const welcomeScreen = document.getElementById('welcomeScreen');
    const appContainer = document.getElementById('appContainer');
    const passwordInput = document.getElementById('passwordInput');
    const passwordSubmitButton = document.getElementById('passwordSubmitButton');
    const passwordError = document.getElementById('passwordError');

    // --- Main App Elements (to be initialized after password success) ---
    let laaGuideVersionInfoEl, currentYearFooterEl, versionInfoSidebarEl, mainFormTitleEl;
    let pageDivs = [], navSteps = [];
    let backButton, nextButton, generatePdfSummaryButton;
    let viewLaaGuideLinkRightCol, clearAllEntriesLinkRightCol, mainHelpButtonLarge;
    let feeEarnerNameEl, matterTypeEl, caseMatterNameEl, courtLevelEl;
    let panelMembershipContainerOnPage1, preStageIntroTextOnPage1, stage1ContainerOnPage2, stage1FeedbackEl;
    let stage1ThresholdBannerEl;
    let stage2ContainerOnPage3, stage2IntroNoteEl;
    let reviewSummaryEl, finalProposedUpliftPercentEl, upliftCeilingStatementEl, finalUpliftGuidanceButton;
    let evidenceOnFileConfirmedEl;
    let draftRestoredBannerEl, draftRestoredMessageEl, discardDraftButtonEl;
    let helpModal, closeHelpModalButton, markdownMissingMsgMainEl, helpContentDiv;
    let upliftGuidanceModal, closeUpliftGuidanceModalButton, markdownMissingMsgUpliftEl, upliftGuidanceContentDiv;
    let contextualHelpModal, contextualHelpTitleEl, contextualHelpContentEl, closeContextualHelpModalButton;
    let termsModal, termsModalContent, closeTermsModalButton, termsLinkFooter;

    const formElements = {};
    const formData = {
        caseDetails: { feeEarnerName: "", matterType: "", caseMatterName: "", courtLevel: "" },
        panelMembership: {}, stage1: {}, stage2: {}, finalUpliftPercent: "",
        // Whether the solicitor has confirmed that the file holds evidence for
        // what they have written. Defaults to false and is only ever set by
        // the tick on page 5: the narrator emits its case-file sentence only
        // where this is true, so an unanswered question must read as "no",
        // never as "probably".
        evidenceOnFileConfirmed: false
    };
    let currentPageIndex = 0;
    const MIN_EXPLANATION_WORDS = 10;

    // Courts in which CAG 12.2 puts the enhancement ceiling at 100% rather than
    // 50%. These strings must match the option values in index.html exactly;
    // they are also what gets printed in the PDF, so keep them readable.
    const HUNDRED_PERCENT_CEILING_COURTS = [
        "High Court", "Upper Tribunal", "Court of Appeal", "Supreme Court"
    ];

    // Where the draft lives between sessions. Versioned in the key so that a
    // future change of shape can never half-restore an old draft: an unknown
    // key is simply absent, which is the safe failure.
    const DRAFT_STORAGE_KEY = "woodruffUpliftCollatorDraft.v1";
    let draftSaveTimer = null;

    // Stage 2 items already auto-ticked from their Stage 1 origin. Tracked so
    // that carry-forward happens ONCE per origin: if the solicitor deliberately
    // unticks a carried item, walking back and forth between the pages must not
    // keep putting it back. Cleared for a key as soon as its Stage 1 origin is
    // unticked, so re-ticking Stage 1 later carries it forward again.
    const carriedForwardApplied = {};


    function initializeMainAppDomElements() {
        laaGuideVersionInfoEl = document.getElementById('laa-guide-version-info');
        currentYearFooterEl = document.getElementById('currentYearFooter');
        versionInfoSidebarEl = document.getElementById('laa-guide-version-info-sidebar');
        mainFormTitleEl = document.getElementById('currentPageTitleH2');

        pageDivs = [
            document.getElementById('page1'), document.getElementById('page2'),
            document.getElementById('page3'), document.getElementById('page4Review'),
            document.getElementById('page5Finalise')
        ];
        navSteps = [
            document.getElementById('navStep1'), document.getElementById('navStep2'),
            document.getElementById('navStep3'), document.getElementById('navStep4'),
            document.getElementById('navStep5')
        ];
        backButton = document.getElementById('backButton');
        nextButton = document.getElementById('nextButton');
        generatePdfSummaryButton = document.getElementById('generatePdfSummaryButton');
        viewLaaGuideLinkRightCol = document.getElementById('viewLaaGuideLinkRightCol');
        clearAllEntriesLinkRightCol = document.getElementById('clearAllEntriesLinkRightCol');
        mainHelpButtonLarge = document.getElementById('mainHelpButtonLarge');

        feeEarnerNameEl = document.getElementById('feeEarnerName');
        matterTypeEl = document.getElementById('matterType');
        caseMatterNameEl = document.getElementById('caseMatterName');
        courtLevelEl = document.getElementById('courtLevel');

        panelMembershipContainerOnPage1 = document.getElementById('panelMembershipContainer');
        preStageIntroTextOnPage1 = document.getElementById('preStageIntroText');
        stage1ContainerOnPage2 = document.getElementById('stage1Container');
        stage1ThresholdBannerEl = document.getElementById('stage1ThresholdBanner');
        stage1FeedbackEl = document.getElementById('stage1Feedback');
        stage2ContainerOnPage3 = document.getElementById('stage2Container');
        stage2IntroNoteEl = document.getElementById('stage2IntroNote');

        reviewSummaryEl = document.getElementById('reviewSummary');
        finalProposedUpliftPercentEl = document.getElementById('finalProposedUpliftPercent');
        upliftCeilingStatementEl = document.getElementById('upliftCeilingStatement');
        finalUpliftGuidanceButton = document.getElementById('finalUpliftHelpLink');
        evidenceOnFileConfirmedEl = document.getElementById('evidenceOnFileConfirmed');

        draftRestoredBannerEl = document.getElementById('draftRestoredBanner');
        draftRestoredMessageEl = document.getElementById('draftRestoredMessage');
        discardDraftButtonEl = document.getElementById('discardDraftButton');

        helpModal = document.getElementById('helpModal');
        closeHelpModalButton = document.getElementById('closeHelpModal');
        markdownMissingMsgMainEl = document.getElementById('markdownMissingMsgMain');
        helpContentDiv = document.getElementById('helpContent');

        upliftGuidanceModal = document.getElementById('upliftGuidanceModal');
        closeUpliftGuidanceModalButton = document.getElementById('closeUpliftGuidanceModal');
        markdownMissingMsgUpliftEl = document.getElementById('markdownMissingMsgUplift');
        upliftGuidanceContentDiv = document.getElementById('upliftGuidanceContent');

        contextualHelpModal = document.getElementById('contextualHelpModal');
        contextualHelpTitleEl = document.getElementById('contextualHelpTitle');
        contextualHelpContentEl = document.getElementById('contextualHelpContent');
        closeContextualHelpModalButton = document.getElementById('closeContextualHelpModal');

        termsModal = document.getElementById('termsModal');
        termsModalContent = document.getElementById('termsModalContent');
        closeTermsModalButton = document.getElementById('closeTermsModal');
        termsLinkFooter = document.getElementById('termsLink');
    }


    function checkCriticalData() {
        const isLogoBase64Defined = typeof LOGO_BASE64 !== 'undefined';
        if (!isLogoBase64Defined) {
            console.warn("LOGO_BASE64 is not defined in content-data.js. PDF logo might be affected.");
        }

        if (
            typeof LAA_GUIDE_URL === 'undefined' || typeof NARRATIVE_TEMPLATES === 'undefined' ||
            typeof QUESTION_BLOCKS === 'undefined' || typeof MAIN_HELP_TEXT_MARKDOWN === 'undefined' ||
            typeof UPLIFT_PERCENTAGE_GUIDANCE_TEXT === 'undefined' || typeof LAA_GUIDE_VERSION_INFO_CONST === 'undefined' ||
            typeof LAA_PUBLICATIONS_PAGE_URL === 'undefined' || typeof CONTEXTUAL_HELP_TEXTS === 'undefined' ||
            typeof TERMS_AND_CONDITIONS_MARKDOWN === 'undefined' ||
            typeof ACCEPTABLE_PASSWORDS_NORMALIZED === 'undefined'
        ) {
            const errorMsg = "CRITICAL ERROR: content-data.js is missing or essential data structures are not defined. Ensure content-data.js is loaded BEFORE script.js and contains all necessary data (LAA_GUIDE_URL, NARRATIVE_TEMPLATES, QUESTION_BLOCKS, MAIN_HELP_TEXT_MARKDOWN, UPLIFT_PERCENTAGE_GUIDANCE_TEXT, LAA_GUIDE_VERSION_INFO_CONST, LAA_PUBLICATIONS_PAGE_URL, CONTEXTUAL_HELP_TEXTS, TERMS_AND_CONDITIONS_MARKDOWN, ACCEPTABLE_PASSWORDS_NORMALIZED).";
            if (document.body) {
                const errorDisplayArea = document.getElementById('appContainer') || document.getElementById('welcomeScreen') || document.body;
                 if(errorDisplayArea) errorDisplayArea.innerHTML = `<p style='color:red; text-align:center; font-size:1.2em; padding:20px;'>${errorMsg}</p>`;
            }
            console.error(errorMsg);
            return false;
        }
        return true;
    }

    function handlePasswordSubmit() {
        if (!passwordInput || !ACCEPTABLE_PASSWORDS_NORMALIZED || !passwordError || !welcomeScreen || !appContainer) {
            console.error("Password related DOM elements or data not found.");
            return;
        }

        const enteredPassword = passwordInput.value;
        const normalizedPassword = enteredPassword.toLowerCase().replace(/\s+/g, '');

        if (ACCEPTABLE_PASSWORDS_NORMALIZED.includes(normalizedPassword)) {
            welcomeScreen.style.display = 'none';
            appContainer.style.display = 'block';
            passwordError.style.display = 'none';
            initializeMainAppDomElements();

    const aboutTermsLinkInline = document.getElementById('aboutTermsLinkInline');
    const aboutHelpLinkInline = document.getElementById('aboutHelpLinkInline');

    if (aboutTermsLinkInline && termsLinkFooter) {
        aboutTermsLinkInline.addEventListener('click', (e) => {
            e.preventDefault();
            termsLinkFooter.click(); // Simulate footer terms modal opening
        });
    }

    if (aboutHelpLinkInline && mainHelpButtonLarge) {
        aboutHelpLinkInline.addEventListener('click', (e) => {
            e.preventDefault();
            mainHelpButtonLarge.click(); // Simulate help modal opening
        });
    }

            initializeApp();
        } else {
            passwordError.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    // --- Initial setup ---
    if (!checkCriticalData()) {
        return;
    }

    if (passwordSubmitButton) {
        passwordSubmitButton.addEventListener('click', handlePasswordSubmit);
    }
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                handlePasswordSubmit();
            }
        });
        if (welcomeScreen && welcomeScreen.style.display !== 'none') {
            passwordInput.focus();
        }
    }

    // ----- MAIN APPLICATION LOGIC (to be called after password success) -----
    //
    // There is no _updateSuggestedPercentage here any more, and nothing has
    // taken its place. What follows instead is the CAG 12.2 ceiling, stated in
    // words: the limit the guidance sets, not a figure the tool thinks the
    // solicitor should claim.

    // The ceiling that applies to this case, or null while the court is unknown.
    // Null is meaningful — the form says "tell me which court" rather than
    // quietly assuming the lower figure, because quietly assuming the lower
    // figure is exactly the bug being fixed.
    function applicableCeilingPercent() {
        const court = (formData.caseDetails.courtLevel || (courtLevelEl ? courtLevelEl.value : "")).trim();
        if (!court) return null;
        return HUNDRED_PERCENT_CEILING_COURTS.includes(court) ? 100 : 50;
    }

    // Renders the ceiling sentence on the final page. Deliberately prose, and
    // deliberately about the maximum rather than about this claim: it must not
    // read as advice on what to put in the box beside it.
    function updateUpliftCeilingStatement() {
        if (!upliftCeilingStatementEl) return;
        const court = (formData.caseDetails.courtLevel || (courtLevelEl ? courtLevelEl.value : "")).trim();
        const ceiling = applicableCeilingPercent();

        if (ceiling === null) {
            upliftCeilingStatementEl.className = 'uplift-ceiling-statement needs-court';
            upliftCeilingStatementEl.textContent =
                "The court has not been entered, so the applicable ceiling cannot be stated. " +
                "Go back to Case Details and select the court: the maximum is 50%, but 100% in " +
                "the High Court, Upper Tribunal, Court of Appeal or Supreme Court (CAG 12.2).";
            return;
        }

        upliftCeilingStatementEl.className = 'uplift-ceiling-statement';
        if (ceiling === 100) {
            upliftCeilingStatementEl.textContent =
                `This case was in the ${court}, so the maximum enhancement is 100% (CAG 12.2) — ` +
                "not the 50% that applies below the High Court. CAG 12.10: \"A maximum enhancement " +
                "could be payable on the basis of one factor alone where it is particularly strong.\"";
        } else {
            upliftCeilingStatementEl.textContent =
                `This case was in the ${court}, so the maximum enhancement is 50% (CAG 12.2). ` +
                "CAG 12.10: \"A maximum enhancement could be payable on the basis of one factor " +
                "alone where it is particularly strong.\"";
        }
    }

    // The number typed is the solicitor's own, but a figure above the statutory
    // ceiling cannot be awarded at all (CAG 12.2 is a cap, not a soft target),
    // so it is worth saying so. This warns; it never rewrites the value, and it
    // never blocks the download. Telling someone their figure is impossible is
    // not the same as telling them what their figure should be.
    function updateCeilingBreachWarning() {
        const warningEl = document.getElementById('upliftCeilingWarning');
        if (!warningEl || !finalProposedUpliftPercentEl) return;
        const ceiling = applicableCeilingPercent();
        const entered = parseFloat(finalProposedUpliftPercentEl.value);
        if (ceiling !== null && !isNaN(entered) && entered > ceiling) {
            warningEl.textContent =
                `${entered}% is above the ${ceiling}% ceiling set by CAG 12.2 for this court. ` +
                "The LAA cannot award more than the ceiling, whatever the merits.";
            warningEl.style.display = 'block';
        } else {
            warningEl.style.display = 'none';
        }
    }


    _validateField = function(fieldElement, type = 'text') {
        if (!fieldElement) return;
        let isInvalid = false;
        if (type === 'text' && fieldElement.value.trim() === "") isInvalid = true;
        else if (type === 'select' && fieldElement.value === "") isInvalid = true;
        else if (type === 'number' && (fieldElement.value.trim() === "" || isNaN(parseFloat(fieldElement.value.trim())) || parseFloat(fieldElement.value.trim()) < 0 )) isInvalid = true;


        if (isInvalid && fieldElement.classList.contains('needs-input-highlight')) {
            fieldElement.classList.add('attention');
        } else {
            fieldElement.classList.remove('attention');
        }
        if (currentPageIndex === pageDivs.length - 1) { // If on final page
            checkAllPlaceholdersAndExplanations(); // Check overall validity for download button
        }
    };
    _checkAllPlaceholdersAndExplanationsGlobally = function() {
        checkAllPlaceholdersAndExplanations();
    }


    function initializeApp() {
        if (laaGuideVersionInfoEl) laaGuideVersionInfoEl.innerHTML = `Based on LAA Costs Assessment Guidance<br>(Version 1a, 23 September 2024)`;
        if (currentYearFooterEl) currentYearFooterEl.textContent = new Date().getFullYear();
        if (versionInfoSidebarEl) versionInfoSidebarEl.innerHTML = LAA_GUIDE_VERSION_INFO_CONST;
        
        // Display version information
        if (typeof APP_VERSION !== 'undefined') {
            const appVersionEl = document.getElementById('appVersion');
            if (appVersionEl) appVersionEl.textContent = APP_VERSION;
            
            const headerVersionEl = document.getElementById('headerVersion');
            if (headerVersionEl) headerVersionEl.textContent = `v${APP_VERSION}`;
        }

        if (preStageIntroTextOnPage1) {
            preStageIntroTextOnPage1.innerHTML = `
                <h3 class="intro-subheading">LAA Enhancement Process Overview</h3>
                <p>The LAA enhancement process involves two stages, and they do different jobs:</p>
                <ul class="intro-list">
                    <li><strong>Stage 1</strong> is a pass/fail threshold (CAG 12.4). It decides whether <em>any</em> enhancement is available, and it earns nothing by itself — so it is ticks only, with no writing.</li>
                    <li><strong>Stage 2</strong> is where the claim is actually made (CAG 12.9). Everything you tick at Stage 1 comes forward to Stage 2, where you explain it in your own words.</li>
                </ul>
                <p>Tick what applies below. There is nothing to type on this page.</p>
            `;
        }
        // The Stage 1 banner holds the threshold itself, so it is rendered from
        // the constant rather than written into the page: it must say exactly
        // what content-data.js says, and change with it.
        if (stage1ThresholdBannerEl && typeof STAGE1_THRESHOLD_BANNER !== 'undefined') {
            stage1ThresholdBannerEl.textContent = STAGE1_THRESHOLD_BANNER;
        }
        if (stage2IntroNoteEl) {
            stage2IntroNoteEl.innerHTML = `
                <p>The Stage 1 threshold is met, so the question now is <strong>how much</strong> enhancement the case justifies (CAG 12.9).</p>
                <p>Everything you ticked at Stage 1 is already selected below and marked as carried forward. Complete the sentence under each one: what happened, why it was necessary, and what it led to.</p>
                <p>Factors with no Stage 1 origin — weight of documentation, and degree of responsibility — are offered here on their own, because nothing carries them forward and they would otherwise never be claimed.</p>
            `;
        }
        buildQuestionnaire();

        // A draft, if there is one, is restored before the first page is shown
        // so that the solicitor never sees an empty form flash up and wonder
        // whether last week's work survived.
        const restoredPageIndex = restoreDraftIfPresent();

        attachEventListeners();
        showPage(restoredPageIndex >= 0 ? restoredPageIndex : 0);
        checkAllPlaceholdersAndExplanations();
    }

    function showPage(pageIndexToShow) {
        pageDivs.forEach((page, index) => {
            if (page) page.style.display = (index === pageIndexToShow) ? 'block' : 'none';
        });
        navSteps.forEach((step, index) => {
            if (step) {
                step.classList.remove('active', 'completed');
                if (index === pageIndexToShow) {
                    step.classList.add('active');
                    // Screen-reader equivalent of the bold blue highlight.
                    step.setAttribute('aria-current', 'step');
                } else {
                    step.removeAttribute('aria-current');
                    if (index < pageIndexToShow) step.classList.add('completed');
                }
            }
        });

        const pageTitles = [
            "Uplift Justification Collator - Case Details & Panel",
            "Stage 1: LAA Threshold Test",
            "Stage 2: Determining Level of Enhancement",
            "Statement Review",
            "Finalise & Download"
        ];
        if (mainFormTitleEl) mainFormTitleEl.textContent = pageTitles[pageIndexToShow] || "Uplift Justification Collator";

        if (backButton) backButton.style.display = pageIndexToShow > 0 ? 'inline-flex' : 'none';
        if (nextButton) nextButton.style.display = pageIndexToShow < pageDivs.length - 1 ? 'inline-flex' : 'none';
        if (generatePdfSummaryButton) generatePdfSummaryButton.style.display = pageIndexToShow === pageDivs.length - 1 ? 'inline-flex' : 'none';

        // Arriving at Stage 2 is the moment the Stage 1 ticks become selections
        // here, so carry-forward is applied on entry rather than on every Stage 1
        // click — the solicitor should not watch boxes appear on a page they are
        // not looking at.
        if (pageIndexToShow === 2) {
            refreshStage1CarryForward(true);
        }
        if (pageIndexToShow === 3) {
            populateReviewSummary();
        }
        if (pageIndexToShow === pageDivs.length - 1) {
            // The box is filled from what the solicitor previously typed, and
            // from nothing else. When they have typed nothing it stays empty —
            // v1.10 pre-filled it by reading a number out of the "Suggested"
            // caption, which meant the tool answered its own question.
            if (formData.finalUpliftPercent !== null && formData.finalUpliftPercent !== "" && finalProposedUpliftPercentEl) {
                 finalProposedUpliftPercentEl.value = formData.finalUpliftPercent;
            }
            updateUpliftCeilingStatement();
            updateCeilingBreachWarning();
            validateField(finalProposedUpliftPercentEl, 'number');
            checkAllPlaceholdersAndExplanations();
        }
        currentPageIndex = pageIndexToShow;
        persistDraft();
        window.scrollTo(0,0);
    }

    function nextPage() {
        if (!validateCurrentPage()) return;
        saveCurrentPageData();
        let nextPageIndex = currentPageIndex + 1;

        if (currentPageIndex === 1) {
            if (!isAnyStage1ThresholdTrulyMet()) {
                // `page === 1 &&` and a filter rather than a find, to match
                // savePanelMembershipFromDom and buildQuestionnaire. This read
                // the first block with id 'panel' whatever page it sat on, so
                // it was order-dependent and would have looked at the wrong
                // block if a page-2 one were ever named the same.
                const panelKeys = QUESTION_BLOCKS
                    .filter(b => b.page === 1 && b.id === 'panel')
                    .flatMap(b => b.checkboxes.map(cb => cb.key));
                let isPanelMember = false;
                if (feeEarnerNameEl && feeEarnerNameEl.value.trim() !== "") {
                    for (const key of panelKeys) {
                        if (formElements[key] && formElements[key].checkbox.checked) {
                            isPanelMember = true; break;
                        }
                    }
                }

                // Counted rather than written out. It read "the twelve" until
                // 5 August 2026, having been drafted before the
                // tactic/better-result label was split into two, so the screen
                // that tells a solicitor to go back and read them all named the
                // wrong number of them.
                const stage1Count = QUESTION_BLOCKS
                    .filter(b => b.page === 2)
                    .reduce((n, b) => n + b.checkboxes.length, 0);

                if (isPanelMember) {
                    // This alert used to open "the threshold test (CAG 12.4) is
                    // not met and there is no enhancement to determine the level
                    // of". For a panel member that overstates what an empty
                    // Stage 1 proves: Paragraph 7.23(a) of the 2024 Standard
                    // Civil Contract Family Category Specific Rules provides
                    // that where the work is done by a member of a relevant
                    // panel "the threshold test at Paragraph 6.13 shall be
                    // deemed to be satisfied in respect of that work". The tool
                    // still asks for a tick before it will build a claim above
                    // 15% (Simon's call, 5 August 2026: anyone with real Stage 2
                    // material will have a Stage 1 hook, and skipping the
                    // threshold produces a weak narrative) — but it no longer
                    // tells them a thing that is not so, and it no longer ends
                    // by implying they are finished.
                    alert("Nothing is ticked at Stage 1.\n\nPanel membership is indicated, so the guaranteed 15% minimum (CAG 12.20) is applied at bill-drafting for that fee earner's own work whatever this form says — not for supervision, and not for work done by anyone not on a panel (CAG 12.22). It is a floor, not an addition: it is not payable on top of a general enhancement (CAG 12.23), so this tool is about whether the case justifies more than 15%.\n\nTo claim more, tick at least one of the " + stage1Count + " threshold factors. Before deciding none fits: if what makes this case worth more is the work you did without counsel, or the sheer volume of it, those are the two things Stage 2 asks about that Stage 1 does not — so look again rather than assuming Stage 1 has nothing for you.\n\nIf none of the " + stage1Count + " genuinely applies but you say this case is worth more than 15% on responsibility or weight alone, that is not something this form can carry — raise it with Woodruff Billing directly. Do not tick a factor that does not apply in order to get past this page.");
                    return;
                } else {
                    alert("Nothing is ticked at Stage 1, so the threshold test (CAG 12.4) is not met, and no panel membership is indicated either.\n\nAn enhancement claim needs at least one threshold factor. Read the " + stage1Count + " on the previous page against this case: the test is whether the work was unusual or out of the ordinary compared with legally aided work generally — not compared with other family cases.\n\nIf none of them genuinely applies, there is nothing further to do in this tool.");
                    return;
                }
            }
        }

        if (nextPageIndex < pageDivs.length) {
            showPage(nextPageIndex);
        }
    }

    function prevPage() {
        saveCurrentPageData();
        let prevPageIndex = currentPageIndex - 1;

        if (currentPageIndex === 3 && !isAnyStage1ThresholdTrulyMet()) {
            prevPageIndex = 1;
        }

        if (prevPageIndex >= 0) {
            showPage(prevPageIndex);
        }
        if (nextButton && nextButton.disabled) {
            nextButton.disabled = false;
        }
    }


    function validateCurrentPage() {
        let isValid = true;
        if (currentPageIndex === 0) {
            // Court is required alongside the other three. It has to be: the
            // ceiling stated on the final page depends on it, and defaulting it
            // would mean telling a High Court claim that its maximum is 50%.
            [feeEarnerNameEl, caseMatterNameEl, matterTypeEl, courtLevelEl].forEach(field => {
                if (field) {
                    const type = field.tagName === 'SELECT' ? 'select' : 'text';
                    _validateField(field, type);
                    if (field.classList.contains('attention')) isValid = false;
                }
            });
            if (!isValid) { alert("Please complete all highlighted fields in 'Case Details'."); return false; }
        }

        const blocksOnCurrentPage = QUESTION_BLOCKS.filter(b => b.page === (currentPageIndex + 1));
        for (const block of blocksOnCurrentPage) {
            let isBlockEffectivelyVisibleForValidation = false;
            if (block.page === 1) {
                isBlockEffectivelyVisibleForValidation = true;
            } else if (block.page === 2) {
                isBlockEffectivelyVisibleForValidation = true;
            } else if (block.page === 3) {
                isBlockEffectivelyVisibleForValidation = isAnyStage1ThresholdTrulyMet();
            }

            // An optional_section block — Degree of Responsibility — never
            // blocks progress. Per CAG 12.16 there is genuinely little to claim
            // where counsel was instructed throughout, and a forced closing
            // paragraph would be thin, defensive, and would end the narrative on
            // its weakest point. An item the solicitor has actually ticked there
            // still needs its explanation, on the same terms as anywhere else:
            // ticking is opt-in, and a bare claim with no evidence behind it is
            // worth nothing to an assessor.
            if (isBlockEffectivelyVisibleForValidation) {
                for (const chkData of block.checkboxes) {
                    if (chkData.explanation && formElements[chkData.key] && formElements[chkData.key].checkbox.checked) {
                        const explInput = formElements[chkData.key].explanationInput;
                        const wordCount = explInput ? explInput.value.trim().split(/\s+/).filter(Boolean).length : 0;
                        if (!explInput || wordCount < MIN_EXPLANATION_WORDS) {
                            if (isValid) {
                                alert(`Please provide a more detailed explanation (approx. ${MIN_EXPLANATION_WORDS}+ words) for:\n"${chkData.label}" under "${block.title}"`);
                                if (explInput) explInput.focus();
                            }
                            if (explInput) explInput.classList.add('needs-attention');
                            isValid = false;
                        } else if (explInput) { explInput.classList.remove('needs-attention'); }
                    }
                }
            }
        }

        if (currentPageIndex === pageDivs.length -1 ) {
             _validateField(finalProposedUpliftPercentEl, 'number');
             if (finalProposedUpliftPercentEl.classList.contains('attention')) {
                 if (isValid) alert("Please enter a valid proposed uplift percentage.");
                 isValid = false;
             }
        }
        return isValid;
    }

    // ── Reading the form back into formData ──────────────────────────────
    //
    // formData is the single record the review page, the PDF and the saved
    // draft are all built from. It is split into one reader per page so that
    // navigation can save just the page being left (as it always has) while a
    // restored draft can repopulate the lot in one call — a whole-form read
    // used to be impossible, which is why a restored draft would previously
    // have shown an empty review page.

    function saveCaseDetailsFromDom() {
        if (feeEarnerNameEl) formData.caseDetails.feeEarnerName = feeEarnerNameEl.value.trim();
        if (matterTypeEl) formData.caseDetails.matterType = matterTypeEl.value;
        if (caseMatterNameEl) formData.caseDetails.caseMatterName = caseMatterNameEl.value.trim();
        if (courtLevelEl) formData.caseDetails.courtLevel = courtLevelEl.value;
    }

    function savePanelMembershipFromDom() {
        formData.panelMembership = {};
        QUESTION_BLOCKS.filter(b => b.page === 1 && b.id === 'panel').forEach(block => {
            block.checkboxes.forEach(chkData => {
                if (formElements[chkData.key] && formElements[chkData.key].checkbox.checked) {
                    formData.panelMembership[chkData.key] = { checked: true, label: chkData.label };
                }
            });
        });
    }

    // Stage 1 no longer carries explanations — the labels are the whole of it.
    // `explanation` is still written, as an empty string, because the PDF, the
    // review page and _narrator/extract.py all read the same record shape and
    // a missing key would have to be defended against in three places.
    function saveStage1FromDom() {
        formData.stage1 = {};
        QUESTION_BLOCKS.filter(b => b.page === 2).forEach(block => {
            block.checkboxes.forEach(chkData => {
                if (formElements[chkData.key] && formElements[chkData.key].checkbox.checked) {
                    formData.stage1[chkData.key] = {
                        checked: true,
                        label: chkData.label,
                        explanation: "",
                        categoryTitle: block.title
                    };
                }
            });
        });
    }

    function saveStage2FromDom() {
        formData.stage2 = {};
        QUESTION_BLOCKS.filter(b => b.page === 3).forEach(block => {
            block.checkboxes.forEach(chkData => {
                if (formElements[chkData.key] && formElements[chkData.key].checkbox.checked) {
                    const explInput = formElements[chkData.key].explanationInput;
                    formData.stage2[chkData.key] = {
                        checked: true,
                        label: chkData.label,
                        explanation: explInput ? explInput.value.trim() : "",
                        categoryTitle: block.title
                    };
                }
            });
        });
    }

    function saveFinalUpliftFromDom() {
        if (finalProposedUpliftPercentEl) formData.finalUpliftPercent = finalProposedUpliftPercentEl.value;
        if (evidenceOnFileConfirmedEl) formData.evidenceOnFileConfirmed = evidenceOnFileConfirmedEl.checked;
    }

    function saveCurrentPageData() {
        if (currentPageIndex === 0) {
            saveCaseDetailsFromDom();
            savePanelMembershipFromDom();
        } else if (currentPageIndex === 1) {
            saveStage1FromDom();
        } else if (currentPageIndex === 2) {
            saveStage2FromDom();
        } else if (currentPageIndex === pageDivs.length - 1) {
            saveFinalUpliftFromDom();
        }
    }

    // Everything, regardless of which page is on screen. Used when a draft is
    // restored and immediately before the PDF is written, so that the document
    // can never disagree with the form the solicitor just approved.
    function syncFormDataFromDom() {
        saveCaseDetailsFromDom();
        savePanelMembershipFromDom();
        saveStage1FromDom();
        saveStage2FromDom();
        saveFinalUpliftFromDom();
    }


    // ═══════════════════════════════════════════════════════════════════════
    //                      BUILDING THE QUESTIONNAIRE
    // ═══════════════════════════════════════════════════════════════════════
    //
    // Three quite different things are rendered from one QUESTION_BLOCKS array,
    // so there is one builder each rather than one builder with three sets of
    // conditionals inside it:
    //
    //   page 1 — panel membership: plain ticks, nothing else.
    //   page 2 — Stage 1: ticks with a "what counts?" panel, no typing at all.
    //   page 3 — Stage 2: ticks with a sentence stem, a worked example, and a
    //            carried-forward marker.

    function buildQuestionnaire() {
        const containers = {
            page1Panel: panelMembershipContainerOnPage1,
            page2Stage1: stage1ContainerOnPage2,
            page3Stage2: stage2ContainerOnPage3
        };
        if (!containers.page1Panel || !containers.page2Stage1 || !containers.page3Stage2) {
            console.error("CRITICAL: Page content containers missing. Check HTML IDs: panelMembershipContainer, stage1Container, stage2Container."); return;
        }
        Object.values(containers).forEach(c => c.innerHTML = '');

        QUESTION_BLOCKS.forEach(block => {
            if (block.page === 1 && block.id === 'panel') buildPanelBlock(block, containers.page1Panel);
            else if (block.page === 2) buildStage1Block(block, containers.page2Stage1);
            else if (block.page === 3) buildStage2Block(block, containers.page3Stage2);
        });

        updateStage2Visibility();
    }

    // Shared shell: the bordered section with its heading, ready for content.
    function createBlockShell(block) {
        const blockDiv = document.createElement('div');
        blockDiv.className = 'form-section';
        blockDiv.id = `${block.id}-block`;
        const titleEl = document.createElement('h3');
        titleEl.textContent = block.title;
        blockDiv.appendChild(titleEl);
        return blockDiv;
    }

    // The paragraph number the block comes from, shown under its heading.
    // Every heading in this form now carries its citation, because the previous
    // version cited paragraphs that do not exist — 12.8.1, 12.8.2, 12.8.3 and a
    // "CAG 6.17" — and nobody could tell by looking. A citation on screen is a
    // citation somebody can check.
    function appendCitation(blockDiv, block) {
        if (!block.cag_citation) return;
        const citation = document.createElement('p');
        citation.className = 'cag-citation';
        citation.textContent = block.cag_citation;
        blockDiv.appendChild(citation);
    }

    function buildPanelBlock(block, targetContainer) {
        const blockDiv = createBlockShell(block);
        const options = document.createElement('div');
        options.className = 'panel-options';
        blockDiv.appendChild(options);
        block.checkboxes.forEach(chkData => createPlainCheckboxItem(chkData, options));
        targetContainer.appendChild(blockDiv);
    }

    // A tick with no explanation and no help — panel membership is a fact the
    // solicitor either has or has not, and there is nothing to elaborate.
    function createPlainCheckboxItem(chkData, parentContainer) {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'checkbox-item-container';
        // Use <label> (not <div>) so clicking the text toggles the checkbox,
        // and so the checkbox has a real accessible name.
        const labelContainer = document.createElement('label');
        labelContainer.className = 'checkbox-label-container';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = chkData.key;
        input.onchange = () => {
            checkAllPlaceholdersAndExplanations();
            persistDraft();
        };
        labelContainer.appendChild(input);
        labelContainer.appendChild(document.createTextNode(` ${chkData.label}`));
        itemContainer.appendChild(labelContainer);
        formElements[chkData.key] = { checkbox: input };
        parentContainer.appendChild(itemContainer);
    }

    // ── STAGE 1 ─────────────────────────────────────────────────────────────
    //
    // Thirteen labels, tick only, all of them visible.
    //
    // Stage 1 is a pass/fail threshold (CAG 12.4) that earns nothing by itself,
    // so it must not consume the solicitor's effort. The previous version
    // demanded ten words on each of seventeen boxes and then presented eleven
    // more at Stage 2 to someone who had nothing left to say — which is how a
    // real submission came in with six well-evidenced Stage 1 factors and only
    // two at Stage 2. That is a structural fault, not a personal one.
    //
    // The limb-level toggle that used to hide each group is gone too. A
    // collapsed list of thirteen is help nobody reads, and the labels themselves
    // are what the solicitor is being asked to recognise: they have to be on
    // the screen. The limb question is now a heading rather than a gate.
    //
    // Generic wording is safe here BECAUSE of carry-forward: every ticked label
    // reappears at Stage 2 and is evidenced there in the solicitor's own words,
    // so no ticked point is ever left bare.

    function buildStage1Block(block, targetContainer) {
        const blockDiv = createBlockShell(block);
        appendCitation(blockDiv, block);

        if (block.main_question_text) {
            const question = document.createElement('p');
            question.className = 'limb-question';
            question.textContent = block.main_question_text;
            blockDiv.appendChild(question);
        }

        const options = document.createElement('div');
        options.className = 'sub-options-grid';
        options.id = `${block.id}-sub-options`;
        blockDiv.appendChild(options);
        block.checkboxes.forEach(chkData => createStage1Item(chkData, options));
        targetContainer.appendChild(blockDiv);
    }

    function createStage1Item(chkData, parentContainer) {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'checkbox-item-container stage1-item';

        const labelContainer = document.createElement('label');
        labelContainer.className = 'checkbox-label-container';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = chkData.key;
        input.onchange = () => {
            updateStage2Visibility();
            checkAllPlaceholdersAndExplanations();
            persistDraft();
        };
        labelContainer.appendChild(input);
        labelContainer.appendChild(document.createTextNode(` ${chkData.label}`));
        itemContainer.appendChild(labelContainer);
        formElements[chkData.key] = { checkbox: input };

        // "what counts?" — expands CAG 12.8's own examples in place.
        //
        // In place, and not in a modal: the existing CONTEXTUAL_HELP_TEXTS
        // modal covers the list and loses the solicitor's place, which thirteen
        // times over is intolerable. Collapsed by default, because thirteen
        // expanded panels is a wall of text that recreates the fatigue this
        // redesign exists to remove — but with the trigger always visible,
        // because helptext nobody can see is help nobody reads.
        if (chkData.what_counts) {
            const panelId = `${chkData.key}-what-counts`;
            const toggle = document.createElement('button');
            toggle.type = 'button';                    // a real button, so Enter and Space work without any keydown handler of ours
            toggle.className = 'what-counts-toggle';
            toggle.id = `${chkData.key}-what-counts-toggle`;
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-controls', panelId);
            toggle.textContent = 'what counts?';

            const panel = document.createElement('div');
            panel.className = 'what-counts-panel';
            panel.id = panelId;
            panel.hidden = true;

            const quote = document.createElement('p');
            quote.className = 'what-counts-text';
            // Quoted and cited from CAG 12.8 — never our own examples. Invented
            // examples read as an exhaustive list however they are captioned,
            // so a solicitor whose situation is not listed concludes they do
            // not qualify. That narrowing is the whole reason for this rebuild.
            quote.textContent = chkData.what_counts;
            panel.appendChild(quote);

            toggle.onclick = () => {
                const opening = panel.hidden;
                panel.hidden = !opening;
                toggle.setAttribute('aria-expanded', opening ? 'true' : 'false');
                toggle.classList.toggle('is-open', opening);
                placeWhatCountsCaveat();
            };

            itemContainer.appendChild(toggle);
            itemContainer.appendChild(panel);
            formElements[chkData.key].whatCountsPanel = panel;
            formElements[chkData.key].whatCountsToggle = toggle;
        }

        parentContainer.appendChild(itemContainer);
    }

    // WHAT_COUNTS_CAVEAT is CAG 12.7 in the LAA's own words: no exhaustive list
    // of features can be identified, and each claim is considered on its merits.
    // It has to appear wherever the solicitor is reading, or the quoted examples
    // above it read as the complete set of qualifying situations. But repeating
    // it under all thirteen panels would be noise, so there is exactly one of it
    // and it moves to sit beneath the lowest panel currently open.
    let whatCountsCaveatEl = null;
    function placeWhatCountsCaveat() {
        if (!whatCountsCaveatEl) {
            whatCountsCaveatEl = document.createElement('p');
            whatCountsCaveatEl.className = 'what-counts-caveat';
            whatCountsCaveatEl.id = 'whatCountsCaveat';
            whatCountsCaveatEl.textContent =
                (typeof WHAT_COUNTS_CAVEAT !== 'undefined') ? WHAT_COUNTS_CAVEAT : '';
        }
        const openPanels = document.querySelectorAll('#stage1Container .what-counts-panel:not([hidden])');
        if (!openPanels.length) {
            if (whatCountsCaveatEl.parentNode) whatCountsCaveatEl.parentNode.removeChild(whatCountsCaveatEl);
            return;
        }
        openPanels[openPanels.length - 1].appendChild(whatCountsCaveatEl);
    }

    // ── STAGE 2 ─────────────────────────────────────────────────────────────
    //
    // One block per factor in CAG 12.9. There are exactly seven, which 12.10
    // confirms when it speaks of "the above seven factors".
    //
    // Each block states its citation and quotes the factor's definition, so the
    // solicitor is answering the LAA's question rather than ours. Each item
    // opens with a sentence stem instead of a blank box — a completion task
    // rather than a writing task — and shows its worked example permanently
    // beside the stem. The examples used to live in the textarea placeholder,
    // which is the one container in a browser that destroys its contents the
    // moment somebody starts using it; they were the best-written content in
    // the form and nobody ever saw them twice.

    function buildStage2Block(block, targetContainer) {
        const blockDiv = createBlockShell(block);

        // An optional section is marked as optional on its face. Left unsaid,
        // a section that looks like the other six but is not required reads as
        // an omission the solicitor has failed to fill in.
        if (block.optional_section) {
            blockDiv.classList.add('optional-section');
            const badge = document.createElement('span');
            badge.className = 'optional-badge';
            badge.textContent = 'Optional';
            blockDiv.querySelector('h3').appendChild(badge);
        }

        appendCitation(blockDiv, block);

        if (block.factor_description) {
            const description = document.createElement('p');
            description.className = 'factor-description';
            description.textContent = block.factor_description;
            blockDiv.appendChild(description);
        }

        // CAG 12.16 in the LAA's words: instructing counsel makes a
        // responsibility claim harder to justify, not impossible. The previous
        // version read as binary and so closed the section on a "yes".
        if (block.counsel_note) {
            const note = document.createElement('p');
            note.className = 'counsel-note';
            note.textContent = block.counsel_note;
            blockDiv.appendChild(note);
        }

        const options = document.createElement('div');
        options.className = 'sub-options-grid';
        blockDiv.appendChild(options);
        block.checkboxes.forEach(chkData => createStage2Item(chkData, options, block));
        targetContainer.appendChild(blockDiv);
    }

    function createStage2Item(chkData, parentContainer, blockInfo) {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'checkbox-item-container stage2-item';
        itemContainer.id = `${chkData.key}-item`;

        const labelContainer = document.createElement('label');
        labelContainer.className = 'checkbox-label-container';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = chkData.key;
        input.onchange = () => {
            toggleExplanationInput(chkData.key, input.checked);
            checkAllPlaceholdersAndExplanations();
            persistDraft();
        };
        labelContainer.appendChild(input);
        labelContainer.appendChild(document.createTextNode(` ${chkData.label}`));

        // Carried forward from Stage 1 — stated, not merely pre-ticked. A tick
        // that appears on its own is indistinguishable from one the solicitor
        // made and forgot, and this one is a claim they have already committed
        // to on the previous page.
        const carriedBadge = document.createElement('span');
        carriedBadge.className = 'carried-badge';
        carriedBadge.textContent = 'Carried forward from Stage 1';
        carriedBadge.hidden = true;
        labelContainer.appendChild(carriedBadge);

        itemContainer.appendChild(labelContainer);

        const explanationArea = document.createElement('div');
        explanationArea.className = 'explanation-area';
        explanationArea.style.display = 'none';

        // The stem is both the visible sentence opening and the textarea's
        // <label>. One element, so they can never drift apart, and so the
        // textarea finally has an accessible name — it had only a placeholder
        // before, which screen readers announce inconsistently and which
        // disappears the moment anything is typed.
        const stem = document.createElement('label');
        stem.className = 'explanation-stem';
        stem.htmlFor = `${chkData.key}-explanation`;
        stem.textContent = chkData.stem || 'Explain what happened, why it was necessary, and what it led to:';
        explanationArea.appendChild(stem);

        const explanationTextarea = document.createElement('textarea');
        explanationTextarea.className = 'explanation-input';
        explanationTextarea.id = `${chkData.key}-explanation`;
        explanationTextarea.rows = 3;

        if (chkData.example) {
            const exampleId = `${chkData.key}-example`;
            const example = document.createElement('p');
            example.className = 'explanation-example';
            example.id = exampleId;
            example.textContent = chkData.example;
            explanationArea.appendChild(example);
            // Described-by rather than placeholder: it stays put while they
            // write, and it is read out as guidance rather than as the value.
            explanationTextarea.setAttribute('aria-describedby', exampleId);
        }

        explanationTextarea.oninput = () => {
            checkExplanation(explanationTextarea, chkData.key);
            checkAllPlaceholdersAndExplanations();
            persistDraft();
        };
        explanationArea.appendChild(explanationTextarea);
        itemContainer.appendChild(explanationArea);

        formElements[chkData.key] = {
            checkbox: input,
            explanationInput: explanationTextarea,
            explanationArea: explanationArea,
            carriedBadge: carriedBadge,
            itemContainer: itemContainer
        };

        parentContainer.appendChild(itemContainer);
    }

    // True when one of the Stage 1 labels feeding this Stage 2 item is ticked.
    function isCarriedFromStage1(chkData) {
        if (!Array.isArray(chkData.carried_from)) return false;
        return chkData.carried_from.some(
            key => formElements[key] && formElements[key].checkbox.checked
        );
    }

    // Paints the carried-forward marks, and — when `tickNew` is true — selects
    // items whose Stage 1 origin has been ticked since the last pass.
    //
    // `tickNew` is false when restoring a draft. A draft is the record of what
    // the solicitor decided, including anything they deliberately unticked, and
    // re-imposing carry-forward on top of it would silently overrule them.
    function refreshStage1CarryForward(tickNew) {
        QUESTION_BLOCKS.filter(b => b.page === 3).forEach(block => {
            block.checkboxes.forEach(chkData => {
                const el = formElements[chkData.key];
                if (!el) return;

                const carried = isCarriedFromStage1(chkData);
                if (el.carriedBadge) el.carriedBadge.hidden = !carried;
                if (el.itemContainer) el.itemContainer.classList.toggle('carried-forward', carried);

                if (!carried) {
                    carriedForwardApplied[chkData.key] = false;
                    return;
                }
                if (carriedForwardApplied[chkData.key]) return;
                carriedForwardApplied[chkData.key] = true;
                if (tickNew && !el.checkbox.checked) {
                    el.checkbox.checked = true;
                    toggleExplanationInput(chkData.key, true);
                    // Opened by the tool, not by the solicitor — so it does not
                    // arrive already flagged in orange as an error. They get
                    // told the explanation is too short when they type a short
                    // one, or when they try to move on, not before they have
                    // had the chance to write anything at all.
                    if (el.explanationInput) el.explanationInput.classList.remove('needs-attention');
                }
            });
        });
        checkAllPlaceholdersAndExplanations();
    }

    function checkExplanation(textareaElement, key) {
        const isChecked = formElements[key] && formElements[key].checkbox && formElements[key].checkbox.checked;
        if (isChecked && textareaElement) {
            const wordCount = textareaElement.value.trim().split(/\s+/).filter(Boolean).length;
            if (wordCount < MIN_EXPLANATION_WORDS) textareaElement.classList.add('needs-attention');
            else textareaElement.classList.remove('needs-attention');
        } else if (textareaElement) {
            textareaElement.classList.remove('needs-attention');
        }
    }

    function toggleExplanationInput(key, isChecked) {
        const el = formElements[key];
        if (!el || !el.explanationArea) return;
        el.explanationArea.style.display = isChecked ? 'block' : 'none';
        if (!isChecked) {
            if (el.explanationInput) el.explanationInput.classList.remove('needs-attention');
        } else {
            checkExplanation(el.explanationInput, key);
        }
    }


    // The Stage 1 threshold is met by a tick alone.
    //
    // It used to require a ten-word explanation on top of the tick, because
    // Stage 1 collected prose. It no longer does: CAG 12.4 asks only whether
    // one of the three limbs is present, and the evidence for it belongs at
    // Stage 2, where it is worth marks. Requiring words here for a test that
    // earns nothing is what exhausted solicitors before they reached the stage
    // that actually determines the percentage.
    function isAnyStage1ThresholdTrulyMet() {
        for (const block of QUESTION_BLOCKS) {
            if (block.page !== 2) continue;
            for (const chkData of block.checkboxes) {
                if (formElements[chkData.key] && formElements[chkData.key].checkbox.checked) return true;
            }
        }
        return false;
    }
    window.isAnyStage1ThresholdTrulyMetGlobally = isAnyStage1ThresholdTrulyMet;

    function updateStage2Visibility() {
        const isS1Met = isAnyStage1ThresholdTrulyMet();
        if(stage1FeedbackEl) stage1FeedbackEl.style.display = isS1Met ? 'block' : 'none';

        // Stage 2 selections are *preserved* (not silently cleared) when the
        // Stage 1 threshold is not met — a habit worth keeping from v1.10. The
        // blocks stay visible but soft-disabled, so unticking a Stage 1 label
        // to reconsider it never destroys the Stage 2 prose written under it.
        // The forward-navigation gate in nextPage() still blocks submission
        // while Stage 1 is unmet.
        QUESTION_BLOCKS.filter(b => b.page === 3).forEach(block => {
            const blockDiv = document.getElementById(`${block.id}-block`);
            if (blockDiv) {
                blockDiv.classList.toggle('s2-disabled', !isS1Met);
            }
        });

        const banner = document.getElementById('stage2DisabledBanner');
        if (banner) banner.style.display = isS1Met ? 'none' : 'block';

        checkAllPlaceholdersAndExplanations();
    }

    function checkAllPlaceholdersAndExplanations() {
        let allValid = true;
        if (!feeEarnerNameEl || !caseMatterNameEl || !matterTypeEl || !courtLevelEl ||
            !feeEarnerNameEl.value.trim() || !caseMatterNameEl.value.trim() ||
            !matterTypeEl.value || !courtLevelEl.value) {
            allValid = false;
        }
        if (finalProposedUpliftPercentEl &&
            (finalProposedUpliftPercentEl.value.trim() === "" || isNaN(parseFloat(finalProposedUpliftPercentEl.value.trim())) || parseFloat(finalProposedUpliftPercentEl.value.trim()) <0 )) {
            allValid = false;
        }

        QUESTION_BLOCKS.forEach(block => {
            let blockIsEffectivelyVisible = false;
            if (block.page === 1 || block.page === 2) blockIsEffectivelyVisible = true;
            else if (block.page === 3) blockIsEffectivelyVisible = isAnyStage1ThresholdTrulyMet();

            // Nothing here treats an empty optional section as incomplete: only
            // items the solicitor has actually ticked are examined, so a
            // Responsibility block left entirely alone never disables the
            // download button and is never flagged.
            if (blockIsEffectivelyVisible) {
                 block.checkboxes.forEach(chkData => {
                    if (chkData.explanation && formElements[chkData.key] && formElements[chkData.key].checkbox.checked) {
                        const explInput = formElements[chkData.key].explanationInput;
                        if (!explInput || explInput.value.trim().split(/\s+/).filter(Boolean).length < MIN_EXPLANATION_WORDS) {
                            allValid = false;
                        }
                    }
                });
            }
        });

        if (generatePdfSummaryButton) {
            generatePdfSummaryButton.disabled = !allValid;
            generatePdfSummaryButton.title = allValid ? "Generate PDF Summary of your selections." : "Complete all Case Details (including the court), enter your Proposed Uplift %, and make sure every ticked Stage 2 factor has an explanation of roughly 10+ words.";
        }
    }

    function populateReviewSummary() {
        if (!reviewSummaryEl) return;
        let summaryHtml = "<h2>Summary of Your Input:</h2>";

        // The solicitor's own prose is going into innerHTML, so it is escaped
        // first. Not a security matter — nothing here leaves the machine — but
        // a narrative that reads "resolved in <2 days" would otherwise lose the
        // rest of the sentence to a phantom tag, silently, in the one place the
        // solicitor is being asked to check their words.
        const escapeHtml = (value) => String(value === null || value === undefined ? "" : value)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        summaryHtml += "<h3>Case Details:</h3>";
        summaryHtml += `<p><strong>Fee Earner:</strong> ${escapeHtml(formData.caseDetails.feeEarnerName) || "<em>Not provided</em>"}</p>`;
        summaryHtml += `<p><strong>Matter Type:</strong> ${escapeHtml(formData.caseDetails.matterType) || "<em>Not selected</em>"}</p>`;
        summaryHtml += `<p><strong>Case / Matter Name:</strong> ${escapeHtml(formData.caseDetails.caseMatterName) || "<em>Not provided</em>"}</p>`;
        summaryHtml += `<p><strong>Court:</strong> ${escapeHtml(formData.caseDetails.courtLevel) || "<em>Not selected</em>"}</p>`;

        summaryHtml += "<h3>Panel Membership:</h3>";
        let panelSelected = Object.values(formData.panelMembership).some(item => item.checked);
        if (panelSelected) {
            for (const key in formData.panelMembership) {
                if (formData.panelMembership[key].checked) summaryHtml += `<p>- ${escapeHtml(formData.panelMembership[key].label)}</p>`;
            }
        } else { summaryHtml += "<p><em>No panel membership selected.</em></p>"; }

        // Stage 1 is listed as ticks, with no explanation slot and nothing
        // flagged as missing. There is nothing to write there any more, and a
        // review page that asked for it would send the solicitor back to look
        // for a box that no longer exists.
        summaryHtml += "<h3>Stage 1: Threshold Test Selections:</h3>";
        let s1Selected = Object.values(formData.stage1).some(item => item.checked);
        if (s1Selected) {
            summaryHtml += "<p class=\"review-note\"><em>These are the threshold factors you say apply (CAG 12.4). Each one is evidenced at Stage 2 below.</em></p>";
            for (const key in formData.stage1) {
                if (formData.stage1[key].checked) {
                    summaryHtml += `<p><strong>${escapeHtml(formData.stage1[key].label)}</strong> (<em>${escapeHtml(formData.stage1[key].categoryTitle)}</em>)</p>`;
                }
            }
        } else { summaryHtml += "<p><em>No Stage 1 threshold factors ticked.</em></p>"; }

        if (isAnyStage1ThresholdTrulyMet()) {
            summaryHtml += "<h3>Stage 2: Level of Enhancement Factors:</h3>";
            let s2Selected = Object.values(formData.stage2).some(item => item.checked);
            if (s2Selected) {
                for (const key in formData.stage2) {
                    if (formData.stage2[key].checked) {
                        summaryHtml += `<p><strong>${escapeHtml(formData.stage2[key].label)}</strong> (<em>${escapeHtml(formData.stage2[key].categoryTitle)}</em>):</p>`;
                        const explanation = escapeHtml(formData.stage2[key].explanation).replace(/\n/g, "<br />    ");
                        const wordCount = formData.stage2[key].explanation ? formData.stage2[key].explanation.trim().split(/\s+/).filter(Boolean).length : 0;
                        const isValidExplanation = wordCount >= MIN_EXPLANATION_WORDS;
                        summaryHtml += `<div class="explanation-review ${!isValidExplanation ? 'needs-attention-review' : ''}">${explanation || "<em>Explanation missing or insufficient.</em>"}</div>`;
                    }
                }
            } else { summaryHtml += "<p><em>No Stage 2 factors selected.</em></p>"; }
        }

        // Shown even when it has not been ticked yet, because the review page
        // is read before page 5 and this is where the solicitor learns the
        // question exists. Reading "not confirmed" here and doing nothing about
        // it is a decision; never seeing the line is an accident.
        summaryHtml += "<h3>Evidence on File:</h3>";
        summaryHtml += formData.evidenceOnFileConfirmed
            ? "<p>Confirmed — the narrative will state that evidence supporting these assertions can be found within the case file.</p>"
            : "<p><em>Not confirmed. The narrative will not state that evidence is held on the case file. You can confirm it on the next page.</em></p>";

        if (reviewSummaryEl) reviewSummaryEl.innerHTML = summaryHtml;
    }

    function generatePdfSummary() {
        if (generatePdfSummaryButton && generatePdfSummaryButton.disabled) {
            alert("Before downloading, please complete all Case Details (including the court), enter your Proposed Uplift %, and give every ticked Stage 2 factor an explanation of roughly 10+ words.\n\nStage 1 needs ticks only — there is nothing to write there.");
            return;
        }
        // Read the whole form, not just the page being looked at. The PDF is
        // the document that goes to Woodruff Billing, so it must not be able to
        // differ from what the solicitor approved on the review page.
        syncFormDataFromDom();

        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF !== 'function') {
            alert("jsPDF library not loaded. Cannot download PDF...");
            return;
        }

        try {
            const { jsPDF } = window.jspdf;

            // ── Page setup ─────────────────────────────────────────────────────
            const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
            const pageW = pdf.internal.pageSize.width;   // 595pt
            const pageH = pdf.internal.pageSize.height;  // 842pt
            const margin = 50;                            // All four sides
            const footerZone = 50;                        // Reserved for footer text
            const contentW = pageW - (2 * margin);        // Usable text width
            let currentY = margin;

            // Text defaults
            const bodySize = 10;
            const lineH = 13;           // Standard line height for body text
            const sectionGap = 20;      // Vertical space before a new section header
            const black = [0, 0, 0];
            const darkGrey = [60, 60, 60];      // Body text
            const midGrey = [90, 90, 90];       // Metadata, categories
            const blue = [0, 86, 179];          // Explanations (Woodruff blue)
            const lightGrey = [100, 100, 100];  // Disclaimer, footer

            // ── addHeader — "W" monogram + company name + separator line ─────
            // Pure text header matching the website's serif "W" identity.
            // Called at the top of each page. Sets currentY past the header.
            function addHeader() {
                const headerStartY = currentY;

                // Bold serif "W" monogram (matches website login screen style)
                pdf.setFont("times", "bold");
                pdf.setFontSize(28);
                pdf.setTextColor(black[0], black[1], black[2]);
                pdf.text("W", margin, headerStartY + 22);

                // Company name beside the "W"
                const wWidth = pdf.getTextWidth("W") + 10; // gap after monogram
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(15);
                pdf.setTextColor(black[0], black[1], black[2]);
                pdf.text("Woodruff Billing Ltd.", margin + wWidth, headerStartY + 14);

                // Subtitle line under company name
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.setTextColor(midGrey[0], midGrey[1], midGrey[2]);
                pdf.text("LAA Uplift Enhancement  |  Data Summary", margin + wWidth, headerStartY + 26);

                currentY = headerStartY + 34;

                // Thin separator line
                pdf.setDrawColor(180, 180, 180);
                pdf.setLineWidth(0.5);
                pdf.line(margin, currentY, pageW - margin, currentY);
                currentY += 16;  // Space below separator
            }

            // ── addFooter — stamped on every page after content is complete ─────
            // Shows "CONFIDENTIAL — FOR LAA SUBMISSION" and "Page X of Y".
            function addFooter(pageNum, totalPages) {
                const footerY = pageH - 30;
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(7);
                pdf.setTextColor(lightGrey[0], lightGrey[1], lightGrey[2]);
                pdf.text("CONFIDENTIAL — FOR LAA SUBMISSION", margin, footerY);
                pdf.text(
                    "Page " + pageNum + " of " + totalPages,
                    pageW / 2, footerY, { align: 'center' }
                );
                pdf.text("Woodruff Billing Ltd", pageW - margin, footerY, { align: 'right' });
            }

            // ── addText — core text helper with automatic page overflow ────────
            // When text would overflow, creates a new page with header first.
            function addText(text, options) {
                options = options || {};
                if (text === null || typeof text === 'undefined') return;

                const style = options.bold ? "bold" : (options.italic ? "italic" : "normal");
                const size = options.size || bodySize;
                const color = options.color || darkGrey;
                const lh = options.lineHeight || lineH;
                const indent = options.indent || 0;

                pdf.setFont("helvetica", style);
                pdf.setFontSize(size);
                pdf.setTextColor(color[0], color[1], color[2]);

                // Word-wrap text to fit available width
                const wrapped = pdf.splitTextToSize(String(text), contentW - indent);

                // Check if it fits — if not, new page
                if (currentY + (wrapped.length * lh) > pageH - footerZone - 10) {
                    pdf.addPage();
                    currentY = margin;
                    addHeader();
                    // Restore font after header
                    pdf.setFont("helvetica", style);
                    pdf.setFontSize(size);
                    pdf.setTextColor(color[0], color[1], color[2]);
                }

                pdf.text(wrapped, margin + indent, currentY);
                currentY += wrapped.length * lh;
                if (options.spaceAfter) currentY += options.spaceAfter;
            }

            // ── Section header — bold UPPERCASE with generous spacing ──────────
            function addSectionHeader(title) {
                currentY += sectionGap;
                addText(title.toUpperCase(), {
                    bold: true, size: 11, color: black, spaceAfter: 8
                });
            }

            // ── Detail line — "Label:  Value" on one line ──────────────────────
            function addDetail(label, value) {
                addText(label + ":  " + (value || "N/A"), {
                    size: bodySize, lineHeight: 11, spaceAfter: 4
                });
            }

            // ── Criterion — label, category, and explanation ───────────────────
            function addCriterion(criterionLabel, explanation, categoryTitle) {
                categoryTitle = categoryTitle || "";
                currentY += 4;  // Small gap before each criterion

                // Criterion label (bold, with bullet)
                addText("•  " + criterionLabel, {
                    bold: true, size: bodySize, lineHeight: 11,
                    spaceAfter: (explanation || categoryTitle) ? 2 : 6
                });

                // Category on its own line in grey italic (if present)
                if (categoryTitle) {
                    addText(categoryTitle, {
                        italic: true, size: 8, color: midGrey, indent: 14, spaceAfter: 2
                    });
                }

                // Explanation in blue italic, indented
                if (explanation) {
                    addText("Explanation: " + explanation, {
                        italic: true, size: 9, color: blue,
                        indent: 14, lineHeight: 11, spaceAfter: 6
                    });
                }
            }

            // ════════════════════════════════════════════════════════════════════
            //                      CONTENT RENDERING
            // ════════════════════════════════════════════════════════════════════

            // ── Page 1 header ──────────────────────────────────────────────────
            addHeader();

            // ── Document title (extra breathing room below header) ─────────────
            currentY += 8;
            addText("LAA Uplift Enhancement Data Summary", {
                bold: true, size: 16, color: black, spaceAfter: 6
            });

            // Generation metadata — UK date format
            const ukDate = new Date().toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            const versionText = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : '';
            addText("Generated: " + ukDate + "  |  Uplift Tool v" + versionText + " (" + LAA_GUIDE_VERSION_INFO_CONST + ")", {
                size: 8, italic: true, color: midGrey, spaceAfter: 10
            });

            // ── CASE DETAILS ───────────────────────────────────────────────────
            addSectionHeader("Case Details");
            addDetail("Fee Earner", formData.caseDetails.feeEarnerName);
            addDetail("Matter Type", formData.caseDetails.matterType);
            addDetail("Case / Matter Name", formData.caseDetails.caseMatterName);
            // Court is printed because it decides the ceiling under CAG 12.2,
            // and the person drafting the bill needs to know that before they
            // look at the percentage below. The three lines above are matched
            // by name in _narrator/extract.py; adding a fourth is safe, but the
            // existing three must keep their exact wording.
            addDetail("Court", formData.caseDetails.courtLevel);

            // ── PANEL MEMBERSHIP ───────────────────────────────────────────────
            addSectionHeader("Panel Membership");
            const panelSelected = Object.values(formData.panelMembership).some(function(item) { return item.checked; });
            if (panelSelected) {
                for (const key in formData.panelMembership) {
                    if (formData.panelMembership[key].checked) {
                        addText("•  " + formData.panelMembership[key].label, {
                            size: bodySize, spaceAfter: 4
                        });
                    }
                }
            } else {
                addText("None selected.", {
                    italic: true, size: bodySize, color: midGrey, spaceAfter: 6
                });
            }

            // ── STAGE 1: THRESHOLD TEST ────────────────────────────────────────
            addSectionHeader("Stage 1: Threshold Test Selections");
            // Stage 1 entries no longer carry an explanation, so addCriterion
            // prints the label and its limb and nothing else. The label strings
            // are the extraction contract that _narrator/extract.py matches on,
            // which is why they are printed verbatim from content-data.js.
            const s1Selected = Object.values(formData.stage1).some(function(item) { return item.checked; });
            if (s1Selected) {
                for (const key in formData.stage1) {
                    if (formData.stage1[key].checked) {
                        addCriterion(
                            formData.stage1[key].label,
                            formData.stage1[key].explanation,
                            formData.stage1[key].categoryTitle
                        );
                    }
                }
            } else {
                // Wording deliberately keeps "No Stage" and "selected": that is
                // the sentinel _narrator/extract.py looks for to tell an empty
                // section from a section it failed to parse.
                addText("No Stage 1 threshold factors selected.", {
                    italic: true, size: bodySize, color: midGrey, spaceAfter: 6
                });
            }

            // ── STAGE 2: LEVEL OF ENHANCEMENT (only if Stage 1 met) ───────────
            if (isAnyStage1ThresholdTrulyMet()) {
                addSectionHeader("Stage 2: Level of Enhancement Factors");
                const s2Selected = Object.values(formData.stage2).some(function(item) { return item.checked; });
                if (s2Selected) {
                    for (const key in formData.stage2) {
                        if (formData.stage2[key].checked) {
                            addCriterion(
                                formData.stage2[key].label,
                                formData.stage2[key].explanation,
                                formData.stage2[key].categoryTitle
                            );
                        }
                    }
                } else {
                    addText("No Stage 2 factors selected.", {
                        italic: true, size: bodySize, color: midGrey, spaceAfter: 6
                    });
                }
            }

            // ── PROPOSED UPLIFT ────────────────────────────────────────────────
            addSectionHeader("Proposed Uplift");
            addText("Proposed Uplift Percentage:  " + (formData.finalUpliftPercent || "Not Set") + "%", {
                bold: true, size: 13, color: black, spaceAfter: 10
            });
            // The ceiling, stated for the bill drafter as it is stated for the
            // solicitor. The figure above is the solicitor's own throughout —
            // this tool proposes none — so the ceiling is the only percentage
            // in this document that did not come from them.
            const ceilingForPdf = applicableCeilingPercent();
            if (ceilingForPdf !== null) {
                addText(
                    "Applicable ceiling for this court (CAG 12.2):  " + ceilingForPdf + "%",
                    { size: bodySize, color: midGrey, spaceAfter: 6 }
                );
            }

            // ── EVIDENCE ON FILE ───────────────────────────────────────────────
            //
            // Printed in both states, and never omitted. _narrator/extract.py
            // reads this line to decide whether the narrative may state that
            // the file holds supporting evidence, and a line that appeared only
            // when confirmed would make "no line" mean two different things:
            // the solicitor declined, or the PDF predates v1.11. The extractor
            // treats an absent line as not confirmed, which is right for the
            // old documents and would be wrong for a new one.
            addSectionHeader("Evidence on File");
            addText(
                "Evidence on file: " +
                (formData.evidenceOnFileConfirmed ? "Confirmed" : "Not confirmed"),
                { size: bodySize, spaceAfter: 4 }
            );
            addText(
                formData.evidenceOnFileConfirmed
                    ? "The fee earner confirms that evidence supporting the matters set out above is held on the case file."
                    : "The fee earner has not confirmed that supporting evidence is held on the case file. The narrative will not assert that it is.",
                { size: bodySize, italic: true, color: midGrey, spaceAfter: 6 }
            );

            // ── DISCLAIMER ─────────────────────────────────────────────────────
            currentY += sectionGap;

            // Bold heading line
            addText("DISCLAIMER", {
                bold: true, size: 8, color: lightGrey, spaceAfter: 4
            });

            // Disclaimer body — each line word-wrapped
            const disclaimerLines = [
                "This document has been generated using the Woodruff Billing Ltd. Uplift Justification Collator.",
                "It is intended for use by the named Fee Earner and for submission to Woodruff Billing Ltd. only.",
                "The information contained herein is based on the inputs provided by the solicitor and is for the purpose of assisting Woodruff Billing Ltd. in preparing an LAA enhancement claim.",
                "The Proposed Uplift % is the solicitor's own figure. This tool does not calculate or suggest a percentage. The final percentage claimed will be determined by Woodruff Billing Ltd. based on a full review, and the quantum of any enhancement is a matter for the Legal Aid Agency.",
                "Woodruff Billing Ltd. is not responsible for the accuracy or completeness of the information entered by the solicitor. The solicitor remains responsible for the veracity of their justifications."
            ];
            for (const line of disclaimerLines) {
                addText(line, {
                    size: 7, color: lightGrey, lineHeight: 9, spaceAfter: 2
                });
            }

            // ── Version info (end of document) ─────────────────────────────────
            currentY += 10;
            const appName = (typeof APP_NAME !== 'undefined') ? APP_NAME : 'Uplift Collator';
            const appReleaseDate = (typeof APP_RELEASE_DATE !== 'undefined') ? APP_RELEASE_DATE : '';
            addText(appName + " v" + versionText + (appReleaseDate ? " (" + appReleaseDate + ")" : ""), {
                italic: true, size: 7, color: lightGrey
            });

            // ── Stamp footer on every page (now we know total page count) ──────
            const totalPages = pdf.getNumberOfPages();
            for (let p = 1; p <= totalPages; p++) {
                pdf.setPage(p);
                addFooter(p, totalPages);
            }

            // ── Save ───────────────────────────────────────────────────────────
            pdf.save("LAA_Uplift_Data_Summary.pdf");

        } catch (e) {
            alert("Error generating PDF: " + e.message + "\n" + (e.stack ? e.stack : '(No stack trace)'));
            console.error("PDF generation error:", e);
        }
    }


    function showModalWithMarkdown(modalElement, contentDivElement, msgDivElement, markdownText) {
        if (!modalElement || !contentDivElement ) { console.error("Modal elements not found", modalElement, contentDivElement); return; }
        contentDivElement.innerHTML = '';
        if (msgDivElement) msgDivElement.style.display = 'none';
        contentDivElement.className = 'markdown-render-area';

        if (typeof marked !== 'undefined' && marked.parse) {
            try { contentDivElement.innerHTML = marked.parse(markdownText || ""); }
            catch (e) {
                contentDivElement.textContent = markdownText || "";
                if (msgDivElement) {
                    msgDivElement.textContent = "[Markdown library (Marked.js) error. Showing plain text.]";
                    msgDivElement.style.display = 'block';
                }
                console.error("Markdown parsing error:", e);
            }
        } else {
            contentDivElement.textContent = markdownText || "";
            if (msgDivElement) {
                msgDivElement.textContent = "[Marked.js library not loaded. Connect to internet. Showing plain text.]";
                msgDivElement.style.display = 'block';
            }
        }
        modalElement.style.display = 'block';
    }

    function clearSelectionsAndRestart(skipConfirm) {
        if (!skipConfirm && !confirm("Are you sure you want to clear all entries on all pages and restart from Page 1?\n\nThis also removes the draft saved in this browser.")) return;

        // The saved draft goes with it. Clearing the form and leaving a draft
        // on disk would mean the next person to open the tool is handed the
        // case the last one just finished with — and on a shared machine that
        // is a confidentiality problem, not only a nuisance.
        discardStoredDraft();

        formData.caseDetails = { feeEarnerName: "", matterType: "", caseMatterName: "", courtLevel: "" };
        formData.panelMembership = {}; formData.stage1 = {}; formData.stage2 = {}; formData.finalUpliftPercent = "";
        formData.evidenceOnFileConfirmed = false;

        [feeEarnerNameEl, caseMatterNameEl, finalProposedUpliftPercentEl].forEach(el => {if(el) el.value = '';});
        // Not in `formElements`, so the loop below does not reach it. A
        // confirmation carried over from the last case would be a statement
        // about a file nobody has looked at.
        if(evidenceOnFileConfirmedEl) evidenceOnFileConfirmedEl.checked = false;
        if(matterTypeEl) matterTypeEl.value = "";
        if(courtLevelEl) courtLevelEl.value = "";

        for (const key in formElements) {
            if (formElements[key].checkbox) formElements[key].checkbox.checked = false;
            if (formElements[key].explanationInput) {
                formElements[key].explanationInput.value = "";
                formElements[key].explanationInput.classList.remove('needs-attention');
            }
            if (formElements[key].explanationArea) formElements[key].explanationArea.style.display = 'none';
            if (formElements[key].carriedBadge) formElements[key].carriedBadge.hidden = true;
            if (formElements[key].itemContainer) formElements[key].itemContainer.classList.remove('carried-forward');
            if (formElements[key].whatCountsPanel) {
                formElements[key].whatCountsPanel.hidden = true;
                if (formElements[key].whatCountsToggle) {
                    formElements[key].whatCountsToggle.setAttribute('aria-expanded', 'false');
                    formElements[key].whatCountsToggle.classList.remove('is-open');
                }
            }
        }
        placeWhatCountsCaveat();
        Object.keys(carriedForwardApplied).forEach(key => { carriedForwardApplied[key] = false; });

        if(stage1FeedbackEl) stage1FeedbackEl.style.display = 'none';
        hideDraftRestoredBanner();
        updateStage2Visibility();
        updateUpliftCeilingStatement();
        updateCeilingBreachWarning();
        showPage(0);

        [feeEarnerNameEl, caseMatterNameEl, matterTypeEl, courtLevelEl].forEach(el => { if(el) _validateField(el, el.tagName === 'SELECT' ? 'select' : 'text'); });
        checkAllPlaceholdersAndExplanations();
    }


    // ═══════════════════════════════════════════════════════════════════════
    //                 SAVING AND RESTORING THE DRAFT
    // ═══════════════════════════════════════════════════════════════════════
    //
    // The solicitor is now writing substantial original prose in a browser tab
    // — a paragraph per Stage 2 factor, in their own words, that exists nowhere
    // else. Until v1.11 a closed tab, a crashed browser or an accidental
    // refresh destroyed all of it with no warning and no way back.
    //
    // localStorage keeps the draft on this computer, in this browser. It is
    // still true that no data leaves the machine: localStorage is not sent
    // anywhere, and there is no server to send it to. It does mean the case
    // text survives closing the browser, which is why "Clear All Page Entries"
    // now removes it and why the privacy note on page 1 says so plainly.
    //
    // The password gate is deliberately NOT persisted. It is entered afresh
    // every time, exactly as before.

    function draftSnapshot() {
        const checked = [];
        const explanations = {};
        QUESTION_BLOCKS.forEach(block => {
            block.checkboxes.forEach(chkData => {
                const el = formElements[chkData.key];
                if (!el) return;
                if (el.checkbox && el.checkbox.checked) checked.push(chkData.key);
                if (el.explanationInput && el.explanationInput.value.trim() !== "") {
                    explanations[chkData.key] = el.explanationInput.value;
                }
            });
        });
        return {
            appVersion: (typeof APP_VERSION !== 'undefined') ? APP_VERSION : "",
            savedAt: new Date().toISOString(),
            currentPageIndex: currentPageIndex,
            caseDetails: {
                feeEarnerName: feeEarnerNameEl ? feeEarnerNameEl.value : "",
                caseMatterName: caseMatterNameEl ? caseMatterNameEl.value : "",
                matterType: matterTypeEl ? matterTypeEl.value : "",
                courtLevel: courtLevelEl ? courtLevelEl.value : ""
            },
            finalUpliftPercent: finalProposedUpliftPercentEl ? finalProposedUpliftPercentEl.value : "",
            evidenceOnFileConfirmed: evidenceOnFileConfirmedEl ? evidenceOnFileConfirmedEl.checked : false,
            checked: checked,
            explanations: explanations
        };
    }

    // A draft with nothing in it is not a draft. Without this, simply opening
    // the tool would write a snapshot of the blank form, and the next visit
    // would announce "draft restored" over an empty page — which would teach
    // the solicitor to ignore the banner, at which point it stops working on
    // the day it matters.
    function draftIsEmpty(snapshot) {
        const caseDetails = snapshot.caseDetails || {};
        const anyCaseDetail = Object.keys(caseDetails).some(k => String(caseDetails[k] || "").trim() !== "");
        return !anyCaseDetail
            && String(snapshot.finalUpliftPercent || "").trim() === ""
            && (snapshot.checked || []).length === 0
            && Object.keys(snapshot.explanations || {}).length === 0;
    }

    function persistDraftNow() {
        if (!feeEarnerNameEl) return;   // main app not built yet
        const snapshot = draftSnapshot();
        if (draftIsEmpty(snapshot)) { discardStoredDraft(); return; }
        try {
            window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(snapshot));
        } catch (e) {
            // Private browsing, a full quota, or storage disabled by policy.
            // Nothing to do about it, and nothing worth interrupting the
            // solicitor over — but say so in the console so that a support
            // question about a lost draft has an answer.
            console.warn("Draft could not be saved in this browser:", e);
        }
    }

    // Debounced, because this fires on every keystroke in a textarea.
    function persistDraft() {
        if (draftSaveTimer) clearTimeout(draftSaveTimer);
        draftSaveTimer = setTimeout(persistDraftNow, 400);
    }

    function discardStoredDraft() {
        if (draftSaveTimer) { clearTimeout(draftSaveTimer); draftSaveTimer = null; }
        try { window.localStorage.removeItem(DRAFT_STORAGE_KEY); }
        catch (e) { console.warn("Draft could not be removed from this browser:", e); }
    }

    function hideDraftRestoredBanner() {
        if (draftRestoredBannerEl) draftRestoredBannerEl.style.display = 'none';
    }

    // Returns the page index to open on, or -1 when there was no draft.
    function restoreDraftIfPresent() {
        let raw = null;
        try { raw = window.localStorage.getItem(DRAFT_STORAGE_KEY); }
        catch (e) { return -1; }
        if (!raw) return -1;

        let draft;
        try { draft = JSON.parse(raw); }
        catch (e) {
            // A draft we cannot read is worse than none: it would restore
            // half a case. Throw it away rather than guess at it.
            console.warn("Saved draft could not be read and has been discarded:", e);
            discardStoredDraft();
            return -1;
        }
        if (!draft || typeof draft !== 'object') { discardStoredDraft(); return -1; }
        if (draftIsEmpty(draft)) { discardStoredDraft(); return -1; }

        const caseDetails = draft.caseDetails || {};
        if (feeEarnerNameEl) feeEarnerNameEl.value = caseDetails.feeEarnerName || "";
        if (caseMatterNameEl) caseMatterNameEl.value = caseDetails.caseMatterName || "";
        if (matterTypeEl) matterTypeEl.value = caseDetails.matterType || "";
        if (courtLevelEl) courtLevelEl.value = caseDetails.courtLevel || "";
        if (finalProposedUpliftPercentEl) finalProposedUpliftPercentEl.value = draft.finalUpliftPercent || "";
        if (evidenceOnFileConfirmedEl) evidenceOnFileConfirmedEl.checked = draft.evidenceOnFileConfirmed === true;

        (Array.isArray(draft.checked) ? draft.checked : []).forEach(key => {
            if (formElements[key] && formElements[key].checkbox) formElements[key].checkbox.checked = true;
        });
        const explanations = draft.explanations || {};
        Object.keys(explanations).forEach(key => {
            if (formElements[key] && formElements[key].explanationInput) {
                formElements[key].explanationInput.value = explanations[key];
            }
        });

        // Show the explanation areas belonging to restored ticks.
        QUESTION_BLOCKS.forEach(block => {
            block.checkboxes.forEach(chkData => {
                const el = formElements[chkData.key];
                if (el && el.explanationArea) toggleExplanationInput(chkData.key, el.checkbox.checked);
            });
        });

        // Repaint the carried-forward marks, but tick nothing new: the draft
        // records what the solicitor decided, and carry-forward must not
        // overrule a Stage 2 item they deliberately unticked before closing.
        refreshStage1CarryForward(false);

        syncFormDataFromDom();
        updateStage2Visibility();
        updateUpliftCeilingStatement();
        updateCeilingBreachWarning();
        [feeEarnerNameEl, caseMatterNameEl, matterTypeEl, courtLevelEl].forEach(el => {
            if (el) _validateField(el, el.tagName === 'SELECT' ? 'select' : 'text');
        });

        showDraftRestoredBanner(draft);

        const savedPage = Number(draft.currentPageIndex);
        if (!isFinite(savedPage) || savedPage < 0 || savedPage >= pageDivs.length) return 0;
        return savedPage;
    }

    // A restore is never silent. Someone opening the tool a week later must be
    // able to see at a glance that this is last week's case and not a blank
    // form — and must be able to throw it away in one click if it is not the
    // case they came to work on.
    function showDraftRestoredBanner(draft) {
        if (!draftRestoredBannerEl || !draftRestoredMessageEl) return;

        let when = "";
        if (draft.savedAt) {
            const savedDate = new Date(draft.savedAt);
            if (!isNaN(savedDate.getTime())) {
                // UK order throughout: 4 August 2026 at 14:22.
                when = savedDate.toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                }) + " at " + savedDate.toLocaleTimeString('en-GB', {
                    hour: '2-digit', minute: '2-digit'
                });
            }
        }

        const caseName = (draft.caseDetails && draft.caseDetails.caseMatterName) ? draft.caseDetails.caseMatterName : "";
        draftRestoredMessageEl.textContent =
            "Draft restored" + (caseName ? ` for ${caseName}` : "") +
            (when ? `, saved on this computer on ${when}.` : ".") +
            " Carry on where you left off, or:";
        draftRestoredBannerEl.style.display = 'flex';
    }


    function attachEventListeners() {
        if (nextButton) nextButton.onclick = nextPage;
        if (backButton) backButton.onclick = prevPage;
        if (generatePdfSummaryButton) generatePdfSummaryButton.onclick = generatePdfSummary;

        if (mainHelpButtonLarge) {
            mainHelpButtonLarge.onclick = () => showModalWithMarkdown(helpModal, helpContentDiv, markdownMissingMsgMainEl, MAIN_HELP_TEXT_MARKDOWN);
        }
        if (clearAllEntriesLinkRightCol) clearAllEntriesLinkRightCol.onclick = (e) => { e.preventDefault(); clearSelectionsAndRestart(); };
        if (viewLaaGuideLinkRightCol) viewLaaGuideLinkRightCol.onclick = (e) => { e.preventDefault(); window.open(LAA_GUIDE_URL, '_blank');};

        if (finalUpliftGuidanceButton) finalUpliftGuidanceButton.onclick = (e) => {
            e.preventDefault();
            showModalWithMarkdown(upliftGuidanceModal, upliftGuidanceContentDiv, markdownMissingMsgUpliftEl, UPLIFT_PERCENTAGE_GUIDANCE_TEXT);
        };

        if (termsLinkFooter) {
            termsLinkFooter.onclick = (e) => {
                e.preventDefault();
                if (termsModal && termsModalContent && TERMS_AND_CONDITIONS_MARKDOWN) {
                    showModalWithMarkdown(termsModal, termsModalContent, null, TERMS_AND_CONDITIONS_MARKDOWN);
                } else {
                    console.error("Terms modal elements or content not found.");
                    alert("Terms and Conditions content is currently unavailable.");
                }
            };
        }

        if (closeHelpModalButton) closeHelpModalButton.onclick = () => helpModal.style.display = 'none';
        if (closeUpliftGuidanceModalButton) closeUpliftGuidanceModalButton.onclick = () => upliftGuidanceModal.style.display = 'none';
        if (closeContextualHelpModalButton) closeContextualHelpModalButton.onclick = () => contextualHelpModal.style.display = 'none';
        if (closeTermsModalButton) closeTermsModalButton.onclick = () => { if (termsModal) termsModal.style.display = 'none';};

        window.onclick = (event) => {
            if (event.target === helpModal) helpModal.style.display = 'none';
            if (event.target === upliftGuidanceModal) upliftGuidanceModal.style.display = 'none';
            if (event.target === contextualHelpModal) contextualHelpModal.style.display = 'none';
            if (event.target === termsModal) termsModal.style.display = 'none';
        };

        document.querySelectorAll('.contextual-help-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const helpKey = e.target.dataset.helpkey;
                const helpData = CONTEXTUAL_HELP_TEXTS[helpKey];
                if (helpData && contextualHelpModal && contextualHelpTitleEl && contextualHelpContentEl) {
                    contextualHelpTitleEl.textContent = helpData.title || "Help Information";
                    showModalWithMarkdown(contextualHelpModal, contextualHelpContentEl, null, helpData.content);
                } else if (helpData) {
                    alert(helpData.content.replace(/### (.*?)\n/g, '$1\n').replace(/[*#]/g, ''));
                } else {
                    alert("Help content for this item is not available.");
                }
            });
        });

        [feeEarnerNameEl, caseMatterNameEl].forEach(el => {
            if(el) el.addEventListener('input', () => { validateField(el, 'text'); persistDraft(); });
        });
        if(matterTypeEl) matterTypeEl.addEventListener('change', () => { validateField(matterTypeEl, 'select'); persistDraft(); });
        if(courtLevelEl) {
            courtLevelEl.addEventListener('change', () => {
                validateField(courtLevelEl, 'select');
                // The ceiling sentence is rebuilt straight away rather than on
                // arrival at the final page, so that someone who corrects the
                // court and pages forward is never shown the old ceiling.
                saveCaseDetailsFromDom();
                updateUpliftCeilingStatement();
                updateCeilingBreachWarning();
                checkAllPlaceholdersAndExplanations();
                persistDraft();
            });
        }
        if(finalProposedUpliftPercentEl) {
            finalProposedUpliftPercentEl.addEventListener('input', () => {
                validateField(finalProposedUpliftPercentEl, 'number');
                updateCeilingBreachWarning();
                checkAllPlaceholdersAndExplanations();
                persistDraft();
            });
        }

        // No call to checkAllPlaceholdersAndExplanations here, and that is the
        // decision rather than an omission: this tick is optional, so it can
        // never change whether the download button is enabled.
        if (evidenceOnFileConfirmedEl) {
            evidenceOnFileConfirmedEl.addEventListener('change', () => {
                saveFinalUpliftFromDom();
                persistDraft();
            });
        }

        if (discardDraftButtonEl) {
            discardDraftButtonEl.addEventListener('click', () => {
                if (!confirm("Discard the restored draft and start a blank form?\n\nThe saved draft will be removed from this browser and cannot be recovered.")) return;
                clearSelectionsAndRestart(true);
            });
        }

        // A debounced save can still be in flight when the tab goes away, so
        // flush it the moment the page is hidden. This is the case the whole
        // feature exists for: the tab closed mid-sentence.
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') persistDraftNow();
        });
        window.addEventListener('pagehide', persistDraftNow);
    }

    // Main app initialization is now deferred until password success.
});