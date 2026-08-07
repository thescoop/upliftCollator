/**
 * Builds the Uplift Justification .docx entirely in the browser (or in Node,
 * for tests) from the form's data. No network, no CDN — the only dependency is
 * the vendored fflate (vendor/fflate.umd.min.js), which zips the OOXML parts.
 *
 * WHY HAND-WRITTEN XML RATHER THAN A LIBRARY. The document is a handful of
 * paragraph shapes — a title, shaded section headings, tab-aligned detail rows,
 * coded item lines, explanations — and the only .docx library with a browser
 * build is ~1.12 MB with five embedded dependencies. This file plus fflate is
 * ~one tenth of that, and every byte that ends up in a document a solicitor
 * signs can be read here in full. Decision and survey: _PLAN.md, "THE .DOCX
 * OUTPUT".
 *
 * THE LAYOUT IS SIGNED OFF. Five design rounds ended with a hand-edited
 * edited document as the source of truth; the round-5 mockup generator
 * reproduced it byte for byte and this file is that generator with the approved
 * configuration (Cambria display face, Calibri body, Stage 2 shown as codes,
 * grey rather than teal limb titles) baked in. There is no design switch: the
 * app ships one document. Anything visual changed here is a change to a
 * signed-off document, so change it deliberately or not at all.
 *
 * ── THE PARAGRAPH STREAM IS AN EXTRACTION CONTRACT ─────────────────────────
 *
 * _narrator/extract_docx.py reads this document with python-docx and matches
 * whole paragraphs. The grammar it reads, in document order:
 *
 *   "Uplift Justification"                     the title
 *   "MATTER DETAIL"                            a shaded section heading
 *   "Matter\t<value>"                          tab-delimited detail rows:
 *   "Fee earner\t<value>"                        Matter, Fee earner,
 *   "Memberships\t- <first membership>"          Memberships, Proceedings, Court
 *   "- <further membership>"                   continuation rows, one per line
 *   "Proceedings\t<value>", "Court\t<value>"
 *   "STAGE 1 : Threshold route\t\n<route sentence>"      ONE composite paragraph
 *   "Limb (a) — <limb title>"                  a group heading per limb present
 *   "A01\t<label>"                             code-prefixed Stage 1 items
 *   "STAGE 2 : Level of enhancement\t\n<route sentence>" ONE composite paragraph
 *   "CARE 05\t<label>"                         code-prefixed Stage 2 factors
 *   "<the fee earner's explanation>"           one paragraph, however many lines
 *   "PROPOSED UPLIFT"
 *   "Solicitor’s proposed uplift\t<n>%"
 *   "Applicable ceiling for this court (CAG 12.2)\t<n>%"   omitted when null
 *   "EVIDENCE ON FILE : Confirmed" | "EVIDENCE ON FILE : Unconfirmed"
 *   "About this summary" + the disclaimer paragraph   (bottom-pinned frame; they
 *                                                      sit HERE in document
 *                                                      order, before the glyph
 *                                                      sentence, because that is
 *                                                      where the source file put
 *                                                      them)
 *   "✓   <evidence sentence>" | "✗   <evidence sentence>"
 *
 * The properties that retire the two worst defect classes this project has had
 * still hold, and hold only while this file keeps them true:
 *
 *   1. One logical line is exactly one <w:p> — with ONE deliberate exception:
 *      the two composite route headings, where a tab and a soft line break join
 *      the heading to its route sentence inside a single paragraph, so
 *      python-docx returns "STAGE 1 : Threshold route\t\nEstablished by…".
 *      That is a designed shape, not a wrap: it is stable, and the parser
 *      splits on the "\t\n". Nothing else may split a logical line across
 *      paragraphs, and no paragraph boundary is ever encoded as a newline
 *      inside <w:t>.
 *   2. Solicitor-typed newlines (textarea explanations) become <w:br/> runs
 *      inside the explanation's own paragraph — python-docx returns them as
 *      "\n" within that paragraph's text. So a solicitor pasting a block
 *      containing "EVIDENCE ON FILE" puts it INSIDE the explanation, where no
 *      line of it can ever equal a heading paragraph.
 *   3. TABS ARE MACHINE DELIMITERS IN EVERY PARAGRAPH THIS FILE COMPOSES.
 *      Every scalar the fee earner types into a single-line field — matter
 *      name, fee earner, matter type, court, the uplift figure — goes through
 *      cleanScalar(), which turns tabs and newlines into spaces. So in any
 *      paragraph built from parts, "Matter\t…" or "A01\t…", the tab was put
 *      there by this file and the value beside it cannot contain another one.
 *      EXPLANATIONS ARE THE EXCEPTION, DELIBERATELY: a textarea is prose the
 *      solicitor typed, and stripping a tab out of it would silently edit their
 *      words. An explanation is emitted as ONE paragraph of its own containing
 *      nothing else, so whatever tabs and newlines it carries stay inside it —
 *      the reader treats it as opaque and never grammar-matches its content,
 *      even when a line of it looks exactly like a heading — which rule 1 and
 *      rule 2 buy. A reader must therefore treat an explanation paragraph as
 *      opaque text: never split it on "\n" and match the pieces against this
 *      grammar, because a pasted line inside it can look exactly like one.
 *   4. No decorative empty paragraphs carrying text. The body does contain four
 *      empty paragraphs — three section dividers and one gap before the
 *      evidence block — which exist to carry a rule line and spacing. They
 *      hold no runs at all, so python-docx returns "" for them and any reader
 *      skipping empty paragraphs never sees them. Do not give them text.
 *   5. Per-page furniture lives in real footer parts (there is no header part
 *      at all), so the body stream python-docx walks contains no repeated
 *      page furniture — the PDF path's HEADER_PATTERN/FOOTER_PATTERN stripping
 *      has no docx equivalent because there is nothing to strip.
 *   6. Item codes come from content-data.js, where they are frozen literals.
 *      They are printed, so they are part of the contract: see the comment
 *      above QUESTION_BLOCKS and tests/test_item_codes.js.
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

    // ── Text safety ────────────────────────────────────────────────────────
    //
    // XML 1.0 cannot carry most control characters at all — not escaped, not
    // raw. A stray U+000B pasted into a textarea would otherwise produce a
    // file Word flatly refuses ("unreadable content"). Each such character is
    // replaced with a space: they are invisible whitespace-class characters,
    // so a space preserves what the solicitor saw on screen, whereas refusing
    // the download over a character they cannot see or find would strand
    // them. \t and \n survive here (\n becomes <w:br/> in run()); \r is
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

    // Single-line user input. The tab is this document's field separator
    // ("Matter\t<value>", "A01\t<label>"), so a tab typed or pasted into a
    // scalar field would let user text imitate structure. Stripped to a space,
    // along with newlines, which have no meaning in a one-line field.
    function cleanScalar(value) {
        return cleanText(value).replace(/[\t\n]/g, " ");
    }

    function escapeXml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // ── Palette ────────────────────────────────────────────────────────────
    // The approved palette, read out of the signed-off source document.
    var INK = "242628";        // title
    var BODY = "3F4447";       // body text and shaded-heading text
    var GREY = "666D70";       // detail values, small-caps headings, About text
    var TEAL = "64A0AA";       // title rule, detail labels, item codes
    var PALE = "EAF2F3";       // shaded heading fill
    var RULE = "C8D0D2";       // divider and frame rules
    var ITEMRULE = "E3E7E8";   // the hairline under each Stage 1 item
    var FOOT = "777D80";       // footer text
    var CHECK_BLUE = "0070C0"; // the ✓
    var ALERT = "873D39";      // the ✗

    // ── Run and paragraph builders ─────────────────────────────────────────
    //
    // Formatting is applied per run. Child order inside rPr and pPr follows the
    // WordprocessingML schema — Word repairs (or rejects) files that disorder
    // them — and the attribute order matches what Word itself wrote in the source
    // file, so a diff against the source document is about content, not about us.
    // Sizes are half-points (8pt → 16); colours are RRGGBB.

    function runProps(opts) {
        var font = opts.font;
        var xml = "<w:rPr>";
        xml += '<w:rFonts w:ascii="' + font + '" w:eastAsia="' + font +
            '" w:hAnsi="' + font + '" w:cs="' + font + '"/>';
        if (opts.bold) xml += "<w:b/><w:bCs/>";
        if (opts.smallCaps) xml += "<w:smallCaps/>";
        xml += "<w:noProof/>";
        if (opts.color) xml += '<w:color w:val="' + opts.color + '"/>';
        if (opts.letterSpc) xml += '<w:spacing w:val="' + opts.letterSpc + '"/>';
        if (opts.szHalf) {
            xml += '<w:sz w:val="' + opts.szHalf + '"/><w:szCs w:val="' + opts.szHalf + '"/>';
        }
        return xml + "</w:rPr>";
    }

    // One run of already-cleaned text. Solicitor newlines become <w:br/> so
    // they stay inside this paragraph (rule 2 above). xml:space="preserve" on
    // every <w:t> keeps leading and trailing spaces — the evidence sentence
    // begins with two, and losing one would break the extraction match.
    function run(text, opts) {
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

    function tabRun(opts) { return "<w:r>" + runProps(opts) + "<w:tab/></w:r>"; }
    function brRun(opts) { return "<w:r>" + runProps(opts) + "<w:br/></w:r>"; }

    // pPr in schema order: keepNext/keepLines, framePr, pBdr, shd, tabs,
    // spacing, ind, then the paragraph-mark rPr. Measurements are twips.
    function paraProps(p) {
        var xml = "";
        if (p.keepNext) xml += "<w:keepNext/>";
        if (p.keepLines) xml += "<w:keepLines/>";
        if (p.frame) {
            xml += '<w:framePr w:wrap="around" w:vAnchor="page" w:hAnchor="page" w:x="' +
                p.frame.x + '" w:y="' + p.frame.y + '"/>';
        }
        var b = p.borders || {};
        function side(name, s) {
            return s ? "<w:" + name + ' w:val="single" w:sz="' + s.sz +
                '" w:space="' + s.space + '" w:color="' + s.color + '"/>' : "";
        }
        if (b.top || b.left || b.bottom) {
            xml += "<w:pBdr>" + side("top", b.top) + side("left", b.left) +
                side("bottom", b.bottom) + "</w:pBdr>";
        }
        if (p.shd) xml += '<w:shd w:val="clear" w:color="auto" w:fill="' + p.shd + '"/>';
        if (p.tabs && p.tabs.length) {
            xml += "<w:tabs>";
            for (var i = 0; i < p.tabs.length; i++) {
                xml += '<w:tab w:val="' + (p.tabs[i].right ? "right" : "left") +
                    '" w:pos="' + p.tabs[i].pos + '"/>';
            }
            xml += "</w:tabs>";
        }
        if (p.spacing) {
            var s = "<w:spacing";
            if (p.spacing.before != null) s += ' w:before="' + p.spacing.before + '"';
            if (p.spacing.after != null) s += ' w:after="' + p.spacing.after + '"';
            if (p.spacing.line != null) s += ' w:line="' + p.spacing.line + '" w:lineRule="auto"';
            xml += s + "/>";
        }
        if (p.ind) {
            var ind = '<w:ind w:left="' + p.ind.left + '"';
            if (p.ind.hanging) ind += ' w:hanging="' + p.ind.hanging + '"';
            xml += ind + "/>";
        }
        // The paragraph mark's own size bounds the height of the last line, so
        // a 16-half-point mark on an 8pt row keeps the row tight. The source file
        // carried these and the layout depends on them.
        if (p.markRPr) xml += p.markRPr;
        return xml ? "<w:pPr>" + xml + "</w:pPr>" : "";
    }

    function paragraph(runsXml, opts) {
        return "<w:p>" + paraProps(opts || {}) + runsXml + "</w:p>";
    }

    // ── Reading the form ───────────────────────────────────────────────────

    // The ticked entries of one section, each paired with its key, because the
    // key is how an entry finds its printed code.
    function checkedEntries(sectionObj) {
        var out = [];
        for (var key in sectionObj) {
            if (Object.prototype.hasOwnProperty.call(sectionObj, key) &&
                sectionObj[key] && sectionObj[key].checked) {
                out.push({ key: key, e: sectionObj[key] });
            }
        }
        return out;
    }

    // The printed code for one ticked item. The app writes `code` onto every
    // Stage 1 / Stage 2 entry from content-data.js when it reads the form
    // (script.js, saveStage1FromDom / saveStage2FromDom); meta.codes is a
    // fallback for callers that build formData by hand, accepted either as
    // key -> "A01" or key -> { code: "A01" }. "???" is deliberately visible: a
    // silent blank would hide a data fault in a document nobody re-reads.
    function codeFor(key, entry, meta) {
        if (entry && entry.code) return String(entry.code);
        var table = meta && meta.codes;
        var found = table && Object.prototype.hasOwnProperty.call(table, key)
            ? table[key] : null;
        if (typeof found === "string") return found;
        if (found && found.code) return String(found.code);
        return "???";
    }

    // Stage 1 items are grouped under their limb. Both the letter (which
    // orders the groups) and the printed heading come from the block title the
    // form recorded on the entry — "Threshold limb (a): exceptional competence,
    // skill or expertise" becomes "Limb (a) — exceptional competence, skill or
    // expertise". The item's code letter is the fallback if the title is ever
    // missing, so a group still forms rather than collapsing into one bucket.
    function limbOf(entry, code) {
        var m = String((entry && entry.categoryTitle) || "")
            .match(/limb \(([abc])\)\s*[:—-]?\s*(.*)$/i);
        if (m) {
            return {
                letter: m[1].toLowerCase(),
                heading: "Limb (" + m[1].toLowerCase() + ") — " + m[2]
            };
        }
        var letter = /^[ABC]/.test(code) ? code.charAt(0).toLowerCase() : "?";
        return {
            letter: letter,
            heading: (entry && entry.categoryTitle) || "Limb (" + letter + ")"
        };
    }

    function byCode(a, b) { return a.code < b.code ? -1 : (a.code > b.code ? 1 : 0); }

    // ── Document body ──────────────────────────────────────────────────────

    var DISP_FONT = "Cambria";   // title and the About heading
    var BODY_FONT = "Calibri";   // everything else
    var GLYPH_FONT = "Segoe UI Symbol";

    var DETAIL_TAB = 1757;   // 31mm — the stop the shaded headings share
    var UPLIFT_TAB = 3969;   // 70mm right tab for the uplift figures
    var CODE_TAB_S1 = 680;   // Stage 1 code column
    var CODE_TAB_S2 = 1190;  // Stage 2 code column (wider codes)
    var MARK16 = '<w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>';
    var MARK17 = '<w:rPr><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr>';

    var S = {
        title:     { font: DISP_FONT, bold: true, color: INK, szHalf: 36 },
        shadeHead: { font: BODY_FONT, bold: true, color: BODY, szHalf: 18 },
        shadeBody: { font: BODY_FONT, color: BODY, szHalf: 19 },
        shadeBold: { font: BODY_FONT, bold: true, color: BODY, szHalf: 19 },
        detailLbl: { font: BODY_FONT, bold: true, color: TEAL, szHalf: 16 },
        detailVal: { font: BODY_FONT, smallCaps: true, color: GREY, letterSpc: 16, szHalf: 16 },
        smallHead: { font: BODY_FONT, bold: true, smallCaps: true, color: GREY, letterSpc: 16, szHalf: 16 },
        code:      { font: BODY_FONT, bold: true, color: TEAL, szHalf: 16 },
        codeTab:   { font: BODY_FONT, bold: true, color: INK, szHalf: 20 },
        itemLabel: { font: BODY_FONT, color: BODY, szHalf: 19 },
        expl:      { font: BODY_FONT, color: BODY, szHalf: 19 },
        upliftTxt: { font: BODY_FONT, color: GREY, szHalf: 17 },
        sentinel:  { font: BODY_FONT, color: GREY, szHalf: 19 },
        aboutHead: { font: DISP_FONT, bold: true, color: GREY, szHalf: 18 },
        aboutText: { font: BODY_FONT, color: GREY, szHalf: 15 },
        glyphOk:   { font: GLYPH_FONT, bold: true, color: CHECK_BLUE },
        glyphBad:  { font: GLYPH_FONT, bold: true, color: ALERT },
        glyphGap:  { font: BODY_FONT, bold: true },
        evStmt:    { font: BODY_FONT, color: BODY, szHalf: 19 }
    };

    // The disclaimer, as one paragraph pinned to the foot of the first page by
    // a Word text frame. One paragraph rather than the PDF's five lines was
    // a decision from the design rounds.
    var ABOUT_TEXT =
        "This summary was generated from information entered by the named fee " +
        "earner for secure transmission to Woodruff Billing Ltd and preparation " +
        "of an LAA enhancement narrative. Woodruff Billing Ltd has not verified " +
        "the information in this summary. The fee earner remains responsible for " +
        "the accuracy and completeness of the facts and explanations provided. " +
        "The proposed uplift is the fee earner’s proposal. The Collator " +
        "neither calculates nor recommends a percentage. Woodruff Billing Ltd " +
        "will decide what claim to advance after reviewing the file, and any " +
        "enhancement allowed is a matter for the Legal Aid Agency.";
    var ABOUT_FRAME = { x: 1093, y: 13610 };

    // The rule between sections. No runs at all — see rule 4 in the header.
    function divider() {
        return paragraph("", {
            keepNext: true,
            borders: { bottom: { sz: 4, space: 3, color: RULE } },
            spacing: { before: 280, after: 120 },
            markRPr: MARK16
        });
    }

    function shadedHeading(text) {
        return paragraph(run(text, S.shadeHead),
            { shd: PALE, tabs: [{ pos: DETAIL_TAB }] });
    }

    // Heading, tab, soft line break, route sentence — ONE paragraph, so
    // python-docx returns "STAGE 1 : Threshold route\t\nEstablished by…".
    // The single deliberate exception to one-line-one-paragraph (rule 1).
    function compositeHeading(headText, routeRuns) {
        return paragraph(
            run(headText, S.shadeHead) + tabRun(S.shadeBody) + brRun(S.shadeBody) + routeRuns,
            { shd: PALE, tabs: [{ pos: DETAIL_TAB }] });
    }

    function detailRow(label, valueRuns) {
        return paragraph(
            run(label, S.detailLbl) + tabRun(S.detailLbl) + valueRuns,
            {
                keepNext: true, tabs: [{ pos: DETAIL_TAB }],
                spacing: { after: 20 }, markRPr: MARK16
            });
    }

    function buildBodyXml(formData, meta) {
        var cd = formData.caseDetails || {};
        var xml = "";
        var i;

        // ── Title ──
        xml += paragraph(run("Uplift Justification", S.title), {
            keepNext: true,
            borders: { bottom: { sz: 6, space: 4, color: TEAL } },
            spacing: { after: 100 }
        });

        // ── MATTER DETAIL ──
        xml += shadedHeading("MATTER DETAIL");
        xml += detailRow("Matter", run(cleanScalar(cd.caseMatterName) || "N/A", S.detailVal));
        xml += detailRow("Fee earner", run(cleanScalar(cd.feeEarnerName) || "N/A", S.detailVal));

        // Panel membership is a dash list inside the detail block — there is no
        // longer a PANEL MEMBERSHIP section and no panel sentence. The label
        // prefix is dropped so the row reads as a list of memberships rather
        // than as five repetitions of "Fee earner is on".
        var panel = checkedEntries(formData.panelMembership);
        if (panel.length) {
            xml += detailRow("Memberships", run(
                "- " + cleanScalar(String(panel[0].e.label || "")
                    .replace(/^Fee earner is on\s+(the\s+)?/i, "")), S.detailVal));
            for (i = 1; i < panel.length; i++) {
                xml += paragraph(run(
                    "- " + cleanScalar(String(panel[i].e.label || "")
                        .replace(/^Fee earner is on\s+(the\s+)?/i, "")), S.detailVal), {
                    keepNext: true, spacing: { after: 20 },
                    ind: { left: DETAIL_TAB }, markRPr: MARK16
                });
            }
        } else {
            xml += detailRow("Memberships", run("None recorded", S.detailVal));
        }
        xml += detailRow("Proceedings", run(cleanScalar(cd.matterType) || "N/A", S.detailVal));
        xml += detailRow("Court", run(cleanScalar(cd.courtLevel) || "N/A", S.detailVal));
        xml += divider();

        // ── STAGE 1 ──
        // The route sentence is part of the heading paragraph. Both citations
        // are established by _spec-7.20-7.24-verbatim.md (7.23(a) from the Family
        // rules; 6.13 and 6.15 from its General Rules section), which is why they are
        // paragraph numbers and not a paraphrase.
        var routeRuns;
        if (meta.thresholdDeemedOnly) {
            routeRuns = run("Deemed satisfied", S.shadeBold) +
                run(" for the named fee earner’s work by relevant panel membership " +
                    "(Spec para 7.23(a)).", S.shadeBody);
        } else {
            routeRuns = run("Established by the Stage 1 selections below (Spec para 6.13).",
                S.shadeBody);
        }
        xml += compositeHeading("STAGE 1 : Threshold route", routeRuns);

        var s1 = checkedEntries(formData.stage1);
        if (!s1.length) {
            // The sentinel that lets the narrator tell an empty section from a
            // section it failed to parse. On the deemed route it also says why
            // the section is empty, so the two facts are never separated.
            xml += paragraph(run(
                meta.thresholdDeemedOnly
                    ? "No Stage 1 threshold factors were selected; the deemed route stated above applies."
                    : "No Stage 1 threshold factors selected.", S.sentinel),
                { spacing: { before: 200, after: 40 } });
        } else {
            var groups = {};
            var letters = [];
            for (i = 0; i < s1.length; i++) {
                var code1 = codeFor(s1[i].key, s1[i].e, meta);
                var limb = limbOf(s1[i].e, code1);
                if (!groups[limb.letter]) {
                    groups[limb.letter] = { heading: limb.heading, items: [] };
                    letters.push(limb.letter);
                }
                groups[limb.letter].items.push({ code: code1, label: s1[i].e.label });
            }
            letters.sort();
            for (i = 0; i < letters.length; i++) {
                var g = groups[letters[i]];
                g.items.sort(byCode);
                xml += paragraph(run(g.heading, S.smallHead),
                    { keepNext: true, spacing: { before: 200, after: 40 } });
                for (var j = 0; j < g.items.length; j++) {
                    xml += paragraph(
                        run(g.items[j].code, S.code) + tabRun(S.codeTab) +
                        run(g.items[j].label, S.itemLabel),
                        {
                            borders: { bottom: { sz: 2, space: 2, color: ITEMRULE } },
                            tabs: [{ pos: CODE_TAB_S1 }],
                            spacing: { before: 20, after: 40 },
                            ind: { left: CODE_TAB_S1, hanging: CODE_TAB_S1 }
                        });
                }
            }
        }
        xml += divider();

        // ── STAGE 2 ──
        xml += compositeHeading("STAGE 2 : Level of enhancement",
            run("Established by the Stage 2 selections below (Spec para 6.15).", S.shadeBody));

        var s2 = checkedEntries(formData.stage2);
        if (!s2.length) {
            xml += paragraph(run("No Stage 2 factors were selected.", S.sentinel),
                { spacing: { before: 240, after: 40 } });
        } else {
            var factors = [];
            for (i = 0; i < s2.length; i++) {
                factors.push({
                    code: codeFor(s2[i].key, s2[i].e, meta),
                    label: s2[i].e.label,
                    explanation: s2[i].e.explanation
                });
            }
            factors.sort(byCode);
            for (i = 0; i < factors.length; i++) {
                // The code carries the category, so the "Care - " prefix the
                // PDF printed is gone: the line is CODE, tab, label.
                xml += paragraph(
                    run(factors[i].code, S.code) + tabRun(S.codeTab) +
                    run(factors[i].label, S.smallHead),
                    {
                        keepNext: true,
                        tabs: [{ pos: CODE_TAB_S2 }],
                        spacing: { before: 240, after: 40 },
                        ind: { left: CODE_TAB_S2, hanging: CODE_TAB_S2 },
                        markRPr: MARK16
                    });
                // The explanation paragraph is MANDATORY in the grammar: the
                // parser consumes exactly one paragraph after every item row,
                // opaquely, and that is only unambiguous if the paragraph is
                // always there. The app's wizard gate blocks empty explanations,
                // but this generator cannot assume its caller is the app
                // (fixtures and tests drive it directly), so an empty one
                // prints a fixed sentinel the parser maps back to "". One paragraph however
                // many lines the solicitor typed (rule 2). No "Explanation: "
                // prefix — the rule down the left margin says what it is.
                xml += paragraph(
                    run(factors[i].explanation || "No explanation was provided.", S.expl), {
                        keepLines: true,
                        borders: { left: { sz: 6, space: 8, color: RULE } },
                        spacing: { after: 180, line: 276 },
                        ind: { left: 283 }
                    });
            }
        }
        xml += divider();

        // ── PROPOSED UPLIFT ──
        xml += shadedHeading("PROPOSED UPLIFT");
        xml += paragraph(
            run("Solicitor’s proposed uplift", S.upliftTxt) + tabRun(S.upliftTxt) +
            run((cleanScalar(formData.finalUpliftPercent) || "Not Set") + "%", S.upliftTxt),
            { tabs: [{ pos: UPLIFT_TAB, right: true }], spacing: { after: 140 }, markRPr: MARK17 });
        if (meta.ceilingPercent !== null && meta.ceilingPercent !== undefined) {
            xml += paragraph(
                run("Applicable ceiling for this court (CAG 12.2)", S.upliftTxt) +
                tabRun(S.upliftTxt) + run(meta.ceilingPercent + "%", S.upliftTxt),
                { tabs: [{ pos: UPLIFT_TAB, right: true }], spacing: { after: 140 }, markRPr: MARK17 });
        }
        // The gap before the evidence block. Runless, like the dividers.
        xml += paragraph("", { spacing: { after: 140 } });

        // ── EVIDENCE ON FILE — printed in both states, never omitted ──
        var ok = !!formData.evidenceOnFileConfirmed;
        xml += paragraph(
            run("EVIDENCE ON FILE", S.shadeHead) +
            run(" : " + (ok ? "Confirmed" : "Unconfirmed"), S.shadeBody),
            { shd: PALE, tabs: [{ pos: DETAIL_TAB }] });

        // ── About this summary ──
        // Frame-pinned to the foot of the page, but written HERE in document
        // order — before the evidence sentence — because that is where the source
        // approved file put it, and the paragraph stream is a contract.
        xml += paragraph(run("About this summary", S.aboutHead), {
            keepNext: true, frame: ABOUT_FRAME,
            borders: { top: { sz: 4, space: 4, color: RULE } },
            spacing: { after: 60 }
        });
        xml += paragraph(run(ABOUT_TEXT, S.aboutText), {
            keepLines: true, frame: ABOUT_FRAME, spacing: { after: 0, line: 276 }
        });

        // ── The evidence sentence, led by its glyph ──
        var glyph = ok ? S.glyphOk : S.glyphBad;
        xml += paragraph(
            run(ok ? "✓" : "✗", glyph) +
            run(" ", { font: BODY_FONT, bold: true, color: glyph.color }) +
            run(ok
                ? "  The fee earner confirms that evidence supporting the matters set out above is held on the case file."
                : "  The fee earner has not confirmed that supporting evidence is held on the case file. The narrative will not assert that it is.",
                S.evStmt),
            { spacing: { after: 100, line: 259 } });

        return xml;
    }

    // ── Footer parts ───────────────────────────────────────────────────────
    //
    // Two of them: a first-page footer carrying the guidance version and the
    // generation stamp, and the default footer for every page after it. There
    // is no header part at all — the design puts nothing at the top of the
    // page but the title, and the matter name is stated once, in MATTER DETAIL.

    function footRun(text, color) {
        return "<w:r>" + runProps({ font: "Calibri", color: color, szHalf: 15 }) +
            '<w:t xml:space="preserve">' + escapeXml(text) + "</w:t></w:r>";
    }

    // A complex field, not <w:fldSimple>: this is the form Word itself writes,
    // and it carries a cached "1" so a reader that never updates fields still
    // shows a number rather than an empty space.
    function footField(instr) {
        var props = runProps({ font: "Calibri", color: FOOT, szHalf: 15 });
        return "<w:r>" + props + '<w:fldChar w:fldCharType="begin"/></w:r>' +
            "<w:r>" + props + '<w:instrText xml:space="preserve"> ' + instr + " </w:instrText></w:r>" +
            "<w:r>" + props + '<w:fldChar w:fldCharType="separate"/></w:r>' +
            "<w:r>" + props + "<w:t>1</w:t></w:r>" +
            "<w:r>" + props + '<w:fldChar w:fldCharType="end"/></w:r>';
    }

    // The line both footers share: the confidentiality statement (this document
    // goes to Woodruff Billing and the narrator, NOT to the LAA) and the page
    // count, right-aligned at the text width.
    function confidentialLine() {
        return "<w:p><w:pPr>" +
            '<w:pBdr><w:top w:val="single" w:sz="4" w:space="6" w:color="' + RULE + '"/></w:pBdr>' +
            '<w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs><w:spacing w:after="20"/></w:pPr>' +
            footRun("CONFIDENTIAL — Prepared for Woodruff Billing Ltd · © 2026", FOOT) +
            "<w:r>" + runProps({ font: "Calibri", color: FOOT, szHalf: 15 }) +
            '<w:tab/><w:t xml:space="preserve">Page </w:t></w:r>' +
            footField("PAGE") + footRun(" of ", FOOT) + footField("NUMPAGES") +
            "</w:p>";
    }

    var FTR_OPEN = '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">';

    function appLabel(meta) {
        return (meta.appName || "Uplift Collator") + " v" + meta.appVersion;
    }

    function buildFooterDefaultXml(meta) {
        var second = '<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs></w:pPr>' +
            footRun(appLabel(meta) + " — " + meta.generatedDateText, FOOT) + "</w:p>";
        return xmlPart(FTR_OPEN + confidentialLine() + second + "</w:ftr>");
    }

    function buildFooterFirstXml(meta) {
        var second = '<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="9638"/></w:tabs></w:pPr>' +
            footRun(meta.guideVersionInfo, GREY) +
            "<w:r>" + runProps({ font: "Calibri", color: GREY, szHalf: 15 }) + "<w:br/></w:r>" +
            footRun(appLabel(meta) + ".     ", FOOT) +
            footRun("Generated " + meta.generatedDateText, GREY) + "</w:p>";
        return xmlPart(FTR_OPEN + confidentialLine() + second + "</w:ftr>");
    }

    // ── Package plumbing ───────────────────────────────────────────────────

    function xmlPart(content) {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + content;
    }

    // docDefaults only. There is no theme part, so the theme font references
    // Word would normally write are replaced by explicit Calibri; every run in
    // the body names its own font in any event. The one real style is Normal,
    // which exists because Word expects a default paragraph style to be there.
    var STYLES = xmlPart(
        '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        "<w:docDefaults><w:rPrDefault><w:rPr>" +
        '<w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>' +
        '<w:kern w:val="2"/><w:sz w:val="24"/><w:szCs w:val="24"/>' +
        '<w:lang w:val="en-GB" w:eastAsia="en-GB" w:bidi="ar-SA"/>' +
        "</w:rPr></w:rPrDefault>" +
        '<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="278" w:lineRule="auto"/></w:pPr></w:pPrDefault>' +
        "</w:docDefaults>" +
        '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
        "</w:styles>"
    );

    var CONTENT_TYPES = xmlPart(
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
        '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
        '<Override PartName="/word/footer2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
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
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '<Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
        '<Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/>' +
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
            "<dc:creator>" + escapeXml(appLabel(meta)) + "</dc:creator>" +
            "<cp:lastModifiedBy>" + escapeXml(appLabel(meta)) + "</cp:lastModifiedBy>" +
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
            // Two footers and no header. titlePg is what makes the first-page
            // footer apply to page 1 alone; without it footer2 is never used.
            '<w:footerReference w:type="default" r:id="rId7"/>' +
            '<w:footerReference w:type="first" r:id="rId8"/>' +
            '<w:pgSz w:w="11906" w:h="16838"/>' +
            '<w:pgMar w:top="1020" w:right="1134" w:bottom="1077" w:left="1134" w:header="397" w:footer="510" w:gutter="0"/>' +
            '<w:cols w:space="720"/>' +
            "<w:titlePg/>" +
            "</w:sectPr>" +
            "</w:body>" +
            "</w:document>"
        );
    }

    /**
     * Build the .docx and return its bytes as a Uint8Array.
     *
     * formData — the app's formData shape (caseDetails, panelMembership,
     * stage1, stage2, finalUpliftPercent, evidenceOnFileConfirmed). Stage 1 and
     * Stage 2 entries carry `code` (from content-data.js) and `categoryTitle`
     * (the block title) as well as `label` and `explanation`.
     *
     * meta — everything the caller decides so this module doesn't have to:
     *   appName, appVersion       ("Uplift Collator", "1.13" — footer, creator)
     *   guideVersionInfo          (first-page footer, line 1)
     *   generatedDateText         ("7 August 2026" — both footers)
     *   ceilingPercent            (number or null — the line is omitted when null)
     *   thresholdDeemedOnly       (deemed with nothing ticked — picks the Stage 1
     *                              route sentence and the sentinel wording)
     *   codes                     (optional key -> code fallback; see codeFor)
     *   createdIso                (optional, for deterministic test fixtures)
     *
     * Accepted and ignored, so existing callers keep working: appReleaseDate
     * and headerSubtitle are no longer printed anywhere (there is no header
     * part, and the footer carries the generation date instead of the release
     * date); thresholdSatisfied no longer gates the Stage 2 section, which the
     * approved design always prints. The download button is disabled unless the
     * threshold is satisfied, so that gate is enforced before this is called.
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
            "word/styles.xml": enc(STYLES),
            "word/footer1.xml": enc(buildFooterDefaultXml(meta)),
            "word/footer2.xml": enc(buildFooterFirstXml(meta)),
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
