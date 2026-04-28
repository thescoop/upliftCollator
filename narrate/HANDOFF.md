# Uplift Collator + Narrator — Project Handoff

Concise context for picking up work in a fresh session.

## What this project does

Two cooperating tools for **Woodruff Billing Ltd** (UK Family Law solicitors funded by the Legal Aid Agency):

1. **Uplift Collator** (the existing web app — `index.html` + `script.js` + `content-data.js` + `style.css`). A 100% client-side, password-gated form that walks a solicitor through the LAA enhancement uplift questionnaire (Costs Assessment Guidance §12). Outputs a PDF summary.
2. **Uplift Narrator** (`narrate/`). A new internal back-office tool that takes the Collator's PDF and produces:
   - A structured Markdown narrative (deterministic, every CAG/Spec citation in place, solicitor's verbatim explanations preserved).
   - A paste-ready prompt for **LM Studio** (local 27B model) that polishes the narrative into flowing prose. The polished output goes to a human reviewer before submission to the LAA.

GDPR-sensitive throughout — no cloud LLMs, all processing local.

## Repository layout

```
upliftCollator/
├── index.html, script.js, style.css     # The web app (deployed on GitHub Pages)
├── content-data.js                      # SINGLE SOURCE OF TRUTH for:
│                                        #   - QUESTION_BLOCKS (the questionnaire)
│                                        #   - NARRATIVE_TEMPLATES (per-criterion snippets
│                                        #     with CAG citations baked in)
│                                        #   - APP_VERSION
├── README.md, VERSION_HISTORY.md, LICENSE
├── Costs_Assessment_Guidance_2024_SCC_…pdf   # Bundled LAA reference
│
└── narrate/                             # The Python narrator
    ├── narrate_gui.py                   # PyQt6 GUI (dark theme, myToolbox pattern)
    ├── narrate.py                       # CLI orchestrator
    ├── extract.py                       # PDF → formData via pdfplumber + regex
    ├── templates.py                     # Parses NARRATIVE_TEMPLATES + QUESTION_BLOCKS
    │                                    #   from ../content-data.js (json5)
    ├── skeleton.py                      # formData + templates → Markdown skeleton
    ├── prompts.py                       # Assembles paste-ready LM Studio prompt
    ├── render.py                        # (unused stub for future DOCX export)
    ├── prompts/
    │   ├── system.md                    # System prompt — legal-safety guardrails
    │   ├── user-template.md             # User-message template ({{SKELETON}} placeholder)
    │   └── verification.md              # Optional second prompt for citation/fact check
    ├── _setup.bat / _setup.sh           # Create conda env 'uplift-narrate'
    ├── _run.bat / _run.sh               # Launch the GUI
    ├── requirements.txt                 # pdfplumber, json5, PyQt6
    ├── README.md                        # User-facing quick-start + troubleshooting
    └── tests/
        ├── fixtures/sample.pdf          # Synthetic test PDF (Jane Doe / Re X — fictional)
        ├── fixtures/sample_formdata.json
        ├── test_templates.py
        ├── test_extract.py
        ├── test_skeleton.py
        └── test_prompts.py              # 20 tests, all passing
```

The `archive/master-snapshot` git tag preserves an earlier disjoint history with old version folders and a Python prototype — kept for reference, not active code.

## Data flow

```
solicitor uses web app
   ↓
PDF saved (Uplift Collator's generatePdfSummary in script.js:803)
   ↓
─ NARRATOR PIPELINE ─────────────────────────────────────────────
   ↓
extract.py — pdfplumber + regex against the predictable structure
            (UPPERCASE section headers, "•  Label" criteria, "Explanation: …" lines)
   ↓
formData dict (same shape as the in-app object)
   ↓
templates.py — pulls NARRATIVE_TEMPLATES from ../content-data.js
   ↓
skeleton.py — substitutes {UPLIFT_PERCENT}, {ITEM_OF_WORK}, {FEE_EARNER_NAME},
              {PANEL_NAME}, {USER_EXPLANATION}; preserves bracketed [SPECIFY …]
              placeholders for the LLM/human reviewer
   ↓
─ OUTPUTS ───────────────────────────────────────────────────────
   • narrative.md          (deterministic skeleton, usable as-is)
   • narrative-prompt.txt  (paste-ready for LM Studio)
   • narrative-input.json  (recovered formData, debugging aid)
─ LLM POLISH (manual step, outside this app) ────────────────────
   user pastes prompt into LM Studio → polished prose → human review → LAA
```

## Architecture choices (and the why)

- **No QR code, no embedded metadata.** Earlier plans considered embedding the JSON formData in the PDF for lossless round-trip. We dropped that: the PDF text is already structured enough to regex out, and constraining the solicitor's input to fit a QR code was unacceptable.
- **No LLM integration code in the narrator.** Per user direction: the narrator outputs a paste-ready prompt; the user runs the polish step manually in LM Studio. Benefits — no `openai` dependency, no model coupling, the system prompt is a reviewable artefact under version control.
- **NARRATIVE_TEMPLATES stays in `content-data.js`** as the single source of truth. Python parses it at runtime via `json5`. A unit test catches drift.
- **GUI follows the `~/coding/myToolbox` Manager/Window/Card/Worker pattern** with the same dark palette, so `narrate_gui.py` can drop into myToolbox later with minimal changes (`NarrateManager.open_window()` is the integration entry point).
- **`QPlainTextEdit`** for the output panes (not `QTextEdit`) — guarantees `\n` line endings on copy, no Unicode paragraph-separator (U+2029) surprises in LM Studio.

## How to run

### GUI (primary path)

```
cd narrate
./_setup.sh          # one-time
./_run.sh            # launches GUI; drag PDF or click Browse
```

Windows: `_setup.bat` then `_run.bat` (or drag a PDF onto `_run.bat`).

### CLI

```
conda activate uplift-narrate
python narrate.py path/to/case.pdf [--out-dir DIR]
```

### Tests

```
conda activate uplift-narrate
python -m unittest discover -s narrate/tests -v
```

## Active issue (the reason this doc exists)

**Bug — empty narrative output.** When run against a real solicitor-generated PDF (not the test fixture), the narrator produces only the intro and conclusion paragraphs with placeholders unfilled:

```
An enhancement of [uplift %]% is claimed on the [case] work due to …
These factors, individually and/or cumulatively, rendered the work …
```

That output indicates `extract.py` returned an empty `formData` — every section regex failed to match. The fixture PDF (`tests/fixtures/sample.pdf`) extracts correctly, so the failure is specific to whatever the user's actual PDF differs in.

Likely causes (ranked by probability):
1. Pdfplumber on Windows extracts text with line-break heuristics that don't match the Linux output our regexes were tuned against.
2. The user's PDF was generated by an older/different version of the web app where section headers weren't UPPERCASE, or the bullet character differs.
3. A non-Collator PDF was dropped on the GUI by accident.

Diagnostic plan (in progress):
- [x] Drive the live web app via Playwright, generate a fresh PDF, run narrator. If reproduces → fix the regexes. If not → ask user to share their actual PDF (or its first-page extracted text).
- [ ] If still ambiguous, add a `--debug` mode that prints the raw pdfplumber text so we can see what extract.py is being asked to parse.

The CLI extractor stub for direct inspection:

```bash
conda activate uplift-narrate
python -c "import pdfplumber; print(pdfplumber.open('PATH.pdf').pages[0].extract_text())"
```

## Recent decisions / context

- **Repo on `main` branch**, single-author. Direct push to main is allowed via an explicit `Bash(git push origin main:*)` rule in `.claude/settings.local.json` (added 2026-04-27 after running into Claude Code's default safety guard).
- **App version is 1.9** in `content-data.js`. To bump, change `APP_VERSION` only — propagates everywhere.
- **v1.9 (2026-04-28)** recalibrated the on-screen "Suggested: X%" from 5% per factor to 10% per factor. Narrator is unaffected — the PDF only contains the user's chosen final percentage, not the suggestion. All 20 narrator unit tests still pass against pre- and post-recalibration PDFs.
- **Recent significant commits:**
  - `35c362b` — first narrate/ commit (CLI + tests)
  - `7ff3c1f` — added GUI front-end (PyQt6, myToolbox pattern)
- **HANDOFF location**: `narrate/HANDOFF.md` (this file). The matching pattern is myToolbox's `HANDOFF.md` — concise, structured for a fresh-session pick-up.

## Conventions

Per user's global `~/.claude/CLAUDE.md`:
- Mentor mode — explain trade-offs, plan before code.
- Conda is on PATH on both Windows and WSL Linux. In `.bat` files use `CALL conda activate <env>` directly (don't probe install paths). In `.sh` files source conda's profile script first.
- Always provide both `.bat` and `.sh` startup scripts, prefixed with `_` to sort to top.
- All client work is GDPR-confidential — no cloud LLMs, no data leaves the machine.
- Plain text + small clear sections > exhaustive prose. Critical honesty over hedging.

## Where to start a fresh session

1. Read this file.
2. `git log --oneline -10` to see what's recent.
3. If picking up the empty-narrative bug:
   - Run the CLI on a real PDF: `python narrate.py /path/to/your.pdf` and compare against the fixture run.
   - Inspect raw pdfplumber output to see what `extract.py` is reading.
4. If picking up new feature work: probably a multi-case batch mode or DOCX output (mentioned but not built).
