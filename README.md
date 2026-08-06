# Uplift Collator

A confidential, client-side web tool for UK Family Law solicitors to structure and justify Legal Aid Agency (LAA) enhancement claims (the 15% uplift). Developed by Woodruff Billing Ltd.

## How it works

Open `index.html` in a modern browser, enter the access password, and follow the multi-step form. At the end, **Download Word Summary** saves a Word document — `Uplift_Justification-<matter>.docx` — which the solicitor sends to Woodruff Billing Ltd, where the Uplift Narrator (below) turns it into the finished LAA enhancement narrative.

The download was a PDF until 7 August 2026. It changed because the PDF round trip was the direct cause of the two worst defects this project has had: a PDF is a text layer with a line width, so anything too wide silently became two lines that matched nothing on the way back in. A `.docx` paragraph comes back whole however long it is. See `_PLAN.md`, "THE .DOCX OUTPUT", for the decision and what it retired.

All processing happens in the browser. No data is sent to any server and nothing leaves the user's machine — important for GDPR compliance and for handling legally privileged client material.

## Current version

`APP_VERSION = "1.13"` (defined once in `content-data.js`). To release a new version, change that single constant — it propagates everywhere.

That claim was false until 6 August 2026: the browser tab title and the welcome-screen badge were hardcoded `v1.11` in `index.html`, so following this instruction would have shipped a build whose first screen contradicted its own version. Both are injected from `APP_VERSION` now. If you add another place the version appears, inject it — do not type it.

The version is part of the extraction contract, and since 7 August 2026 the **output format** is too: v1.13 is the first version to download a `.docx`. Two formats must therefore never share a version number — a PDF claiming v1.13 or later is by definition not this app's own work, and the narrator's diagnostics can say so outright. (1.11 and 1.12 were built but never released.)

The bundled LAA reference is *Costs Assessment Guidance, Version 1a, 23 September 2024* (`Costs_Assessment_Guidance_2024_SCC_-_Version_1a-_23_September_2024.pdf`).

See `VERSION_HISTORY.md` for the full change log.

## Repository layout

- `index.html`, `script.js`, `style.css`, `content-data.js` — the app
- `docx-summary.js` — builds the Word summary in the browser: hand-written OOXML, so every byte of a document a solicitor signs can be read here in full
- `vendor/` — third-party libraries, committed rather than loaded from a CDN; see `vendor/_PROVENANCE.md`
- `_narrator/` — the **Uplift Narrator**, the back-office tool (see below)
- `Costs_Assessment_Guidance_2024_SCC_-_Version_1a-_23_September_2024.pdf` — bundled LAA reference
- `VERSION_HISTORY.md` — change log
- `LICENSE` — proprietary

## Back-office tool: the Uplift Narrator

Once a solicitor has downloaded the Word summary from the web app, `_narrator/`
turns it into a finished LAA enhancement narrative — pulling out the ticked
criteria, attaching the correct CAG/Spec/CPR citation to each, polishing the
result into flowing prose with a local LM Studio model, and checking that no
citation was lost on the way.

It reads both formats and works out which from the file's own content: the
`.docx` the app has downloaded since v1.13, and the PDFs produced before then.
The PDF path is frozen, not retired — those files sit in live matters and must
keep reading correctly forever.

Drag the summary onto `_narrator/_Generate_Uplift_Narrative.bat` (Windows) or run `_narrator/_narrator.sh` (WSL).
Full documentation in [`_narrator/README.md`](_narrator/README.md).

It is a Python + PyQt6 tool with its own conda environment (`uplift-narrate`),
entirely separate from the browser app above — nothing in the web tool depends
on it.

An earlier parallel branch (older version folders `upliftCollator v1`–`v1.8` plus a Python narrative-generator side project) is preserved at the git tag `archive/master-snapshot` if anything from it ever needs to be recovered.

## Browser compatibility

Primarily tested in Chrome. Should work in any current Firefox, Safari, or Edge.

## Confidentiality

For solicitor use only. Password-protected; contact Woodruff Billing Ltd for access. Treat all generated narratives as containing legally privileged client material.

## License

Proprietary — Woodruff Billing Ltd.
