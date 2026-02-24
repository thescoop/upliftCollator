# Uplift Collator - Version History

## Overview
The Uplift Collator is a confidential web-based tool developed by Woodruff Billing Ltd to help UK Family Law solicitors justify enhanced payment rates (uplifts) from the Legal Aid Agency (LAA). All processing occurs client-side to ensure GDPR compliance.

## Version History

### Version 1.8 - May 31, 2025
**Status:** Latest version (NOT on GitHub)
**Key Changes:**
- Added inline hyperlinks in the About section for easier access to Terms & Conditions
- Added inline hyperlink to HELP in the About section  
- Improved JavaScript event handling for these new inline links
- Refined wording in the About section for clarity
- Added explicit instruction to read T&Cs before first use

**Technical Changes:**
- Added `aboutTermsLinkInline` and `aboutHelpLinkInline` elements to index.html
- Added event listeners in script.js (lines 144-159) to connect inline links to existing modals
- index.html increased from 278 to 289 lines
- script.js remains at 1106 lines but with new functionality

---

### Version 1.7 - May 2025
**Status:** On GitHub (identical to v1.6)
**Key Changes:**
- No functional changes from v1.6
- Appears to be a duplicate/backup of v1.6

---

### Version 1.6 - May 28, 2025
**Status:** On GitHub (current GitHub version)
**Key Changes:**
- Added hypertext links in first paragraph block quote for T&Cs and HELP
- Improved help contents section
- Enhanced explanation of what the tool does
- Added message below password entry stating "An application where no data leaves your computer"

**GitHub Commits:**
- May 23, 2025: Initial commit and first upload
- May 27, 2025: Updated index and style.css for privacy message
- May 28, 2025: Added more explanation and further links to T&Cs and HELP
- June 2, 2025: HTML links in 1st paragraph block quote now have hypertext links

---

### Version 1.5 - May 2025
**Status:** Local only
**Key Changes:**
- Intermediate development version
- Testing and refinement phase

---

### Version 1.3 - May 2025
**Status:** Local only
**Key Changes:**
- Minor improvements and bug fixes
- UI refinements

---

### Version 1.2 - May 2025
**Status:** Local only
**Key Changes:**
- Early development improvements
- Added core functionality enhancements

---

### Version 1.0 - May 23, 2025
**Status:** Local only (original version)
**Key Features:**
- Initial release with core functionality
- Password-protected access (accepts "West Pier" and "Goodlaw")
- Multi-page form for collecting uplift justification data
- PDF generation capability
- Client-side processing (no data sent to servers)
- Based on LAA Costs Assessment Guidance (Version 1a, 23 September 2024)

---

## Core Features (All Versions)

### Security & Privacy
- Password protected access
- All processing occurs client-side
- No data transmitted to external servers
- GDPR compliant

### Functionality
- Multi-step form guiding solicitors through LAA uplift requirements
- Automatic calculation of suggested uplift percentages
- Panel membership recognition (15% minimum for accredited panels)
- Stage 1: Threshold test for exceptional circumstances
- Stage 2: Justification for specific percentage claimed
- PDF generation with formal narrative for LAA submission

### Supported Panels
- Resolution Accredited Specialist Panel
- Law Society Children Panel
- Law Society Family Law Panel Advanced

### Technical Stack
- HTML5/CSS3/JavaScript (vanilla)
- jsPDF for PDF generation
- Marked.js for Markdown rendering
- No server-side components required

---

## Version Numbering Convention
- 1.x - Major feature additions or significant changes
- x.x - Minor improvements, bug fixes, or UI enhancements

---

## GitHub Repository
**URL:** https://github.com/thescoop/upliftCollator
**Current Version on GitHub:** v1.6/v1.7 (identical versions)
**Recommended Action:** Update to v1.8 for improved user experience

---

## Document Information
**Created:** August 19, 2025
**Last Updated:** August 19, 2025
**Maintained by:** Woodruff Billing Ltd

---

## Notes for Future Updates
- Always test thoroughly before deploying
- Maintain backward compatibility with existing PDF outputs
- Ensure continued compliance with LAA guidance updates
- Keep client-side processing architecture for GDPR compliance
- Consider adding version number display in the application UI