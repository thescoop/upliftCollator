# Vendored libraries

These are third-party files, committed unmodified. **Do not edit them.** If one
needs changing, replace it with a new upstream release and update this file.

## Why they live here rather than on a CDN

A solicitor's firm blocking `cdnjs.cloudflare.com` or `cdn.jsdelivr.net` — which
firms do, by policy, without announcing it — used to break the Collator with no
error message. The download is the tool's only output since v1.11 removed the
suggested percentage, so a blocked CDN meant a silently useless tool.

Vendoring also pins what runs. `marked` was loaded from
`https://cdn.jsdelivr.net/npm/marked/marked.min.js` — **no version in the URL**,
so whatever the maintainers published most recently became part of a
legal-billing tool with no commit in this repository and no test run.

## What is here

| File | Version | Licence | Used for |
|---|---|---|---|
| `fflate.umd.min.js` | 0.8.3 | MIT (`fflate-LICENSE.txt`) | Zipping the OOXML parts of the Word summary (`docx-summary.js`) |
| `marked.min.js` | 15.0.12 | MIT | Rendering the help and terms markdown (`showModalWithMarkdown` in `script.js`) |

The minified fflate build carries no licence header, so its MIT notice is
committed beside it as `fflate-LICENSE.txt` — keep the two together.

`jspdf.umd.min.js` 2.5.1 was **removed on 7 August 2026** with the move to
.docx output — the PDF generator it served is gone (see `_PLAN.md`, "THE .DOCX
OUTPUT"). `jspdf-autotable` 3.5.23 had already been removed rather than
vendored on 4 August 2026: it had loaded on every page view since the tool was
written and was never called.

## Where they came from, and how that was checked

Each file was downloaded from a pinned, versioned URL, then downloaded a second
time from an independent CDN and compared byte for byte:

```
fflate 0.8.3    jsdelivr npm/fflate@0.8.3/umd/index.js  vs  unpkg (same path)
                sha256 462ef8041fc970e3615a20a9dd2b2e3047a073b2da729ef4f02b634bba8b7b83
                33,044 bytes, downloaded 7 August 2026
marked 15.0.12  jsdelivr npm/marked (unpinned) vs jsdelivr marked@15.0.12
                sha256 3e7e7d7feb3e5d58cb6c804f68ab5c24cc7e5eb6270fd6e5cbb9124739217d0c
```

Both matched byte for byte, so what is committed here is what both CDNs serve.
The `marked` comparison also fixed which version the unpinned URL had been
serving in production: 15.0.12.

## Updating one of them

1. Download the new file from a pinned, versioned URL.
2. Download it again from a different CDN and compare hashes.
3. Replace the file, update the table above and the hash block.
4. Re-run the form end to end in a browser and download the Word summary — then
   read it back with `_narrator/extract.py` and run
   `node _narrator/tests/build_docx_fixture.js` followed by the Python suite.
   The narrator matches the document's *paragraphs*, so a zip-library change
   that corrupted encoding would break extraction while the document still
   looked correct in Word.
5. `_narrator/tests/test_extract_docx.py` covers the committed fixtures, but
   only regenerating the fixtures (step 4) covers the *new* library build —
   the fixtures in git were made with the old one.

## If you add another library here

Production today is **GitHub Pages**, which publishes the whole repository root on
every push to `main` with no build step, so a new file is served wherever you put
it. Add it to `SHIPPED` in `_vercel-should-build.sh` anyway — that entry is the
whole `vendor/` directory, so a file dropped in here is already covered. The gate
is inert until the planned Vercel move, and it is much easier to keep it correct
now than to work out why a fix did not go live afterwards.
