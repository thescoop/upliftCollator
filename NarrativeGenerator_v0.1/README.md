# LAA Uplift Narrative Generator v0.1
## Internal Tool for Woodruff Billing Ltd

### Version Information
- **Version:** 0.1.4
- **Release Date:** December 2024
- **Purpose:** Convert solicitor PDF submissions into LAA-compliant narratives

### What's New in v0.1.4
- Clarified that uplift applies only to "applicable items" not all work
- Added explicit statement that standard admin and routine communications are excluded
- Better compliance with LAA guidelines on what can receive enhancement

### What's New in v0.1.3
- Improved introduction paragraph structure with better flow
- Added "in our opinion" for professional authority
- Used colon to introduce supporting evidence
- Split introduction into two paragraphs for better readability

### What's New in v0.1.2
- Changed "Conclusion" to "Summary of Justification" for more professional tone

### What's New in v0.1.1
- Changed main title to "Claim For Additional General Enhancement"
- All headings now in proper case (not ALL CAPS)
- Word documents now use Arial Nova Cond Light 12pt font
- All text left-aligned in Word documents
- Bold headers with proper spacing between sections

### What's New in v0.1
- Initial release
- PDF parsing from Uplift Collator submissions
- LAA-compliant narrative generation
- Follows LAA style guide (no semicolons, natural language)
- UK date formatting
- Export to Text, Word, or clipboard

### Installation

1. **First-time setup:**
   ```
   Double-click: setup.bat
   ```
   This creates a virtual environment and installs dependencies.

2. **Run the application:**
   ```
   Double-click: run.bat
   ```

### Features

- **PDF Processing:** Extracts data from solicitor's Uplift Collator PDFs
- **LAA References:** Automatically includes proper CAG and Spec paragraph references
- **Style Compliance:** Follows LAA writing guidelines
- **Multiple Export Options:**
  - Copy to clipboard for Word
  - Save as text file
  - Save as Word document (.docx)

### How to Use

1. Click "Browse PDF" and select the solicitor's PDF
2. Click "Generate Narrative"
3. Review the generated narrative
4. Choose your export option:
   - Copy to Clipboard (paste into Word)
   - Save as Text File
   - Save as Word Document

### Button Styling Note
The application uses standard Windows button styling for maximum compatibility.
All buttons should display with clear, readable text on all Windows systems.

### Technical Details
- Python 3.7+ required
- Dependencies: pdfplumber, python-docx, pyperclip
- Virtual environment included for isolation

### Support
For internal use by Woodruff Billing Ltd staff only.

### Version History
- **v0.1** (December 2024): Initial release