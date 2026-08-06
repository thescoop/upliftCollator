/**
 * Builds the Uplift Justification .docx entirely in the browser (or in Node,
 * for tests) from the form's data. No network, no CDN — the only dependency is
 * the vendored fflate (vendor/fflate.umd.min.js), which zips the OOXML parts.
 *
 * WHY HAND-WRITTEN XML RATHER THAN A LIBRARY. The document is a handful of
 * paragraph shapes — headings, "Label:  Value" details, bulleted criteria,
 * explanations — and the only .docx library with a browser build is ~1.12 MB
 * with five embedded dependencies. This file plus fflate is ~one tenth of
 * that, and every byte that ends up in a document a solicitor signs can be
 * read here in full. Decision and survey: _PLAN.md, "THE .DOCX OUTPUT".
 *
 * THE PARAGRAPH STREAM IS AN EXTRACTION CONTRACT. _narrator/extract_docx.py
 * reads this document with python-docx and matches paragraphs — whole
 * paragraphs, by exact text. That is the property that retires the two worst
 * defect classes this project has had:
 *
 *   - Nothing wraps. A PDF line too wide for its column silently became two
 *     lines that matched nothing; a docx paragraph comes back whole however
 *     long it is.
 *   - Nothing pasted can imitate structure. A solicitor pasting a block
 *     containing "DISCLAIMER" into an explanation puts it INSIDE the
 *     explanation paragraph (its newlines become <w:br/>, never new
 *     paragraphs), so no line of it can ever equal a heading paragraph.
 *
 * Both properties hold only while this file keeps them true. The rules:
 *
 *   1. Every logical line is exactly one <w:p>. Never encode a paragraph
 *      boundary as a newline inside <w:t>; never split one logical line
 *      across two paragraphs.
 *   2. Solicitor-typed newlines (textarea explanations) become <w:br/> runs
 *      inside the explanation's own paragraph — python-docx returns them as
 *      "\n" within that paragraph's text.
 *   3. No decorative empty paragraphs in the body. Spacing is done with
 *      w:spacing on the paragraph, which extraction never sees.
 *   4. Per-page furniture lives in real header/footer parts, so the body
 *      stream that python-docx walks contains no repeated header lines at
 *      all — the PDF's HEADER_PATTERN/FOOTER_PATTERN stripping has no docx
 *      equivalent because there is nothing to strip.
 *   5. The visible strings — section headings, "Label:  Value" details,
 *      "•  " bullets, the empty-Stage-1 sentinel, the deemed-threshold line,
 *      the evidence pair — are carried over from the PDF generator verbatim,
 *      so both formats state the same things in the same words.
 */
(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        // Node (fixture builder and tests). The require path is relative to
        // this file, which sits in the repo root beside vendor/.
        module.exports = factory(require("./vendor/fflate.umd.min.js"));
    } else {
        root.buildUpliftDocx = factory(root.fflate);
    }
}(typeof self !== "undefined" ? self : this, function (fflate) {
    "use strict";

    // ── Text safety ────────────────────────────────────────────────────────────────────
    //
    // XML 1.0 cannot carry most control characters at all — not escaped, not
    // raw. A stray U+000B pasted into a textarea would otherwise produce a
    // file Word flatly refuses ("unreadable content"). Each such character is
    // replaced with a space: they are invisible whitespace-class characters,
    // so a space preserves what the solicitor saw on screen, whereas refusing
    // the download over a character they cannot see or find would strand
    // them. \t and \n survive (\n becomes <w:br/> in textRun); \r is
    // normalised into \n first. DEL and the C1 range are technically legal in
    // XML 1.0 but are clipboard junk in this context and are spaced too, so
    // an invisible character can never make two visually identical labels
    // compare unequal downstream. U+FFFE/U+FFFF are non-characters.
    var INVALID_XML_CHARS =
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFE\uFFFF]/g;

    // Lone UTF-16 surrogate halves — clipboard or interop damage. A paired
    // surrogate (a real emoji, say) passes through intact; an unpaired half
    // would make fflate.strToU8 emit bytes that are not UTF-8 at all, and
    // Word would refuse the package. Scanned explicitly rather than with a
    // regex: the regex form has a genuine trap with two adjacent lone halves.
    function fixSurrogates(s) {
        if (!/[\uD800-\uDFFF]/.test(s)) return s;
        var out = "";
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (c >= 0xD800 && c <= 0xDBFF) {
                var d = i + 1 < s.length ? s.charCodeAt(i + 1) : 0;
                if (d >= 0xDC00 && d <= 0xDFFF) {
                    out += s.charAt(i) + s.charAt(i + 1);
                    i++;
                } else {
                    out += " ";
                }
            } else if (c >= 0xDC00 && c <= 0xDFFF) {
                out += " ";
            } else {
                out += s.charAt(i);
            }
        }
        return out;
    }

    function cleanText(value) {
        var s = String(value == null ? "" : value);
        s = s.replace(/\r\n?/g, "\n");
        s = fixSurrogates(s);
        return s.replace(INVALID_XML_CHARS, " ");
    }

    function escapeXml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // ── Run and paragraph builders ─────────────────────────────────────────
    //
    // Formatting is applied per run, with no styles.xml part: a minimal
    // package has fewer places to be wrong, and extraction reads text only,
    // never formatting. Sizes are half-points (10pt → 20); colours are RRGGBB.
    // Child order inside rPr and pPr follows the WordprocessingML schema —
    // Word repairs (or rejects) files that disorder them.

    function runProps(opts) {
        var font = opts.font || "Arial";
        var xml = "<w:rPr>";
        xml += '<w:rFonts w:ascii="' + font + '" w:hAnsi="' + font + '" w:cs="' + font + '"/>';
        if (opts.bold) xml += "<w:b/><w:bCs/>";
        if (opts.italic) xml += "<w:i/><w:iCs/>";
        if (opts.color) xml += '<w:color w:val="' + opts.color + '"/>';
        var half = Math.round((opts.size || 10) * 2);
        xml += '<w:sz w:val="' + half + '"/><w:szCs w:val="' + half + '"/>';
        return xml + "</w:rPr>";
    }

    // One run of already-cleaned text. Solicitor newlines become <w:br/> so
    // they stay inside this paragraph (rule 2 above). xml:space="preserve" on
    // every <w:t> keeps leading/trailing spaces — "Fee Earner:  " ends with
    // two, and losing one would break the extraction match.
    function textRun(text, opts) {
        var pieces = cleanText(text).split("\n");
        var xml = "";
        for (var i = 0; i < pieces.length; i++) {
            if (i > 0) xml += "<w:r>" + runProps(opts) + "<w:br/></w:r>";
            if (pieces[i]) {
                xml += "<w:r>" + runProps(opts) +
                    '<w:t xml:space="preserve">' + escapeXml(pieces[i]) + "</w:t></w:r>";
            }
        }
        return xml;
    }

    // spacingBefore/spacingAfter are points, converted to twentieths here.
    function paragraph(runsXml, opts) {
        opts = opts || {};
        var pPr = "";
        var props = "";
        if (opts.borderBottom) {
            props += '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="B4B4B4"/></w:pBdr>';
        }
        if (opts.tabs) props += opts.tabs;
        if (opts.spacingBefore || opts.spacingAfter) {
            props += '<w:spacing w:before="' + Math.round((opts.spacingBefore || 0) * 20) +
                '" w:after="' + Math.round((opts.spacingAfter || 0) * 20) + '"/>';
        }
        if (opts.indent) {
            props += '<w:ind w:left="' + Math.round(opts.indent * 20) + '"/>';
        }
        if (props) pPr = "<w:pPr>" + props + "</w:pPr>";
        return "<w:p>" + pPr + runsXml + "</w:p>";
    }

    function textParagraph(text, opts) {
        return paragraph(textRun(text, opts), opts);
    }

    // ── Colours (carried over from the PDF's palette) ──────────────────────
    var BLACK = "000000";
    var DARK_GREY = "3C3C3C";   // body text
    var MID_GREY = "5A5A5A";    // metadata, categories
    var BLUE = "0056B3";        // explanations (Woodruff blue)
    var LIGHT_GREY = "646464";  // disclaimer, footer

    // ── Document body ──────────────────────────────────────────────────────

    function sectionHeader(title) {
        // UPPERCASE bold — the section boundary the extractor matches on.
        return textParagraph(title.toUpperCase(), {
            bold: true, size: 11, color: BLACK, spacingBefore: 20, spacingAfter: 8
        });
    }

    function detailLine(label, value) {
        // Two spaces after the colon, exactly as the PDF printed and exactly
        // as extract_docx.py matches. The whole line is one paragraph, so a
        // long matter name can no longer wrap into ambiguity — the defect
        // that forced the PDF parser's longest-run reader.
        return textParagraph(label + ":  " + (value || "N/A"), {
            size: 10, spacingAfter: 4, color: DARK_GREY
        });
    }

    function criterion(label, explanation, categoryTitle) {
        var xml = textParagraph("•  " + label, {
            bold: true, size: 10, color: DARK_GREY,
            spacingBefore: 4, spacingAfter: (explanation || categoryTitle) ? 2 : 6
        });
        if (categoryTitle) {
            xml += textParagraph(categoryTitle, {
                italic: true, size: 8, color: MID_GREY, indent: 14, spacingAfter: 2
            });
        }
        if (explanation) {
            // One paragraph however many lines the solicitor typed (rule 2).
            xml += textParagraph("Explanation: " + explanation, {
                italic: true, size: 9, color: BLUE, indent: 14, spacingAfter: 6
            });
        }
        return xml;
    }

    function checkedEntries(sectionObj) {
        var out = [];
        for (var key in sectionObj) {
            if (Object.prototype.hasOwnProperty.call(sectionObj, key) &&
                sectionObj[key] && sectionObj[key].checked) {
                out.push(sectionObj[key]);
            }
        }
        return out;
    }

    function buildBodyXml(formData, meta) {
        var xml = "";

        // Title and generation metadata — same two lines as the PDF.
        xml += textParagraph("Uplift Justification", {
            bold: true, size: 16, color: BLACK, spacingBefore: 8, spacingAfter: 6
        });
        xml += textParagraph(
            "Generated: " + meta.generatedDateText + "  |  Uplift Tool v" +
            meta.appVersion + " (" + meta.guideVersionInfo + ")",
            { italic: true, size: 8, color: MID_GREY, spacingAfter: 10 }
        );

        // ── CASE DETAILS ──
        xml += sectionHeader("Case Details");
        xml += detailLine("Fee Earner", formData.caseDetails.feeEarnerName);
        xml += detailLine("Matter Type", formData.caseDetails.matterType);
        xml += detailLine("Case / Matter Name", formData.caseDetails.caseMatterName);
        xml += detailLine("Court", formData.caseDetails.courtLevel);

        // ── PANEL MEMBERSHIP ──
        xml += sectionHeader("Panel Membership");
        var panel = checkedEntries(formData.panelMembership);
        if (panel.length) {
            for (var i = 0; i < panel.length; i++) {
                xml += textParagraph("•  " + panel[i].label, {
                    size: 10, color: DARK_GREY, spacingAfter: 4
                });
            }
        } else {
            xml += textParagraph("None selected.", {
                italic: true, size: 10, color: MID_GREY, spacingAfter: 6
            });
        }

        // ── STAGE 1 ──
        xml += sectionHeader("Stage 1: Threshold Test Selections");
        var s1 = checkedEntries(formData.stage1);
        if (s1.length) {
            for (var j = 0; j < s1.length; j++) {
                xml += criterion(s1[j].label, s1[j].explanation, s1[j].categoryTitle);
            }
        } else {
            // The sentinel that lets the narrator tell an empty section from
            // a section it failed to parse — same words as the PDF printed.
            xml += textParagraph("No Stage 1 threshold factors selected.", {
                italic: true, size: 10, color: MID_GREY, spacingAfter: 6
            });
            // Printed IN ADDITION to the sentinel, never instead of it, and
            // only inside Stage 1 — extract_docx.py refuses it anywhere else.
            if (meta.thresholdDeemedOnly) {
                xml += textParagraph(
                    "Threshold test: deemed satisfied by panel membership (Spec Para 7.23(a)).",
                    { italic: true, size: 10, color: MID_GREY, spacingAfter: 6 }
                );
            }
        }

        // ── STAGE 2 (only if the threshold is met or deemed) ──
        if (meta.thresholdSatisfied) {
            xml += sectionHeader("Stage 2: Level of Enhancement Factors");
            var s2 = checkedEntries(formData.stage2);
            if (s2.length) {
                for (var k = 0; k < s2.length; k++) {
                    xml += criterion(s2[k].label, s2[k].explanation, s2[k].categoryTitle);
                }
            } else {
                xml += textParagraph("No Stage 2 factors selected.", {
                    italic: true, size: 10, color: MID_GREY, spacingAfter: 6
                });
            }
        }

        // ── PROPOSED UPLIFT ──
        xml += sectionHeader("Proposed Uplift");
        xml += textParagraph(
            "Proposed Uplift Percentage:  " + (formData.finalUpliftPercent || "Not Set") + "%",
            { bold: true, size: 13, color: BLACK, spacingAfter: 10 }
        );
        if (meta.ceilingPercent !== null && meta.ceilingPercent !== undefined) {
            xml += textParagraph(
                "Applicable ceiling for this court (CAG 12.2):  " + meta.ceilingPercent + "%",
                { size: 10, color: MID_GREY, spacingAfter: 6 }
            );
        }

        // ── EVIDENCE ON FILE — printed in both states, never omitted ──
        xml += sectionHeader("Evidence on File");
        xml += textParagraph(
            "Evidence on file: " +
            (formData.evidenceOnFileConfirmed ? "Confirmed" : "Not confirmed"),
            { size: 10, color: DARK_GREY, spacingAfter: 4 }
        );
        xml += textParagraph(
            formData.evidenceOnFileConfirmed
                ? "The fee earner confirms that evidence supporting the matters set out above is held on the case file."
                : "The fee earner has not confirmed that supporting evidence is held on the case file. The narrative will not assert that it is.",
            { italic: true, size: 10, color: MID_GREY, spacingAfter: 6 }
        );

        // ── DISCLAIMER ──
        xml += textParagraph("DISCLAIMER", {
            bold: true, size: 8, color: LIGHT_GREY, spacingBefore: 20, spacingAfter: 4
        });
        var disclaimerLines = [
            "This document has been generated using the Woodruff Billing Ltd. Uplift Justification Collator.",
            "It is intended for use by the named Fee Earner and for submission to Woodruff Billing Ltd. only.",
            "The information contained herein is based on the inputs provided by the solicitor and is for the purpose of assisting Woodruff Billing Ltd. in preparing an LAA enhancement claim.",
            "The Proposed Uplift % is the solicitor's own figure. This tool does not calculate or suggest a percentage. The final percentage claimed will be determined by Woodruff Billing Ltd. based on a full review, and the quantum of any enhancement is a matter for the Legal Aid Agency.",
            "Woodruff Billing Ltd. is not responsible for the accuracy or completeness of the information entered by the solicitor. The solicitor remains responsible for the veracity of their justifications."
        ];
        for (var d = 0; d < disclaimerLines.length; d++) {
            xml += textParagraph(disclaimerLines[d], {
                size: 7, color: LIGHT_GREY, spacingAfter: 2
            });
        }

        // ── Version line ──
        xml += textParagraph(
            meta.appName + " v" + meta.appVersion +
            (meta.appReleaseDate ? " (" + meta.appReleaseDate + ")" : ""),
            { italic: true, size: 7, color: LIGHT_GREY, spacingBefore: 10 }
        );

        return xml;
    }

    // ── Header and footer parts ────────────────────────────────────────────
    //
    // Real Word header/footer parts, one each, referenced from sectPr. They
    // repeat on every page without ever appearing in doc.paragraphs — which
    // is precisely why they are parts and not body text.

    function buildHeaderXml(meta) {
        var line1 =
            "<w:p><w:pPr><w:spacing w:after=\"20\"/></w:pPr>" +
            textRun("W", { bold: true, size: 22, color: BLACK, font: "Times New Roman" }) +
            textRun("  Woodruff Billing Ltd.", { bold: true, size: 13, color: BLACK }) +
            "</w:p>";
        var line2 = textParagraph(meta.headerSubtitle, {
            size: 8, color: MID_GREY, spacingAfter: 6, borderBottom: true
        });
        return xmlPart(
            '<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            line1 + line2 + "</w:hdr>"
        );
    }

    function buildFooterXml() {
        // Text width for A4 (11906 twips) minus two 1000-twip margins is
        // 9906: centre tab at 4953, right tab at 9906.
        var tabs = '<w:tabs><w:tab w:val="center" w:pos="4953"/><w:tab w:val="right" w:pos="9906"/></w:tabs>';
        var grey = { size: 7, color: LIGHT_GREY };
        var p =
            "<w:p><w:pPr>" + tabs + "</w:pPr>" +
            textRun("CONFIDENTIAL — FOR LAA SUBMISSION", grey) +
            "<w:r>" + runProps(grey) + "<w:tab/></w:r>" +
            textRun("Page ", grey) +
            '<w:fldSimple w:instr=" PAGE "><w:r>' + runProps(grey) + "<w:t>1</w:t></w:r></w:fldSimple>" +
            textRun(" of ", grey) +
            '<w:fldSimple w:instr=" NUMPAGES "><w:r>' + runProps(grey) + "<w:t>1</w:t></w:r></w:fldSimple>" +
            "<w:r>" + runProps(grey) + "<w:tab/></w:r>" +
            textRun("Woodruff Billing Ltd", grey) +
            "</w:p>";
        return xmlPart(
            '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            p + "</w:ftr>"
        );
    }

    // ── Package plumbing ───────────────────────────────────────────────────

    function xmlPart(content) {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + content;
    }

    var CONTENT_TYPES = xmlPart(
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' +
        '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
        "</Types>"
    );

    var PACKAGE_RELS = xmlPart(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
        "</Relationships>"
    );

    var DOCUMENT_RELS = xmlPart(
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
        "</Relationships>"
    );

    // The created/modified stamps and the creator name are the docx
    // equivalent of the PDF metadata that _narrator's diagnose() reads to work
    // out who rewrote a damaged file and when. A document whose creator is not
    // "Uplift Collator v..." did not come from this app as saved.
    function buildCorePropsXml(meta, nowIso) {
        return xmlPart(
            '<cp:coreProperties' +
            ' xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"' +
            ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
            ' xmlns:dcterms="http://purl.org/dc/terms/"' +
            ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            "<dc:title>Uplift Justification</dc:title>" +
            "<dc:creator>" + escapeXml(meta.appName + " v" + meta.appVersion) + "</dc:creator>" +
            "<cp:lastModifiedBy>" + escapeXml(meta.appName + " v" + meta.appVersion) + "</cp:lastModifiedBy>" +
            '<dcterms:created xsi:type="dcterms:W3CDTF">' + nowIso + "</dcterms:created>" +
            '<dcterms:modified xsi:type="dcterms:W3CDTF">' + nowIso + "</dcterms:modified>" +
            "</cp:coreProperties>"
        );
    }

    function buildDocumentXml(formData, meta) {
        return xmlPart(
            '<w:document' +
            ' xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"' +
            ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
            "<w:body>" +
            buildBodyXml(formData, meta) +
            "<w:sectPr>" +
            '<w:headerReference w:type="default" r:id="rId1"/>' +
            '<w:footerReference w:type="default" r:id="rId2"/>' +
            '<w:pgSz w:w="11906" w:h="16838"/>' +
            // 1000 twips = 50pt, the PDF's margin, kept for visual continuity.
            '<w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/>' +
            "</w:sectPr>" +
            "</w:body>" +
            "</w:document>"
        );
    }

    /**
     * Build the .docx and return its bytes as a Uint8Array.
     *
     * formData — the app's formData shape (caseDetails, panelMembership,
     * stage1, stage2, finalUpliftPercent, evidenceOnFileConfirmed).
     *
     * meta — everything the caller decides so this module doesn't have to:
     *   appName, appVersion, appReleaseDate, guideVersionInfo,
     *   generatedDateText   ("7 August 2026" — shown in the document),
     *   headerSubtitle      ("Uplift Justification  |  <matter>"),
     *   ceilingPercent      (number or null — line omitted when null),
     *   thresholdSatisfied  (met OR deemed — gates the Stage 2 section),
     *   thresholdDeemedOnly (deemed with nothing ticked — gates the line),
     *   createdIso          (optional, for deterministic test fixtures).
     */
    function buildUpliftDocx(formData, meta) {
        var nowIso = meta.createdIso ||
            new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
        var enc = fflate.strToU8;
        var parts = {
            "[Content_Types].xml": enc(CONTENT_TYPES),
            "_rels/.rels": enc(PACKAGE_RELS),
            "word/document.xml": enc(buildDocumentXml(formData, meta)),
            "word/_rels/document.xml.rels": enc(DOCUMENT_RELS),
            "word/header1.xml": enc(buildHeaderXml(meta)),
            "word/footer1.xml": enc(buildFooterXml()),
            "docProps/core.xml": enc(buildCorePropsXml(meta, nowIso))
        };
        // Fixed zip timestamp: byte-identical output for identical input, so
        // fixture diffs mean something. The real generation time lives in
        // core.xml above; Word never reads zip mtimes.
        return fflate.zipSync(parts, {
            level: 6,
            mtime: new Date("2026-01-01T00:00:00Z")
        });
    }

    return buildUpliftDocx;
}));
