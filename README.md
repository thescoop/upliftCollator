# Uplift Collator

A confidential, client-side web tool for UK Family Law solicitors to structure and justify Legal Aid Agency (LAA) enhancement claims (the 15% uplift). Developed by Woodruff Billing Ltd.

## How it works

Open `index.html` in a modern browser, enter the access password, and follow the multi-step form. The tool produces a PDF narrative suitable for LAA submission.

All processing happens in the browser. No data is sent to any server and nothing leaves the user's machine — important for GDPR compliance and for handling legally privileged client material.

## Current version

`APP_VERSION = "1.8"` (defined once in `content-data.js`). To release a new version, change that single constant — it propagates everywhere.

The bundled LAA reference is *Costs Assessment Guidance, Version 1a, 23 September 2024* (`Costs_Assessment_Guidance_2024_SCC_-_Version_1a-_23_September_2024.pdf`).

See `VERSION_HISTORY.md` for the full change log.

## Repository layout

- `index.html`, `script.js`, `style.css`, `content-data.js` — the app
- `Costs_Assessment_Guidance_2024_SCC_-_Version_1a-_23_September_2024.pdf` — bundled LAA reference
- `VERSION_HISTORY.md` — change log
- `LICENSE` — proprietary

An earlier parallel branch (older version folders `upliftCollator v1`–`v1.8` plus a Python narrative-generator side project) is preserved at the git tag `archive/master-snapshot` if anything from it ever needs to be recovered.

## Browser compatibility

Primarily tested in Chrome. Should work in any current Firefox, Safari, or Edge.

## Confidentiality

For solicitor use only. Password-protected; contact Woodruff Billing Ltd for access. Treat all generated narratives as containing legally privileged client material.

## License

Proprietary — Woodruff Billing Ltd.
