// --- Globally Scoped Functions (called by HTML on... attributes) ---
let _updateSuggestedPercentage = () => console.warn("updateSuggestedPercentage called before DOM fully ready");
let _validateField = (el, type) => console.warn("validateField called before DOM fully ready for:", el, type);
let _checkAllPlaceholdersAndExplanationsGlobally = () => console.warn("checkAllPlaceholdersAndExplanationsGlobally called before DOM fully ready");


function updateSuggestedPercentage() { _updateSuggestedPercentage(); }
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
    let feeEarnerNameEl, matterTypeEl, caseMatterNameEl;
    let panelMembershipContainerOnPage1, preStageIntroTextOnPage1, stage1ContainerOnPage2, stage1FeedbackEl;
    let stage2ContainerOnPage3, stage2IntroNoteEl;
    let reviewSummaryEl, finalProposedUpliftPercentEl, finalSuggestedPercentageDisplayEl, finalUpliftGuidanceButton;
    let helpModal, closeHelpModalButton, markdownMissingMsgMainEl, helpContentDiv;
    let upliftGuidanceModal, closeUpliftGuidanceModalButton, markdownMissingMsgUpliftEl, upliftGuidanceContentDiv;
    let contextualHelpModal, contextualHelpTitleEl, contextualHelpContentEl, closeContextualHelpModalButton;
    let termsModal, termsModalContent, closeTermsModalButton, termsLinkFooter;

    const formElements = {};
    const formData = {
        caseDetails: { feeEarnerName: "", matterType: "", caseMatterName: "" },
        panelMembership: {}, stage1: {}, stage2: {}, finalUpliftPercent: ""
    };
    let currentPageIndex = 0;
    const MIN_EXPLANATION_WORDS = 10;


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

        panelMembershipContainerOnPage1 = document.getElementById('panelMembershipContainer');
        preStageIntroTextOnPage1 = document.getElementById('preStageIntroText');
        stage1ContainerOnPage2 = document.getElementById('stage1Container');
        stage1FeedbackEl = document.getElementById('stage1Feedback');
        stage2ContainerOnPage3 = document.getElementById('stage2Container');
        stage2IntroNoteEl = document.getElementById('stage2IntroNote');

        reviewSummaryEl = document.getElementById('reviewSummary');
        finalProposedUpliftPercentEl = document.getElementById('finalProposedUpliftPercent');
        finalSuggestedPercentageDisplayEl = document.getElementById('finalSuggestedPercentageDisplay');
        finalUpliftGuidanceButton = document.getElementById('finalUpliftHelpLink');

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
    _updateSuggestedPercentage = function() {
        if (!feeEarnerNameEl) return; // Ensure main app elements are initialized

        let panelUplift = 0;
        let generalFactorsUplift = 0;

        // 1. Calculate Panel Uplift
        const panelBlock = QUESTION_BLOCKS.find(b => b.id === 'panel');
        const panelKeys = panelBlock ? panelBlock.checkboxes.map(cb => cb.key) : [];
        let isPanelMember = false;

        if (feeEarnerNameEl.value.trim() !== "") { // Check if fee earner name is provided
            for (const key of panelKeys) {
                if (formElements[key] && formElements[key].checkbox.checked) {
                    isPanelMember = true;
                    break;
                }
            }
        }
        if (isPanelMember) {
            panelUplift = 15;
        }

        // 2. Calculate General Factors Uplift
        let generalFactorsCount = 0;
        QUESTION_BLOCKS.forEach(block => {
            // Skip the panel block itself for general factor counting.
            // Panel membership contribution is handled by panelUplift.
            if (block.id === 'panel') {
                return; // Skips to the next block in QUESTION_BLOCKS
            }

            const mainToggleIsActive = block.main_toggle_id ? (formElements[block.main_toggle_id] && formElements[block.main_toggle_id].checkbox.checked) : true;

            let blockIsEffectivelyVisibleForGeneralCounting = false;
            if (block.page === 2 && mainToggleIsActive) { // Stage 1 factors
                blockIsEffectivelyVisibleForGeneralCounting = true;
            } else if (block.page === 3) { // Stage 2 factors
                if (isAnyStage1ThresholdTrulyMet()) { // Only count Stage 2 if Stage 1 threshold is met
                    if (mainToggleIsActive) { // If it has a main toggle (some Stage 2 blocks might not)
                         blockIsEffectivelyVisibleForGeneralCounting = true;
                    } else if (!block.main_toggle_id) { // If it's a direct Stage 2 factor block without a toggle
                         blockIsEffectivelyVisibleForGeneralCounting = true;
                    }
                }
            }
            // Note: Page 1 general factors (if any, besides panel) are not explicitly handled here
            // as current QUESTION_BLOCKS only has 'panel' on page 1.

            if (blockIsEffectivelyVisibleForGeneralCounting) {
                block.checkboxes.forEach(chkData => {
                    if (formElements[chkData.key] && formElements[chkData.key].checkbox.checked) {
                        if (chkData.explanation && formElements[chkData.key].explanationInput) {
                            if (formElements[chkData.key].explanationInput.value.trim().split(/\s+/).filter(Boolean).length >= MIN_EXPLANATION_WORDS) {
                                generalFactorsCount++;
                            }
                        } else if (!chkData.explanation) { // Count items that don't require explanation if checked
                            generalFactorsCount++;
                        }
                    }
                });
            }
        });

        generalFactorsUplift = generalFactorsCount * 10;

        // 3. Determine final suggested percentage
        let suggestedPercentage = Math.max(panelUplift, generalFactorsUplift);

        // 4. Apply overall cap (illustrative general cap for most cases)
        if (suggestedPercentage > 50) {
            suggestedPercentage = 50;
        }

        if (finalSuggestedPercentageDisplayEl) {
            finalSuggestedPercentageDisplayEl.textContent = `Suggested: ${suggestedPercentage}%`;
        }
    };


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
                <p>The LAA enhancement process involves two main stages:</p>
                <ul class="intro-list">
                    <li>Stage 1: A Threshold Test (to determine if <em>any</em> uplift is justifiable).</li>
                    <li>Stage 2: Determination of the Level of Enhancement (to justify the percentage claimed).</li>
                </ul>
                <p>This tool will guide you through providing the necessary information for both stages.</p>
            `;
        }
        if (stage2IntroNoteEl) {
            stage2IntroNoteEl.innerHTML = `
                <p>You have indicated that the Stage 1 threshold for claiming an enhancement has been met.</p>
                <p>As such, <em>any</em> of these Stage 2 factors can now help determine the appropriate <strong>percentage of enhancement</strong>.</p>
                <p>Your robust justifications here are crucial for supporting the level of uplift claimed.</p>
            `;
        }
        buildQuestionnaire();
        showPage(0);
        attachEventListeners();
        updateSuggestedPercentage();
        checkAllPlaceholdersAndExplanations();
    }

    function showPage(pageIndexToShow) {
        pageDivs.forEach((page, index) => {
            if (page) page.style.display = (index === pageIndexToShow) ? 'block' : 'none';
        });
        navSteps.forEach((step, index) => {
            if (step) {
                step.classList.remove('active', 'completed');
                if (index === pageIndexToShow) step.classList.add('active');
                else if (index < pageIndexToShow) step.classList.add('completed');
            }
        });

        const pageTitles = [
            "Uplift Justification Collator - Case Details & Panel",
            "Overview of LAA Enhancement Stages",
            "Stage 2: Determining Level of Enhancement",
            "Statement Review",
            "Finalise & Download"
        ];
        if (mainFormTitleEl) mainFormTitleEl.textContent = pageTitles[pageIndexToShow] || "Uplift Justification Collator";

        if (backButton) backButton.style.display = pageIndexToShow > 0 ? 'inline-flex' : 'none';
        if (nextButton) nextButton.style.display = pageIndexToShow < pageDivs.length - 1 ? 'inline-flex' : 'none';
        if (generatePdfSummaryButton) generatePdfSummaryButton.style.display = pageIndexToShow === pageDivs.length - 1 ? 'inline-flex' : 'none';

        if (pageIndexToShow === 3) {
            populateReviewSummary();
        }
        if (pageIndexToShow === pageDivs.length - 1) {
            updateSuggestedPercentage();
            if(formData.finalUpliftPercent !== null && formData.finalUpliftPercent !== "" && finalProposedUpliftPercentEl) {
                 finalProposedUpliftPercentEl.value = formData.finalUpliftPercent;
            } else if (finalProposedUpliftPercentEl && finalSuggestedPercentageDisplayEl) {
                const suggestedMatch = finalSuggestedPercentageDisplayEl.textContent.match(/\d+/);
                if (suggestedMatch) finalProposedUpliftPercentEl.value = suggestedMatch[0];
            }
             validateField(finalProposedUpliftPercentEl, 'number');
            checkAllPlaceholdersAndExplanations();
        }
        currentPageIndex = pageIndexToShow;
        window.scrollTo(0,0);
    }

    function nextPage() {
        if (!validateCurrentPage()) return;
        saveCurrentPageData();
        let nextPageIndex = currentPageIndex + 1;

        if (currentPageIndex === 1) {
            if (!isAnyStage1ThresholdTrulyMet()) {
                const panelBlock = QUESTION_BLOCKS.find(b => b.id === 'panel');
                const panelKeys = panelBlock ? panelBlock.checkboxes.map(cb => cb.key) : [];
                let isPanelMember = false;
                if (feeEarnerNameEl && feeEarnerNameEl.value.trim() !== "") {
                    for (const key of panelKeys) {
                        if (formElements[key] && formElements[key].checkbox.checked) {
                            isPanelMember = true; break;
                        }
                    }
                }

                if (isPanelMember) {
                    alert("The general LAA threshold for enhancement (Stage 1) has not been met with sufficient explanation.\n\nHowever, as panel membership is indicated, Woodruff Billing Ltd. will assess the 15% panel uplift separately if applicable to the work items.\n\nNo further action is required in this tool for the panel-only uplift, and a PDF summary for this scenario is not typically generated by this tool. You may wish to clear entries and restart if you believe the Stage 1 threshold can be met with further detail.");
                    return;
                } else {
                    alert("The LAA threshold for enhancement (Stage 1) has not been met with sufficient explanation, and no panel membership (for automatic 15% consideration) is indicated.\n\nAn enhancement claim is unlikely to succeed. Please review your Stage 1 selections and explanations if you believe the threshold can be met.\n\nIf not, no further action is required in this tool. You may wish to clear entries and restart.");
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
            [feeEarnerNameEl, caseMatterNameEl, matterTypeEl].forEach(field => {
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
            const mainToggleChecked = block.main_toggle_id ? (formElements[block.main_toggle_id] && formElements[block.main_toggle_id].checkbox.checked) : true;

            let isBlockEffectivelyVisibleForValidation = false;
            if (block.page === 1) {
                isBlockEffectivelyVisibleForValidation = true;
            } else if (block.page === 2) {
                isBlockEffectivelyVisibleForValidation = true;
            } else if (block.page === 3) {
                isBlockEffectivelyVisibleForValidation = isAnyStage1ThresholdTrulyMet();
            }

            if (mainToggleChecked && isBlockEffectivelyVisibleForValidation) {
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

    function saveCurrentPageData() {
        if (currentPageIndex === 0) {
            formData.caseDetails.feeEarnerName = feeEarnerNameEl.value.trim();
            formData.caseDetails.matterType = matterTypeEl.value;
            formData.caseDetails.caseMatterName = caseMatterNameEl.value.trim();
            formData.panelMembership = {};
            QUESTION_BLOCKS.filter(b => b.page === 1 && b.id === 'panel').forEach(block => {
                block.checkboxes.forEach(chkData => {
                    if (formElements[chkData.key] && formElements[chkData.key].checkbox.checked) {
                        formData.panelMembership[chkData.key] = { checked: true, label: chkData.label };
                    } else { delete formData.panelMembership[chkData.key]; }
                });
            });
        } else if (currentPageIndex === 1) {
            formData.stage1 = {};
            QUESTION_BLOCKS.filter(b => b.page === 2).forEach(block => {
                if (formElements[block.main_toggle_id] && formElements[block.main_toggle_id].checkbox.checked) {
                    block.checkboxes.forEach(chkData => {
                        if (formElements[chkData.key] && formElements[chkData.key].checkbox.checked) {
                            formData.stage1[chkData.key] = { checked: true, label: chkData.label, explanation: formElements[chkData.key].explanationInput?.value.trim() || "", categoryTitle: block.title };
                        } else { delete formData.stage1[chkData.key]; }
                    });
                } else if (block.main_toggle_id) {
                     block.checkboxes.forEach(chkData => delete formData.stage1[chkData.key]);
                }
            });
        } else if (currentPageIndex === 2) {
            formData.stage2 = {};
            QUESTION_BLOCKS.filter(b => b.page === 3).forEach(block => {
                const blockDiv = document.getElementById(`${block.id}-block`);
                if (blockDiv && blockDiv.style.display !== 'none') {
                    block.checkboxes.forEach(chkData => {
                        if (formElements[chkData.key] && formElements[chkData.key].checkbox.checked) {
                            formData.stage2[chkData.key] = { checked: true, label: chkData.label, explanation: formElements[chkData.key].explanationInput?.value.trim() || "", categoryTitle: block.title };
                        } else { delete formData.stage2[chkData.key]; }
                    });
                }
            });
        } else if (currentPageIndex === pageDivs.length - 1) {
            formData.finalUpliftPercent = finalProposedUpliftPercentEl.value;
        }
    }


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
            let targetContainer;
            if (block.page === 1 && block.id === 'panel') targetContainer = containers.page1Panel;
            else if (block.page === 2) targetContainer = containers.page2Stage1;
            else if (block.page === 3) targetContainer = containers.page3Stage2;
            else return;

            const blockDiv = document.createElement('div');
            blockDiv.className = 'form-section';
            blockDiv.id = `${block.id}-block`;
            const titleEl = document.createElement('h3');
            titleEl.textContent = block.title;
            blockDiv.appendChild(titleEl);

            const optionsContainerParent = document.createElement('div');
            blockDiv.appendChild(optionsContainerParent);

            if (block.main_question_text) {
                const mainLabel = document.createElement('label');
                mainLabel.className = 'main-question-label';
                const mainToggleInput = document.createElement('input');
                mainToggleInput.type = 'checkbox';
                mainToggleInput.id = block.main_toggle_id;
                mainToggleInput.onchange = () => toggleSubOptions(block.id, mainToggleInput.checked);
                formElements[block.main_toggle_id] = { checkbox: mainToggleInput };
                mainLabel.appendChild(mainToggleInput);
                mainLabel.appendChild(document.createTextNode(` ${block.main_question_text}`));
                optionsContainerParent.appendChild(mainLabel);

                const subOptionsDiv = document.createElement('div');
                subOptionsDiv.className = 'sub-options-grid';
                subOptionsDiv.id = `${block.id}-sub-options`;
                subOptionsDiv.style.display = 'none';
                optionsContainerParent.appendChild(subOptionsDiv);
                block.checkboxes.forEach(chkData => createCheckboxItem(chkData, subOptionsDiv, block));
            } else {
                optionsContainerParent.className = block.id === 'panel' ? 'panel-options' : 'sub-options-grid';
                block.checkboxes.forEach(chkData => createCheckboxItem(chkData, optionsContainerParent, block));
            }
            if(targetContainer) targetContainer.appendChild(blockDiv);
        });
        updateStage2Visibility();
        updateSuggestedPercentage();
    }

    function createCheckboxItem(chkData, parentContainer, blockInfo) {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'checkbox-item-container';
        // Use <label> (not <div>) so clicking the text toggles the checkbox.
        const labelContainer = document.createElement('label');
        labelContainer.className = 'checkbox-label-container';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = chkData.key;
        input.onchange = () => {
            toggleExplanationInput(chkData.key, input.checked);
            updateSuggestedPercentage();
            if (blockInfo.page === 2) {
                updateStage2Visibility();
            }
            checkAllPlaceholdersAndExplanations();
        };
        labelContainer.appendChild(input);
        labelContainer.appendChild(document.createTextNode(` ${chkData.label}`));
        itemContainer.appendChild(labelContainer);
        formElements[chkData.key] = { checkbox: input };

        if (chkData.explanation) {
            const explanationTextarea = document.createElement('textarea');
            explanationTextarea.className = 'explanation-input';
            explanationTextarea.id = `${chkData.key}-explanation`;
            explanationTextarea.placeholder = chkData.placeholder_example ? chkData.placeholder_example : `Provide specific details (approx ${MIN_EXPLANATION_WORDS}+ words)...`;
            explanationTextarea.rows = 2;
            explanationTextarea.oninput = () => {
                checkExplanation(explanationTextarea, chkData.key);
                updateSuggestedPercentage();
                checkAllPlaceholdersAndExplanations();
                if (blockInfo.page === 2) {
                    updateStage2Visibility();
                }
            };
            itemContainer.appendChild(explanationTextarea);
            formElements[chkData.key].explanationInput = explanationTextarea;
            explanationTextarea.style.display = 'none';
        }
        parentContainer.appendChild(itemContainer);
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
        if (formElements[key] && formElements[key].explanationInput) {
            formElements[key].explanationInput.style.display = isChecked ? 'block' : 'none';
            if (!isChecked) {
                formElements[key].explanationInput.classList.remove('needs-attention');
            } else {
                checkExplanation(formElements[key].explanationInput, key);
            }
        }
    }

    function toggleSubOptions(blockId, isChecked) {
        const subOptionsDiv = document.getElementById(`${blockId}-sub-options`);
        if (subOptionsDiv) {
            const blockData = QUESTION_BLOCKS.find(b => b.id === blockId);
            subOptionsDiv.style.display = isChecked ? 'block' : 'none';
            if (blockData) {
                blockData.checkboxes.forEach(chkData => {
                    if (formElements[chkData.key] && formElements[chkData.key].checkbox) {
                        if (!isChecked) {
                            formElements[chkData.key].checkbox.checked = false;
                        }
                        toggleExplanationInput(chkData.key, formElements[chkData.key].checkbox.checked);
                    }
                });
            }
        }
        updateStage2Visibility();
    }


    function isAnyStage1ThresholdTrulyMet() {
        let met = false;
        for (const block of QUESTION_BLOCKS) {
            if (block.page === 2 && block.main_toggle_id) {
                if (formElements[block.main_toggle_id] && formElements[block.main_toggle_id].checkbox.checked) {
                    for (const chkData of block.checkboxes) {
                        if (formElements[chkData.key] && formElements[chkData.key].checkbox.checked) {
                            if (chkData.explanation && formElements[chkData.key].explanationInput) {
                                if (formElements[chkData.key].explanationInput.value.trim().split(/\s+/).filter(Boolean).length >= MIN_EXPLANATION_WORDS) {
                                    met = true; break;
                                }
                            } else if (!chkData.explanation) {
                                met = true; break;
                            }
                        }
                    }
                }
            }
            if(met) break;
        }
        return met;
    }
    window.isAnyStage1ThresholdTrulyMetGlobally = isAnyStage1ThresholdTrulyMet;

    function updateStage2Visibility() {
        const isS1Met = isAnyStage1ThresholdTrulyMet();
        if(stage1FeedbackEl) stage1FeedbackEl.style.display = isS1Met ? 'block' : 'none';

        QUESTION_BLOCKS.filter(b => b.page === 3).forEach(block => {
            const blockDiv = document.getElementById(`${block.id}-block`);
            if (blockDiv) {
                blockDiv.style.display = isS1Met ? 'block' : 'none';
            }
        });

        if (!isS1Met) {
            formData.stage2 = {};
            QUESTION_BLOCKS.filter(b => b.page === 3).forEach(block => {
                block.checkboxes.forEach(chkData => {
                    if (formElements[chkData.key] && formElements[chkData.key].checkbox) {
                        formElements[chkData.key].checkbox.checked = false;
                        toggleExplanationInput(chkData.key, false);
                    }
                });
            });
        }
        updateSuggestedPercentage();
        checkAllPlaceholdersAndExplanations();
    }

    function checkAllPlaceholdersAndExplanations() {
        let allValid = true;
        if (!feeEarnerNameEl || !caseMatterNameEl || !matterTypeEl ||
            !feeEarnerNameEl.value.trim() || !caseMatterNameEl.value.trim() || !matterTypeEl.value) {
            allValid = false;
        }
        if (finalProposedUpliftPercentEl &&
            (finalProposedUpliftPercentEl.value.trim() === "" || isNaN(parseFloat(finalProposedUpliftPercentEl.value.trim())) || parseFloat(finalProposedUpliftPercentEl.value.trim()) <0 )) {
            allValid = false;
        }

        QUESTION_BLOCKS.forEach(block => {
            const mainToggleIsActive = block.main_toggle_id ? (formElements[block.main_toggle_id] && formElements[block.main_toggle_id].checkbox.checked) : true;

            let blockIsEffectivelyVisible = false;
            if (block.page === 1) blockIsEffectivelyVisible = true;
            else if (block.page === 2 && mainToggleIsActive) blockIsEffectivelyVisible = true;
            else if (block.page === 3 && mainToggleIsActive && isAnyStage1ThresholdTrulyMet()) blockIsEffectivelyVisible = true;
            else if (block.page === 3 && !block.main_toggle_id && isAnyStage1ThresholdTrulyMet()) blockIsEffectivelyVisible = true;


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
            generatePdfSummaryButton.title = allValid ? "Generate PDF Summary of your selections." : "Complete all Case Details, Proposed Uplift %, and ensure ticked items have valid explanations (approx. 10+ words).";
        }
    }

    function populateReviewSummary() {
        if (!reviewSummaryEl) return;
        let summaryHtml = "<h2>Summary of Your Input:</h2>";

        summaryHtml += "<h3>Case Details:</h3>";
        summaryHtml += `<p><strong>Fee Earner:</strong> ${formData.caseDetails.feeEarnerName || "<em>Not provided</em>"}</p>`;
        summaryHtml += `<p><strong>Matter Type:</strong> ${formData.caseDetails.matterType || "<em>Not selected</em>"}</p>`;
        summaryHtml += `<p><strong>Case / Matter Name:</strong> ${formData.caseDetails.caseMatterName || "<em>Not provided</em>"}</p>`;

        summaryHtml += "<h3>Panel Membership:</h3>";
        let panelSelected = Object.values(formData.panelMembership).some(item => item.checked);
        if (panelSelected) {
            for (const key in formData.panelMembership) {
                if (formData.panelMembership[key].checked) summaryHtml += `<p>- ${formData.panelMembership[key].label}</p>`;
            }
        } else { summaryHtml += "<p><em>No panel membership selected.</em></p>"; }

        summaryHtml += "<h3>Stage 1: Threshold Test Selections:</h3>";
        let s1Selected = Object.values(formData.stage1).some(item => item.checked);
        if (s1Selected) {
            for (const key in formData.stage1) {
                if (formData.stage1[key].checked) {
                    summaryHtml += `<p><strong>${formData.stage1[key].label}</strong> (<em>${formData.stage1[key].categoryTitle}</em>):</p>`;
                    const explanation = formData.stage1[key].explanation ? formData.stage1[key].explanation.replace(/\n/g, "<br />    ") : "";
                    const wordCount = formData.stage1[key].explanation ? formData.stage1[key].explanation.trim().split(/\s+/).filter(Boolean).length : 0;
                    const isExplanationRequired = QUESTION_BLOCKS.flatMap(b => b.checkboxes).find(c => c.key === key)?.explanation;
                    const isValidExplanation = !isExplanationRequired || wordCount >= MIN_EXPLANATION_WORDS;
                    summaryHtml += `<div class="explanation-review ${!isValidExplanation && isExplanationRequired ? 'needs-attention-review' : ''}">${explanation || (isExplanationRequired ? "<em>Explanation missing or insufficient.</em>" : "<em>No explanation required.</em>")}</div>`;
                }
            }
        } else { summaryHtml += "<p><em>No Stage 1 criteria met/selected with valid explanation.</em></p>"; }

        if (isAnyStage1ThresholdTrulyMet()) {
            summaryHtml += "<h3>Stage 2: Level of Enhancement Factors:</h3>";
            let s2Selected = Object.values(formData.stage2).some(item => item.checked);
            if (s2Selected) {
                for (const key in formData.stage2) {
                    if (formData.stage2[key].checked) {
                        summaryHtml += `<p><strong>${formData.stage2[key].label}</strong> (<em>${formData.stage2[key].categoryTitle}</em>):</p>`;
                        const explanation = formData.stage2[key].explanation ? formData.stage2[key].explanation.replace(/\n/g, "<br />    ") : "";
                        const wordCount = formData.stage2[key].explanation ? formData.stage2[key].explanation.trim().split(/\s+/).filter(Boolean).length : 0;
                        const isExplanationRequired = QUESTION_BLOCKS.flatMap(b => b.checkboxes).find(c => c.key === key)?.explanation;
                        const isValidExplanation = !isExplanationRequired || wordCount >= MIN_EXPLANATION_WORDS;
                        summaryHtml += `<div class="explanation-review ${!isValidExplanation && isExplanationRequired ? 'needs-attention-review' : ''}">${explanation || (isExplanationRequired ? "<em>Explanation missing or insufficient.</em>" : "<em>No explanation required.</em>")}</div>`;
                    }
                }
            } else { summaryHtml += "<p><em>No Stage 2 factors selected with valid explanation.</em></p>"; }
        }
        if (reviewSummaryEl) reviewSummaryEl.innerHTML = summaryHtml;
    }

    function generatePdfSummary() {
        if (generatePdfSummaryButton && generatePdfSummaryButton.disabled) {
            alert("Please ensure all Case Details are filled, Proposed Uplift % is entered, and all ticked items requiring explanation have sufficient detail (approx. 10+ words).");
            return;
        }
        saveCurrentPageData();

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
                addText("No Stage 1 criteria met/selected with valid explanation.", {
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
                "The 'Suggested Uplift %' is illustrative and not an official LAA calculation. The final percentage claimed will be determined by Woodruff Billing Ltd. based on a full review.",
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

    function clearSelectionsAndRestart() {
        if(!confirm("Are you sure you want to clear all entries on all pages and restart from Page 1?")) return;

        formData.caseDetails = { feeEarnerName: "", matterType: "", caseMatterName: "" };
        formData.panelMembership = {}; formData.stage1 = {}; formData.stage2 = {}; formData.finalUpliftPercent = "";

        [feeEarnerNameEl, caseMatterNameEl, finalProposedUpliftPercentEl].forEach(el => {if(el) el.value = '';});
        if(matterTypeEl) matterTypeEl.value = "";

        for (const key in formElements) {
            if (formElements[key].checkbox) formElements[key].checkbox.checked = false;
            if (formElements[key].explanationInput) {
                formElements[key].explanationInput.value = "";
                formElements[key].explanationInput.style.display = 'none';
                formElements[key].explanationInput.classList.remove('needs-attention');
            }
        }

        QUESTION_BLOCKS.forEach(block => { if (block.main_toggle_id && formElements[block.main_toggle_id] && formElements[block.main_toggle_id].checkbox) { toggleSubOptions(block.id, false); }});

        if(stage1FeedbackEl) stage1FeedbackEl.style.display = 'none';
        updateStage2Visibility();
        showPage(0);

         [feeEarnerNameEl, caseMatterNameEl, matterTypeEl].forEach(el => { if(el) _validateField(el, el.tagName === 'SELECT' ? 'select' : 'text'); });
        checkAllPlaceholdersAndExplanations();
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
            if(el) el.addEventListener('input', () => validateField(el, 'text'));
        });
        if(matterTypeEl) matterTypeEl.addEventListener('change', () => validateField(matterTypeEl, 'select'));
        if(finalProposedUpliftPercentEl) {
            finalProposedUpliftPercentEl.addEventListener('input', () => {
                validateField(finalProposedUpliftPercentEl, 'number');
                checkAllPlaceholdersAndExplanations();
            });
        }
    }

    // Main app initialization is now deferred until password success.
});