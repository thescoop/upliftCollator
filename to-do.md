# TODO — Recalibrate the portal's suggested-percentage logic

**Status:** ✅ DONE in v1.9 (2026-04-28). Per-factor weighting bumped from 5% to 10%. Panel (15%) and cap (50%) unchanged per the Option 1 decision. See `VERSION_HISTORY.md` for the full release note.

The notes below are kept for historical context — they describe the decision-tree we used, the alternative options that were considered and rejected, and the impact-surface analysis from Phase 1 research. Useful if a future change revisits the calibration (e.g. raising the cap, switching to a range-based suggestion).

---

**Original status (kept for archive):** open — decided in conversation 2026-04-28, not yet implemented.

## Why

The first solicitor to use the live portal submitted a 10% uplift on a case that, from her own description, warranted 30%+. Tracing back, the on-screen "Suggested: X%" was 10%, because `_updateSuggestedPercentage()` in `script.js` returns `factor_count × 5%` for general factors (here `2 × 5 = 10`). The app authored her answer.

The current calibration anchors users low: modest solicitors accept the suggestion, only aggressive ones override. The asymmetry guarantees clients under-claim on average. The first user has already been told (see `~/Desktop/test99999-narrative/email-draft.txt`) that the calibration will be revisited — so this is a commitment, not just a nice-to-have.

## Current logic (`script.js:190–267`)

```
panelUplift          = 15 if any panel ticked, else 0
generalFactorsUplift = (count of ticked + adequately-explained factors) × 5
suggestedPercentage  = max(panelUplift, generalFactorsUplift)
                       capped at 50%
```

## Options discussed (decision pending — confirm before implementing)

1. **Bump per-factor weighting** — `factor × 10%` instead of 5%. Same UX, just less timid. Half-measure: still anchors a single number.
2. **Show a range, not a single number** — "Suggested range: 25–50% based on factors ticked." Removes false-precision anchor; signals judgement rather than arithmetic. *(Working recommendation.)*
3. **Floor + market-norms framing** — "Plausible floor: 30%; cases of this profile commonly claim 50–60%." Most aggressive at de-modesting users, but involves making market-norms claims inside the tool that could be challenged.

## Things to check before shipping (do NOT skip — these are the ways the change can quietly break)

- [ ] **"Use Suggested" button regression.** `script.js:364–365` greps `\d+` from the suggestion text and auto-fills the proposed-uplift input. If the suggestion becomes a range like `"25–50%"`, this regex matches the FIRST number (25), silently re-anchoring low and defeating the whole point. Either change the regex to take the upper bound / midpoint, or remove the auto-fill, or pick a single number and set it explicitly.
- [ ] **`UPLIFT_PERCENTAGE_GUIDANCE_TEXT`** in `content-data.js` (line 296) explains the current calculation in user-facing prose. If the algorithm changes, that explainer becomes misleading. Update in lockstep.
- [ ] **PDF output is NOT affected.** `generatePdfSummary` (script.js:803) writes only the user's chosen `finalProposedUpliftPercent`, never the on-screen suggestion. So no `narrate/` regex change needed. Re-verify by reading the function before merging — don't trust this note blindly.
- [ ] **Display width.** `finalSuggestedPercentageDisplayEl` currently shows `"Suggested: X%"`. `"Suggested: X–Y%"` is wider — check it doesn't wrap or overflow on mobile / in the side panel. May need a `style.css` tweak.
- [ ] **Edge cases.** Confirm sensible output for: 0 factors ticked, 1 factor only, panel-only, panel + many factors, cap-exceeding inputs. Don't ship without manually walking through each in the browser.
- [ ] **`UPLIFT_PERCENTAGE_GUIDANCE_TEXT` modal text** also needs to match the new framing in the help button on the Finalise page.
- [ ] **No automated tests cover `_updateSuggestedPercentage`.** Either add a small JS unit test, or write a manual test checklist into `VERSION_HISTORY.md` so the next change can re-run it.
- [ ] **Version bump.** `APP_VERSION` in `content-data.js` is 1.8 — bump to 1.9 with this change. Propagates to header, footer, PDF.
- [ ] **`VERSION_HISTORY.md`** — log the change with rationale (the under-claiming asymmetry), so a future auditor can see why the calibration moved.
- [ ] **`narrate/HANDOFF.md`** — under "Recent decisions / context", note the v1.9 recalibration so a future session picks it up.
- [ ] **Old in-the-wild PDFs.** The recalibration only affects FUTURE submissions. Pre-redesign PDFs already in case folders are unaffected — confirm by reading no narrator-side regex depends on the suggestion field.

## Files likely to touch

- `script.js` — `_updateSuggestedPercentage()` and the "Use Suggested" handler around line 364
- `content-data.js` — `UPLIFT_PERCENTAGE_GUIDANCE_TEXT` + `APP_VERSION`
- `style.css` — only if the wider suggestion text breaks layout
- `VERSION_HISTORY.md` — log entry
- `narrate/HANDOFF.md` — recent-decisions note

## Honest unknowns

- "Other firms routinely claim 50–60%" came from the user (Woodruff Billing's costs-draftsman experience), not from a published source. If we put market-norms claims into the tool itself (option 3), back them with a citation we can defend.
- I do not have empirical data on what proportion of LAA enhancement claims are accepted at the requested percentage vs negotiated down. The "let them negotiate down" framing in the email assumes that negotiation is normal — re-confirm before encoding it as a tool tooltip.
