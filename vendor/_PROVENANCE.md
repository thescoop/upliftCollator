# Vendored libraries

These are third-party files, committed unmodified. **Do not edit them.** If one
needs changing, replace it with a new upstream release and update this file.

## Why they live here rather than on a CDN

A solicitor's firm blocking `cdnjs.cloudflare.com` or `cdn.jsdelivr.net` — which
firms do, by policy, without announcing it — used to break the Collator with no
error message. jsPDF is what writes the PDF, and since v1.11 removed the
suggested percentage, that download is the tool's only output. The failure was
silent, so the solicitor would have concluded the button was broken, or that
they had filled the form in wrongly.

Vendoring also pins what runs. `marked` was loaded from
`https://cdn.jsdelivr.net/npm/marked/marked.min.js` — **no version in the URL**,
so whatever the maintainers published most recently became part of a
legal-billing tool with no commit in this repository and no test run.

## What is here

| File | Version | Licence | Used for |
|---|---|---|---|
| `jspdf.umd.min.js` | 2.5.1 (built 2022-01-28) | MIT | Writing the PDF summary (`generatePdfSummary` in `script.js`) |
| `marked.min.js` | 15.0.12 | MIT | Rendering the help and terms markdown (`showModalWithMarkdown` in `script.js`) |

Both licences are MIT and the notices are retained in the file headers, which is
all MIT requires for redistribution.

`jspdf-autotable` 3.5.23 was **removed rather than vendored** on 4 August 2026.
It had been loaded on every page view since the tool was written and is never
called: no `autoTable` appears anywhere in `script.js`. The tables in the PDF are
drawn by hand.

## Where they came from, and how that was checked

Downloaded 4 August 2026 from the URLs `index.html` previously used, then each
file was downloaded a second time from an independent CDN and compared:

```
jspdf 2.5.1     cdnjs  vs  jsdelivr   sha256 98ccf17aa10c20bb1301762618fcc9b6ab3a4e7f26b6071d64d0b41154df3875
marked 15.0.12  jsdelivr npm/marked (unpinned) vs jsdelivr marked@15.0.12
                                     sha256 3e7e7d7feb3e5d58cb6c804f68ab5c24cc7e5eb6270fd6e5cbb9124739217d0c
```

Both matched byte for byte, so what is committed here is what both CDNs serve.
The `marked` comparison also fixes which version the unpinned URL had been
serving in production: 15.0.12.

## Updating one of them

1. Download the new file from a pinned, versioned URL.
2. Download it again from a different CDN and compare hashes.
3. Replace the file, update the table above and the hash block.
4. Re-run the form end to end in a browser and generate a PDF — then read that
   PDF back with `_narrator/extract.py`. The narrator parses the PDF's *text
   layer*, so a jsPDF change that alters spacing or line breaking can break
   extraction while the document still looks perfectly correct on screen.
5. `_narrator/` has 260 tests, but none of them run jsPDF. Step 4 is the only
   check that covers it.

## If you add another library here

Production today is **GitHub Pages**, which publishes the whole repository root on
every push to `main` with no build step, so a new file is served wherever you put
it. Add it to `SHIPPED` in `_vercel-should-build.sh` anyway — that entry is the
whole `vendor/` directory, so a file dropped in here is already covered. The gate
is inert until the planned Vercel move, and it is much easier to keep it correct
now than to work out why a fix did not go live afterwards.
