"""
narrate_gui.py
==============
PyQt6 GUI front-end for the LAA Uplift Narrator.

Drop a Collator-generated summary (.docx, or PDF for older matters) on the
window (or click Browse) and click
"Generate Narrative". The tool extracts the solicitor's answers, assembles
the structured Markdown skeleton, and produces the paste-ready LM Studio
prompt — all visible directly in the window with one-click "Copy to Clipboard"
buttons. The same files are also written to disk in case you want to drop them
into LM Studio / Ollama or share them.

Architecture (follows the myToolbox Manager/Window/Card/Worker pattern, so
this module can drop into ~/coding/myToolbox later with minimal changes)
-------------------------------------------------------------------------
  NarrateWorker     — QThread: runs extract → skeleton → prompts; emits log lines
  NarrateCard       — QFrame: drop zone, controls, log area, output tabs
  NarrateWindow     — QMainWindow: always-on-top container hosting the Card
  NarrateManager    — QObject: owns the Window lifecycle (single instance)

Run standalone via ``python narrate_gui.py [path/to/case.docx]`` — the optional
path pre-loads the file so you only need to click Generate.
"""

# ── Standard library imports ────────────────────────────────────────────────
import html
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

# ── PyQt6 imports ───────────────────────────────────────────────────────────
from PyQt6.QtWidgets import (
    QApplication, QFrame, QMainWindow, QWidget,
    QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QTextEdit, QPlainTextEdit, QTabWidget,
    QFileDialog, QSizePolicy, QComboBox, QMessageBox,
)
from PyQt6.QtCore import Qt, QObject, QThread, pyqtSignal
from PyQt6.QtGui import QFont, QDragEnterEvent, QDropEvent

# ── Sibling modules from this folder ────────────────────────────────────────
import checks as checks_mod
import docx_writer
import lmstudio
import polish as polish_mod
import prompts as prompts_mod
from extract import (
    describe_unrecognised_criteria,
    explain_empty_extraction,
    extract_formdata,
    extraction_is_empty,
    threshold_coherence_error,
    unevidenced_other_factors,
)
from skeleton import build_skeleton


# ─────────────────────────────────────────────────────────────────────────────
# Section 1 — Dark theme colour constants (myToolbox palette)
# Redefined locally to avoid circular imports if/when this file moves into
# myToolbox.py — see myToolbox/CLAUDE.md.
# ─────────────────────────────────────────────────────────────────────────────

BG_CARD    = "#2a2a3e"   # Card background
BG_OUTER   = "#1e1e2e"   # Outer / main window background
BG_BUTTON  = "#3a3a5e"   # Button normal state
BG_HOVER   = "#4a4a7e"   # Button hover state
TEXT_MAIN  = "#cdd6f4"   # Primary text
TEXT_DIM   = "#9399b2"   # Muted labels / headings
ACCENT     = "#89b4fa"   # Blue accent


# Font stacks. Families are given as a fallback list rather than one name so
# the same code reads well on Mutant (Windows fonts via WSL) and on a bare
# Linux box, instead of silently dropping to Qt's default at whatever size.
PROSE_FAMILIES = ["Segoe UI", "Calibri", "DejaVu Sans", "Noto Sans"]
MONO_FAMILIES  = ["Cascadia Mono", "Consolas", "DejaVu Sans Mono", "Liberation Mono"]


# What each output tab is for, in the order the tabs are added. Shown under
# the pane and as the tab's tooltip.
TAB_CAPTIONS = (
    "THE ONE YOU SEND — the finished narrative, written from the ticked "
    "criteria and their citations. Read it before it goes to the LAA.",
    "PROOF NOTHING WAS LOST — every LAA citation in the skeleton checked "
    "against the finished text, plus a second opinion from the model. Read "
    "this whenever the verdict says NEEDS REVISION.",
    "THE AUDIT TRAIL — the raw cited template the model rewrote. Also your "
    "fallback: if LM Studio is unavailable, this is what you paste in by hand.",
)


def _font(families: list[str], size: int) -> QFont:
    font = QFont()
    font.setFamilies(families)
    font.setPointSize(size)
    return font


# ─────────────────────────────────────────────────────────────────────────────
# Section 2 — NarrateWorker (background thread)
# ─────────────────────────────────────────────────────────────────────────────

class NarrateWorker(QThread):
    """
    Background worker that runs the full narrate pipeline on a summary file.

    Why a QThread? Extraction and template parsing usually finish in well
    under a second, but we don't want even a brief stall on the UI thread —
    keeping the pattern means future heavier additions stay responsive.

    Signals
    -------
    log_line(str)              — one HTML-formatted line for the log area
    success(dict)              — emitted on success with the result payload:
                                 {"out_dir": str, "skeleton": str,
                                  "prompt": str, "formdata": dict,
                                  "polished": str, "report": str}
    finished()                 — auto-emitted by QThread when run() returns
    """

    log_line = pyqtSignal(str)
    success = pyqtSignal(dict)

    def __init__(self, input_path: str, out_dir: str, model_hint: str = "",
                 consented: list[str] | None = None, parent=None):
        super().__init__(parent)
        self._input_path = input_path
        self._out_dir = out_dir
        self._model_hint = model_hint
        # The exact model ids the user agreed to unload, confirmed on the UI
        # thread before this worker starts — a background thread must never
        # raise a dialog. Naming them (rather than a bare "yes") means a model
        # that appears in the meantime cannot be evicted on that consent.
        self._consented = consented or []

    def run(self):
        try:
            self.log_line.emit(
                f'<span style="color:#88aaff;">Reading {os.path.basename(self._input_path)}…</span>'
            )
            formdata = extract_formdata(self._input_path)

            n_panel = len(formdata.get("panelMembership", {}))
            n_s1 = len(formdata.get("stage1", {}))
            n_s2 = len(formdata.get("stage2", {}))
            uplift = formdata.get("finalUpliftPercent", "")
            # "· % uplift" — a bare percent sign with no number in front of it
            # — was how a missing value used to render. Say it plainly instead.
            uplift_text = f"{uplift}% uplift" if uplift else "no uplift % found"
            self.log_line.emit(
                f'<span style="color:#88aaff;">Extracted: {n_panel} panel · '
                f'{n_s1} Stage 1 · {n_s2} Stage 2 · {uplift_text}</span>'
            )

            # A ticked item that matches no known criterion would otherwise
            # vanish from the narrative with nothing on the finished page to
            # show it had gone. Ordered ahead of the empty check for the same
            # reason as in narrate.py: when every label is damaged both are
            # true, and naming the labels is the more useful answer.
            unrecognised = formdata.get("unrecognised") or []
            if unrecognised:
                out_dir = Path(self._out_dir)
                out_dir.mkdir(parents=True, exist_ok=True)
                # By pattern, because the polished files carry the matter name.
                # See docx_writer.clear_derived.
                docx_writer.clear_derived(out_dir)
                for stale in ("narrative.md", "narrative-prompt.txt"):
                    (out_dir / stale).unlink(missing_ok=True)
                input_json = out_dir / "narrative-input.json"
                input_json.write_text(
                    json.dumps(formdata, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8",
                )
                self.log_line.emit(
                    '<span style="color:#ff6b6b;">Stopping — a ticked item could '
                    'not be matched to a criterion, so the narrative would be '
                    'missing a factor the solicitor claimed.</span>'
                )
                for line in describe_unrecognised_criteria(unrecognised).splitlines():
                    self.log_line.emit(
                        f'<span style="color:#fab387;">{html.escape(line) or "&nbsp;"}</span>'
                    )
                self.log_line.emit(
                    '<span style="color:#9399b2;">Correct each label in '
                    f'{html.escape(input_json.name)} to match content-data.js, '
                    'then re-run from a terminal:</span>'
                )
                self.log_line.emit(
                    '<span style="color:#9399b2;">python narrate.py --from-json '
                    f'"{html.escape(str(input_json))}"</span>'
                )
                return

            # The same guard as narrate.py. This file is what both launchers
            # actually run (_Generate_Uplift_Narrative.bat and _narrator.sh), so
            # a check that exists only in the CLI protects almost nobody — which
            # is how this one shipped, gated on the terminal path while the
            # advertised one went straight through to a narrative asserting a
            # threshold factor it never explained.
            unevidenced = unevidenced_other_factors(formdata)
            if unevidenced:
                out_dir = Path(self._out_dir)
                out_dir.mkdir(parents=True, exist_ok=True)
                # By pattern, because the polished files carry the matter name.
                # See docx_writer.clear_derived.
                docx_writer.clear_derived(out_dir)
                for stale in ("narrative.md", "narrative-prompt.txt"):
                    (out_dir / stale).unlink(missing_ok=True)
                input_json = out_dir / "narrative-input.json"
                input_json.write_text(
                    json.dumps(formdata, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8",
                )
                self.log_line.emit(
                    '<span style="color:#ff6b6b;">Stopping — a threshold factor '
                    'was ticked that nothing at Stage 2 explains.</span>'
                )
                for label in unevidenced:
                    self.log_line.emit(
                        f'<span style="color:#fab387;">    {html.escape(label)}</span>'
                    )
                self.log_line.emit(
                    '<span style="color:#9399b2;">These labels say only that the '
                    'work was exceptional in a respect the guidance&rsquo;s examples do '
                    'not cover. The Stage 2 explanation is the only place that says '
                    'what it was, so the narrative would promise detail the document '
                    'never gives.</span>'
                )
                self.log_line.emit(
                    '<span style="color:#9399b2;">Add the Stage 2 explanation in '
                    f'{html.escape(input_json.name)} — or delete that factor&rsquo;s whole '
                    'entry from &quot;stage1&quot;, but only if it does not apply. Setting '
                    '&quot;checked&quot;: false does not remove it: every reader here treats '
                    'the key being present as ticked. Then re-run from a terminal:</span>'
                )
                self.log_line.emit(
                    '<span style="color:#9399b2;">python narrate.py --from-json '
                    f'"{html.escape(str(input_json))}"</span>'
                )
                return

            # Nothing recovered means nothing to write. Stopping here is the
            # honest outcome: the previous behaviour built an empty skeleton,
            # spent a model call on it, and reported "NEEDS REVISION — 1
            # citation dropped", which blames the narrative for a problem that
            # is entirely in the input document.
            if extraction_is_empty(formdata):
                self.log_line.emit(
                    '<span style="color:#ff6b6b;">Nothing was extracted from this '
                    'document — no narrative can be written from it.</span>'
                )
                for line in explain_empty_extraction(self._input_path).splitlines():
                    self.log_line.emit(
                        f'<span style="color:#fab387;">{html.escape(line) or "&nbsp;"}</span>'
                    )
                self.log_line.emit(
                    '<span style="color:#9399b2;">No files were written.</span>'
                )
                return

            # Stage 2 factors with no threshold basis. build_skeleton refuses
            # this as well — the rule lives there so that it cannot be missed on
            # one path — but this pipeline is entirely independent of narrate.py
            # and would otherwise surface it as an unhandled ValueError. The GUI
            # is what the launcher scripts run, so it is the path that matters
            # most: the "other"-factor guard went into narrate.py only when it
            # was first written, and this file did not get it.
            incoherent = threshold_coherence_error(formdata)
            if incoherent:
                self.log_line.emit(
                    '<span style="color:#ff6b6b;">This document claims Stage 2 factors '
                    'with no threshold basis — stopping.</span>'
                )
                for line in incoherent.splitlines():
                    self.log_line.emit(
                        f'<span style="color:#fab387;">{html.escape(line) or "&nbsp;"}</span>'
                    )
                self.log_line.emit(
                    '<span style="color:#9399b2;">No files were written.</span>'
                )
                return

            self.log_line.emit(
                '<span style="color:#88aaff;">Building skeleton…</span>'
            )
            skeleton = build_skeleton(formdata)

            self.log_line.emit(
                '<span style="color:#88aaff;">Assembling LM Studio prompt…</span>'
            )
            case_meta = (formdata.get("caseDetails") or {}) | {
                "finalUpliftPercent": formdata.get("finalUpliftPercent", "")
            }
            # Freeze the templates for this run so the audit record matches
            # what is actually sent, even if a prompt is edited mid-run.
            snap = prompts_mod.snapshot()
            prompt = snap.assemble(skeleton, case_meta)

            # ── Write files to disk ──────────────────────────────────────
            out_dir = Path(self._out_dir)
            out_dir.mkdir(parents=True, exist_ok=True)

            docx_writer.clear_derived(out_dir)

            (out_dir / "narrative.md").write_text(skeleton + "\n", encoding="utf-8")
            (out_dir / "narrative-prompt.txt").write_text(prompt, encoding="utf-8")
            (out_dir / "narrative-input.json").write_text(
                json.dumps(formdata, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )

            # ── Polish step (local LM Studio) ────────────────────────────
            polished = ""
            report = ""
            try:
                result = polish_mod.run(
                    skeleton,
                    case_meta,
                    model_hint=self._model_hint,
                    consented=self._consented,
                    prompt_snapshot=snap,
                    n_factors=checks_mod.count_factors(formdata),
                    should_stop=self.isInterruptionRequested,
                    on_status=lambda msg: self.log_line.emit(
                        f'<span style="color:#88aaff;">{msg}</span>'
                    ),
                )
                polished = result.polished
                report = polish_mod.format_full_report(result)

                # Both formats carry the matter name; citation-check.txt does
                # not, since it certifies the run rather than being sent on.
                stem = docx_writer.polished_stem(formdata)
                (out_dir / f"{stem}.md").write_text(
                    polished + "\n", encoding="utf-8")
                (out_dir / "citation-check.txt").write_text(report, encoding="utf-8")

                # The Word file is what actually gets sent, so a conversion
                # that lost a citation is reported in the same red the pipeline
                # uses for a real failure — never left as a plausible .docx
                # sitting beside a check that certified the Markdown.
                try:
                    outcome = docx_writer.write_docx(
                        polished, out_dir / f"{stem}.docx"
                    )
                    self.log_line.emit(
                        f'<span style="color:#a6e3a1;">Word document written — '
                        f'{len(outcome.citations)} citations carried over.</span>'
                    )
                except docx_writer.NarrativeConversionError as exc:
                    for line in str(exc).splitlines():
                        self.log_line.emit(
                            f'<span style="color:#ff6b6b;">'
                            f'{html.escape(line) or "&nbsp;"}</span>'
                        )

                # Verdict reflects BOTH checks: a semantic finding from the
                # LLM review must not be shown green because the citation
                # count happened to balance.
                colour = "#a6e3a1" if result.ok else "#f9e2af"
                self.log_line.emit(
                    f'<span style="color:{colour};">{result.verdict} — '
                    f'{html.escape(result.verdict_detail)}.</span>'
                )
                self.log_line.emit(
                    f'<span style="color:{colour};">{html.escape(result.next_step)}</span>'
                )
            except lmstudio.LMStudioError as exc:
                # A failed polish must never lose the skeleton, which is the
                # part that took the document to get. Fall back to the paste route.
                first_line = str(exc).split("\n", 1)[0]
                self.log_line.emit(
                    f'<span style="color:#f9e2af;">Polish skipped: {first_line}</span>'
                )
                self.log_line.emit(
                    '<span style="color:#f9e2af;">The skeleton was still written — '
                    'paste narrative-prompt.txt into LM Studio by hand.</span>'
                )

            self.log_line.emit(
                f'<span style="color:#a6e3a1;">Done. Files written to:</span>'
            )
            self.log_line.emit(
                f'<span style="color:#a6e3a1;">{out_dir}</span>'
            )

            self.success.emit({
                "out_dir": str(out_dir),
                "skeleton": skeleton,
                "prompt": prompt,
                "formdata": formdata,
                "polished": polished,
                "report": report,
            })

        except Exception as exc:
            self.log_line.emit(
                f'<span style="color:#ff6b6b;">ERROR: {exc}</span>'
            )


# ─────────────────────────────────────────────────────────────────────────────
# Section 3 — Drop zone widget
# ─────────────────────────────────────────────────────────────────────────────

class _DropZone(QLabel):
    """A QLabel accepting drag-and-dropped summaries (.docx or legacy .pdf).

    Emits ``file_dropped(str)``.
    """

    file_dropped = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAcceptDrops(True)
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.setText("Drag && drop the Collator summary here (.docx)\nor click Browse")
        self.setMinimumHeight(70)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._apply_default_style()

    def _apply_default_style(self):
        self.setStyleSheet(
            f"QLabel {{"
            f"  background: #2e2e4a;"
            f"  color: {ACCENT};"
            f"  border: 2px dashed #4a4a7e;"
            f"  border-radius: 8px;"
            f"  font-size: 12px;"
            f"  padding: 12px;"
            f"}}"
        )

    def _apply_hover_style(self):
        self.setStyleSheet(
            f"QLabel {{"
            f"  background: #3a3a5e;"
            f"  color: {ACCENT};"
            f"  border: 2px dashed {ACCENT};"
            f"  border-radius: 8px;"
            f"  font-size: 12px;"
            f"  padding: 12px;"
            f"}}"
        )

    def dragEnterEvent(self, event: QDragEnterEvent):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()
            self._apply_hover_style()
        else:
            event.ignore()

    def dragLeaveEvent(self, event):
        self._apply_default_style()

    def dropEvent(self, event: QDropEvent):
        self._apply_default_style()
        urls = event.mimeData().urls()
        if urls:
            path = urls[0].toLocalFile()
            # .docx since Collator v1.13; every earlier matter holds a PDF.
            if path.lower().endswith((".docx", ".pdf")):
                self.file_dropped.emit(path)


# ─────────────────────────────────────────────────────────────────────────────
# Section 4 — NarrateCard widget
# ─────────────────────────────────────────────────────────────────────────────

class NarrateCard(QFrame):
    """
    Self-contained PyQt6 card widget for the Uplift Narrator.

    Layout
    ------
    ┌──────────────────────────────────────────────────┐
    │  UPLIFT NARRATOR                                  │
    │  ┌────────────────────────────────────────────┐    │
    │  │  Drag & drop the summary here             │    │
    │  └────────────────────────────────────────────┘    │
    │  [ Browse… ]                                      │
    │  case.docx                                        │
    │  Output: case-narrative/                          │
    │  [           Generate Narrative           ]       │
    │  ┌────────────────────────────────────────────┐    │
    │  │ log output                                │    │
    │  └────────────────────────────────────────────┘    │
    │  ╭ Narrative ╮ ╭ LM Studio Prompt ╮              │
    │  │ scrollable text area …          │              │
    │  ╰─────────────────────────────────╯              │
    │  [📋 Copy]   [📂 Open Folder]                    │
    └──────────────────────────────────────────────────┘
    """

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setStyleSheet(
            f"QFrame {{ background: {BG_CARD}; border-radius: 8px; "
            f"border: 1px solid {BG_BUTTON}; }}"
        )

        # State
        self._input_path: str | None = None
        self._out_dir: str | None = None
        self._worker: NarrateWorker | None = None

        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 8, 10, 10)
        layout.setSpacing(8)

        # ── Heading ──────────────────────────────────────────────────────
        heading = QLabel("UPLIFT NARRATOR")
        heading.setStyleSheet(
            f"color: {TEXT_DIM}; font-size: 11px; font-weight: bold; "
            f"letter-spacing: 1px; border: none; background: transparent;"
        )
        layout.addWidget(heading)

        # ── Drop zone ────────────────────────────────────────────────────
        self._drop_zone = _DropZone()
        self._drop_zone.file_dropped.connect(self._load_pdf)
        layout.addWidget(self._drop_zone)

        # ── Browse button ────────────────────────────────────────────────
        browse_btn = QPushButton("Browse…")
        browse_btn.setFixedHeight(28)
        browse_btn.setStyleSheet(
            f"QPushButton {{ background: {BG_BUTTON}; color: {TEXT_MAIN}; "
            f"  border: none; border-radius: 4px; padding: 0 10px; font-size: 12px; }}"
            f"QPushButton:hover {{ background: {BG_HOVER}; }}"
        )
        browse_btn.clicked.connect(self._browse_file)
        layout.addWidget(browse_btn)

        # ── File info / output preview ───────────────────────────────────
        self._file_info = QLabel("No file selected.")
        self._file_info.setStyleSheet(
            f"color: {TEXT_DIM}; font-size: 11px; border: none; "
            f"background: transparent;"
        )
        self._file_info.setWordWrap(True)
        layout.addWidget(self._file_info)

        self._preview_label = QLabel("—")
        self._preview_label.setStyleSheet(
            f"color: {TEXT_DIM}; font-size: 11px; border: none; "
            f"background: transparent;"
        )
        self._preview_label.setWordWrap(True)
        layout.addWidget(self._preview_label)

        # ── Generate button (blue accent) ────────────────────────────────
        # ── Model row ────────────────────────────────────────────────────
        model_row = QHBoxLayout()
        model_row.setSpacing(8)

        model_label = QLabel("Model:")
        model_label.setStyleSheet(f"color: {TEXT_DIM}; font-size: 12px;")
        model_row.addWidget(model_label)

        self._model_combo = QComboBox()
        self._model_combo.setFixedHeight(28)
        self._model_combo.setStyleSheet(
            f"QComboBox {{ background: {BG_BUTTON}; color: {TEXT_MAIN}; "
            f"  border: 1px solid #3a3a5e; border-radius: 4px; "
            f"  padding: 0 8px; font-size: 12px; }}"
            f"QComboBox QAbstractItemView {{ background: {BG_CARD}; "
            f"  color: {TEXT_MAIN}; selection-background-color: {BG_HOVER}; }}"
        )
        self._model_combo.setSizePolicy(QSizePolicy.Policy.Expanding,
                                        QSizePolicy.Policy.Fixed)
        model_row.addWidget(self._model_combo, 1)

        self._refresh_models_btn = QPushButton("↻")
        self._refresh_models_btn.setFixedSize(28, 28)
        self._refresh_models_btn.setToolTip("Re-read the model list from LM Studio")
        self._refresh_models_btn.setStyleSheet(
            f"QPushButton {{ background: {BG_BUTTON}; color: {TEXT_MAIN}; "
            f"  border: none; border-radius: 4px; font-size: 14px; }}"
            f"QPushButton:hover {{ background: {BG_HOVER}; }}"
        )
        self._refresh_models_btn.clicked.connect(self._refresh_models)
        model_row.addWidget(self._refresh_models_btn)

        layout.addLayout(model_row)

        self._generate_btn = QPushButton("Generate Narrative")
        self._generate_btn.setFixedHeight(34)
        self._generate_btn.setStyleSheet(
            f"QPushButton {{ background: {ACCENT}; color: #1e1e2e; "
            f"  border: none; border-radius: 4px; font-size: 13px; font-weight: bold; }}"
            f"QPushButton:hover {{ background: #a0c4ff; }}"
            f"QPushButton:disabled {{ background: #252540; color: {TEXT_DIM}; }}"
        )
        self._generate_btn.clicked.connect(self._start_generate)
        layout.addWidget(self._generate_btn)

        # ── Log area ─────────────────────────────────────────────────────
        self._log = QTextEdit()
        self._log.setReadOnly(True)
        self._log.setMinimumHeight(90)
        # Roomy enough that the whole "nothing was extracted" explanation is
        # readable without scrolling — that message is the one that matters
        # most and the one you are least expecting.
        self._log.setMaximumHeight(190)
        self._log.setFont(_font(MONO_FAMILIES, 10))
        self._log.setStyleSheet(self._textarea_style())
        layout.addWidget(self._log)

        # ── Output tabs (Narrative / Prompt) ─────────────────────────────
        self._tabs = QTabWidget()
        self._tabs.setStyleSheet(
            f"QTabWidget::pane {{ border: 1px solid {BG_BUTTON}; "
            f"  background: {BG_OUTER}; border-radius: 4px; }}"
            f"QTabBar::tab {{ background: {BG_CARD}; color: {TEXT_DIM}; "
            f"  padding: 6px 12px; margin-right: 2px; border: 1px solid {BG_BUTTON}; "
            f"  border-bottom: none; border-top-left-radius: 4px; "
            f"  border-top-right-radius: 4px; font-size: 11px; }}"
            f"QTabBar::tab:selected {{ background: {BG_OUTER}; color: {TEXT_MAIN}; }}"
            f"QTabBar::tab:hover:!selected {{ background: {BG_BUTTON}; }}"
        )

        # QPlainTextEdit (not QTextEdit) for the output panes — guarantees that
        # Ctrl+C selections and toPlainText() produce \n line endings, never
        # the Unicode paragraph separator (U+2029) that QTextEdit can emit.
        #
        # The finished narrative is prose meant to be read, so it gets a
        # proportional font at a comfortable size. The other two are structured
        # output where alignment carries meaning, so they stay monospaced.
        self._polished_view = QPlainTextEdit()
        self._polished_view.setReadOnly(True)
        self._polished_view.setFont(_font(PROSE_FAMILIES, 11))
        self._polished_view.setStyleSheet(self._textarea_style())
        self._polished_view.setPlaceholderText(
            "The finished narrative will appear here once LM Studio has polished it."
        )
        self._tabs.addTab(self._polished_view, "Polished Narrative")

        self._check_view = QPlainTextEdit()
        self._check_view.setReadOnly(True)
        self._check_view.setFont(_font(MONO_FAMILIES, 10))
        self._check_view.setStyleSheet(self._textarea_style())
        self._check_view.setPlaceholderText(
            "Citation and placeholder check will appear here."
        )
        self._tabs.addTab(self._check_view, "Citation Check")

        self._narrative_view = QPlainTextEdit()
        self._narrative_view.setReadOnly(True)
        self._narrative_view.setFont(_font(MONO_FAMILIES, 10))
        self._narrative_view.setStyleSheet(self._textarea_style())
        self._narrative_view.setPlaceholderText("Generated skeleton will appear here.")
        self._tabs.addTab(self._narrative_view, "Narrative (skeleton)")

        for index, tip in enumerate(TAB_CAPTIONS):
            self._tabs.setTabToolTip(index, tip)

        # Default to the finished narrative — the thing you actually want.
        self._tabs.setCurrentIndex(0)
        self._tabs.setMinimumHeight(260)
        self._tabs.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        layout.addWidget(self._tabs)

        # One line saying what the tab in front of you is for. Without it the
        # three tabs look like three versions of the same thing, and it is not
        # obvious which one is the document you actually send.
        self._tab_caption = QLabel()
        self._tab_caption.setWordWrap(True)
        self._tab_caption.setStyleSheet(
            f"color: {TEXT_DIM}; font-size: 11px; padding: 2px 2px 0 2px;"
        )
        layout.addWidget(self._tab_caption)
        self._tabs.currentChanged.connect(self._update_tab_caption)
        self._update_tab_caption(0)

        # ── Action row: Copy + Open Folder ───────────────────────────────
        action_row = QHBoxLayout()
        action_row.setSpacing(8)

        self._copy_btn = QPushButton("\U0001f4cb  Copy to Clipboard")
        self._copy_btn.setFixedHeight(28)
        self._copy_btn.setStyleSheet(
            f"QPushButton {{ background: {BG_BUTTON}; color: {TEXT_MAIN}; "
            f"  border: none; border-radius: 4px; padding: 0 12px; font-size: 12px; }}"
            f"QPushButton:hover {{ background: {BG_HOVER}; }}"
            f"QPushButton:disabled {{ background: #252540; color: {TEXT_DIM}; }}"
        )
        self._copy_btn.clicked.connect(self._copy_active_tab)
        self._copy_btn.setEnabled(False)
        action_row.addWidget(self._copy_btn)

        self._open_folder_btn = QPushButton("\U0001f4c2  Open Output Folder")
        self._open_folder_btn.setFixedHeight(28)
        self._open_folder_btn.setStyleSheet(
            f"QPushButton {{ background: {BG_BUTTON}; color: {TEXT_MAIN}; "
            f"  border: none; border-radius: 4px; padding: 0 12px; font-size: 12px; }}"
            f"QPushButton:hover {{ background: {BG_HOVER}; }}"
            f"QPushButton:disabled {{ background: #252540; color: {TEXT_DIM}; }}"
        )
        self._open_folder_btn.clicked.connect(self._open_output_folder)
        self._open_folder_btn.setEnabled(False)
        action_row.addWidget(self._open_folder_btn)

        secondary_style = (
            f"QPushButton {{ background: transparent; color: {TEXT_DIM}; "
            f"  border: 1px solid {BG_BUTTON}; border-radius: 4px; "
            f"  padding: 0 10px; font-size: 11px; }}"
            f"QPushButton:hover {{ background: {BG_BUTTON}; color: {TEXT_MAIN}; }}"
        )

        self._edit_prompts_btn = QPushButton("Edit Prompts")
        self._edit_prompts_btn.setFixedHeight(28)
        self._edit_prompts_btn.setToolTip(
            "Open the system prompt and user template in an editor. "
            "Saved edits apply to every future case."
        )
        self._edit_prompts_btn.setStyleSheet(secondary_style)
        self._edit_prompts_btn.clicked.connect(self._edit_prompts)
        action_row.addWidget(self._edit_prompts_btn)

        self._restore_prompts_btn = QPushButton("Restore Defaults")
        self._restore_prompts_btn.setFixedHeight(28)
        self._restore_prompts_btn.setToolTip("Discard your prompt edits and go back to the shipped prompts")
        self._restore_prompts_btn.setStyleSheet(secondary_style)
        self._restore_prompts_btn.clicked.connect(self._restore_prompts)
        action_row.addWidget(self._restore_prompts_btn)

        action_row.addStretch()

        # Which prompt is in force — so a customised prompt is never a surprise.
        self._prompt_status = QLabel()
        self._prompt_status.setStyleSheet(f"color: {TEXT_DIM}; font-size: 11px;")
        action_row.addWidget(self._prompt_status)

        layout.addLayout(action_row)

        self._refresh_prompt_status()
        self._refresh_models()

    # ── Style helper ─────────────────────────────────────────────────────

    def _update_tab_caption(self, index: int) -> None:
        self._tab_caption.setText(
            TAB_CAPTIONS[index] if 0 <= index < len(TAB_CAPTIONS) else ""
        )

    def _textarea_style(self) -> str:
        # Both classes must be named. QPlainTextEdit is a *sibling* of
        # QTextEdit, not a subclass, so a "QTextEdit { … }" rule silently
        # misses it — which left the three output panes on Qt's default
        # palette: dark text on a dark background, and unreadable.
        return (
            "QTextEdit, QPlainTextEdit { "
            "  background: #16162a; "
            f"  color: {TEXT_MAIN}; "
            "  border: 1px solid #3a3a5e; "
            "  border-radius: 4px; "
            "  padding: 8px; "
            "  selection-background-color: #45475a; "
            f"  selection-color: {TEXT_MAIN}; "
            "}"
            "QScrollBar:vertical { background: #1a1a2a; width: 8px; }"
            "QScrollBar::handle:vertical { background: #3a3a5e; border-radius: 4px; }"
            "QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0; }"
        )

    # ── File loading slots ───────────────────────────────────────────────

    def _browse_file(self):
        chosen, _ = QFileDialog.getOpenFileName(
            self,
            "Select an Uplift Collator PDF",
            os.path.expanduser("~"),
            "Collator summaries (*.docx *.pdf);;All files (*.*)",
        )
        if chosen:
            self._load_pdf(chosen)

    def load_pdf(self, path: str) -> None:
        """Public alias used by the launcher when a path is passed on argv.

        The name is kept for launcher compatibility; it loads either format.
        """
        self._load_pdf(path)

    def _load_pdf(self, path: str):
        # .docx since Collator v1.13; every earlier matter holds a PDF. The
        # drop zone and the Browse filter accept the same pair — all three
        # gates were updated together on 7 August 2026 after a review agent
        # found the first pass had widened two of them and left this one
        # rejecting every .docx with "Please select a PDF file".
        if not path.lower().endswith((".docx", ".pdf")):
            self._append_log(
                '<span style="color:#fab387;">Please select a Collator summary '
                '(.docx, or .pdf for older matters).</span>'
            )
            return
        if not os.path.isfile(path):
            self._append_log(
                '<span style="color:#ff6b6b;">File not found.</span>'
            )
            return

        self._input_path = path
        filename = os.path.basename(path)

        self._file_info.setText(filename)
        self._file_info.setStyleSheet(
            f"color: {TEXT_MAIN}; font-size: 11px; border: none; "
            f"background: transparent;"
        )
        self._drop_zone.setText(f"✓  {filename}")

        # Default output dir mirrors narrate.py CLI: <pdf-stem>-narrative/
        self._out_dir = str(Path(path).parent / f"{Path(path).stem}-narrative")
        self._preview_label.setText(f"Output: {self._out_dir}")
        self._preview_label.setStyleSheet(
            f"color: {ACCENT}; font-size: 11px; border: none; "
            f"background: transparent;"
        )

    # ── Generate slots ───────────────────────────────────────────────────

    def _start_generate(self):
        if self._worker is not None and self._worker.isRunning():
            return
        if not self._input_path:
            self._append_log(
                '<span style="color:#fab387;">No PDF loaded. '
                'Drop a file or click Browse.</span>'
            )
            return

        # Ask before evicting a model another application may be using. Done
        # here, on the UI thread, because a QThread cannot raise a dialog.
        consented = self._confirm_model_swap()
        if consented is None:
            return

        self._log.clear()
        self._narrative_view.clear()
        self._polished_view.clear()
        self._check_view.clear()
        self._copy_btn.setEnabled(False)
        self._open_folder_btn.setEnabled(False)
        self._generate_btn.setEnabled(False)

        self._worker = NarrateWorker(
            self._input_path, self._out_dir, self._selected_model(),
            consented, parent=self,
        )
        self._worker.log_line.connect(self._append_log)
        self._worker.success.connect(self._on_success)
        self._worker.finished.connect(self._on_finished)
        # Without this, every completed worker stays alive as a child of the
        # card and they accumulate for the life of the window.
        self._worker.finished.connect(self._worker.deleteLater)
        self._worker.start()

    def _append_log(self, html_line: str):
        self._log.insertHtml(html_line + "<br>")
        self._log.verticalScrollBar().setValue(
            self._log.verticalScrollBar().maximum()
        )

    def _on_success(self, payload: dict):
        self._narrative_view.setPlainText(payload["skeleton"])
        self._polished_view.setPlainText(payload.get("polished", ""))
        self._check_view.setPlainText(payload.get("report", ""))
        self._copy_btn.setEnabled(True)
        self._open_folder_btn.setEnabled(True)

        # Land on whatever is actually useful: the finished narrative if the
        # polish succeeded, otherwise the skeleton to work from by hand.
        self._tabs.setCurrentIndex(0 if payload.get("polished") else 2)

    def _confirm_model_swap(self):
        """Return the model ids the user consented to unload, or None if cancelled.

        An empty list means "nothing needs unloading" — the normal case. The
        ids are carried into the worker rather than a bare yes/no, so a model
        that appears between this dialog and the actual unload cannot be
        evicted on this consent.

        Auto never swaps — the pipeline stays on whatever is loaded — so this
        only ever fires on an explicit pick that differs from the loaded model.
        """
        model = self._selected_model()
        if not model:
            return []

        try:
            host = lmstudio.resolve_host()
            evicted = lmstudio.swap_needed(host, model)
        except lmstudio.LMStudioError:
            return []  # unreachable: let the worker report it properly

        if not evicted:
            return []

        detail = ""
        for other in evicted:
            context = lmstudio.loaded_context(host, other)
            if context:
                detail += f"\n  • {other} (loaded at {context:,} context)"
            else:
                detail += f"\n  • {other}"

        answer = QMessageBox.question(
            self, "Unload the model in use?",
            f"Loading {model} will first unload:{detail}\n\n"
            "Another application may be using it — LeapForward, for example — "
            "and unloading will interrupt whatever it is doing.\n\n"
            "Unload it anyway?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.Cancel,
            QMessageBox.StandardButton.Cancel,
        )
        if answer != QMessageBox.StandardButton.Yes:
            self._append_log(
                '<span style="color:#f9e2af;">Cancelled — nothing was unloaded. '
                'Choose Auto to use the model that is already loaded.</span>'
            )
            return None
        return evicted

    # ── Model list ───────────────────────────────────────────────────────

    def _selected_model(self) -> str:
        """The chosen model id, or "" to let the pipeline decide."""
        if self._model_combo.currentIndex() <= 0:
            return ""
        return self._model_combo.currentText().split("  ", 1)[0].strip()

    def _refresh_models(self):
        """Populate the model picker from LM Studio, tolerating it being off."""
        self._model_combo.clear()
        self._model_combo.addItem("Auto (use whatever is loaded)")
        try:
            host = lmstudio.resolve_host()
            downloaded, loaded = lmstudio.model_catalog(host)
        except lmstudio.LMStudioError as exc:
            self._model_combo.addItem("— LM Studio not reachable —")
            self._append_log(
                f'<span style="color:#f9e2af;">{str(exc).split(chr(10))[0]}</span>'
            )
            return

        for model in downloaded:
            # Marking what is already in VRAM makes the cost of a swap visible.
            self._model_combo.addItem(f"{model}  {'· loaded' if model in loaded else ''}".rstrip())

    # ── Prompt editing ───────────────────────────────────────────────────

    def _refresh_prompt_status(self):
        customised = prompts_mod.is_customised()
        self._prompt_status.setText(
            "Prompts: customised" if customised else "Prompts: default"
        )
        self._prompt_status.setStyleSheet(
            f"color: {'#f9e2af' if customised else TEXT_DIM}; font-size: 11px;"
        )
        self._restore_prompts_btn.setEnabled(customised)

    def _editor_command(self) -> list[str] | None:
        """Notepad++ if present (it can show both files as tabs), else Notepad."""
        for candidate in (
            "/mnt/c/Program Files/Notepad++/notepad++.exe",
            "/mnt/c/Program Files (x86)/Notepad++/notepad++.exe",
            r"C:\Program Files\Notepad++\notepad++.exe",
        ):
            if os.path.isfile(candidate):
                return [candidate]
        for name in ("notepad++.exe", "notepad.exe", "notepad"):
            found = shutil.which(name)
            if found:
                return [found]
        return None

    def _edit_prompts(self):
        paths = prompts_mod.enable_customisation()
        editor = self._editor_command()
        if editor is None:
            QMessageBox.information(
                self, "Edit prompts",
                "No editor was found. Your editable copies are here:\n\n"
                + "\n".join(str(p) for p in paths),
            )
        else:
            try:
                subprocess.Popen([*editor, *[str(p) for p in paths]])
            except OSError as exc:
                QMessageBox.warning(self, "Edit prompts", f"Could not open the editor:\n{exc}")

        self._refresh_prompt_status()
        self._append_log(
            '<span style="color:#88aaff;">Editing your own copy of the prompts. '
            'Saved changes apply to every future case until you restore defaults.</span>'
        )

    def _restore_prompts(self):
        if not prompts_mod.is_customised():
            return
        confirm = QMessageBox.question(
            self, "Restore default prompts",
            "Discard your prompt edits and go back to the shipped prompts?\n\n"
            "This cannot be undone from here.",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No,
        )
        if confirm != QMessageBox.StandardButton.Yes:
            return
        removed = prompts_mod.restore_defaults()
        self._refresh_prompt_status()
        self._append_log(
            f'<span style="color:#a6e3a1;">Restored defaults ({", ".join(removed)}).</span>'
        )

    def shutdown(self) -> None:
        """Stop a running worker before the window is destroyed.

        Destroying a live QThread takes the process down with it, so the window
        asks the card to wind down first. Qt's own wording for this is blunt:
        "QThread: Destroyed while thread is still running".
        """
        worker = self._worker
        if worker is not None and worker.isRunning():
            worker.requestInterruption()
            worker.quit()
            worker.wait(5000)

    def _on_finished(self):
        self._generate_btn.setEnabled(True)

    # ── Action slots ─────────────────────────────────────────────────────

    def _copy_active_tab(self):
        view = self._tabs.currentWidget()
        if not hasattr(view, "toPlainText"):
            return
        # toPlainText() on QPlainTextEdit returns \n-separated text — no
        # paragraph separators, no smart quotes, no surprises for LM Studio.
        text = view.toPlainText()
        if not text:
            return
        QApplication.clipboard().setText(text)
        tab_label = self._tabs.tabText(self._tabs.currentIndex())
        self._append_log(
            f'<span style="color:#a6e3a1;">Copied "{tab_label}" to clipboard '
            f'({len(text):,} chars).</span>'
        )

    def _open_output_folder(self):
        if not self._out_dir or not os.path.isdir(self._out_dir):
            self._append_log(
                '<span style="color:#fab387;">Output folder not found.</span>'
            )
            return
        # Open in the OS file manager. On Windows: explorer; on WSL: try wslview/explorer.exe.
        if sys.platform.startswith("win"):
            os.startfile(self._out_dir)  # type: ignore[attr-defined]
        else:
            # Best-effort on WSL: explorer.exe handles Windows paths
            try:
                win_path = self._out_dir.replace("/mnt/c/", "C:\\").replace("/", "\\")
                os.system(f'explorer.exe "{win_path}"')
            except Exception as exc:
                self._append_log(
                    f'<span style="color:#fab387;">Could not open folder: {exc}</span>'
                )


# ─────────────────────────────────────────────────────────────────────────────
# Section 5 — NarrateWindow
# ─────────────────────────────────────────────────────────────────────────────

class NarrateWindow(QMainWindow):
    """
    Standalone floating window that hosts a NarrateCard.

    Always-on-top so it acts as a floating tool panel, mirroring the other
    myToolbox tools.
    """

    def __init__(self, parent=None, initial_pdf: str | None = None):
        super().__init__(parent)
        self.setWindowTitle("Uplift Narrator")
        self.setMinimumWidth(480)
        self.setMinimumHeight(720)
        self.setWindowFlags(
            Qt.WindowType.Window | Qt.WindowType.WindowStaysOnTopHint
        )
        self.setStyleSheet(f"QMainWindow {{ background: {BG_OUTER}; }}")

        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setContentsMargins(8, 8, 8, 8)
        self._card = NarrateCard()
        layout.addWidget(self._card)

        if initial_pdf:
            self._card.load_pdf(initial_pdf)

    def closeEvent(self, event):
        """Wind down a running generation before the window goes away.

        A polish run can take minutes, so closing mid-run is a realistic thing
        to do. Without this the live QThread is destroyed with the window and
        takes the process down with it.
        """
        self._card.shutdown()
        super().closeEvent(event)


# ─────────────────────────────────────────────────────────────────────────────
# Section 6 — NarrateManager (for myToolbox integration)
# ─────────────────────────────────────────────────────────────────────────────

class NarrateManager(QObject):
    """
    Owns the NarrateWindow lifecycle. Identical pattern to
    PdfExtractorManager / SuffixFixerManager / etc. in myToolbox so the tool
    can drop into myToolbox.py with minimal changes.

    Usage::

        mgr = NarrateManager()
        mgr.open_window()
    """

    def __init__(self, parent=None):
        super().__init__(parent)
        self._window: NarrateWindow | None = None

    def open_window(self):
        if self._window is not None and self._window.isVisible():
            self._window.raise_()
            self._window.activateWindow()
        else:
            self._window = NarrateWindow()
            self._window.show()


# ─────────────────────────────────────────────────────────────────────────────
# Section 7 — Standalone entry point
# ─────────────────────────────────────────────────────────────────────────────

def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv if argv is None else argv)

    # Optional first positional arg: pre-load this summary into the GUI.
    initial_pdf = None
    if len(argv) > 1 and argv[1] and not argv[1].startswith("-"):
        candidate = argv[1]
        if os.path.isfile(candidate) and candidate.lower().endswith((".docx", ".pdf")):
            initial_pdf = candidate

    app = QApplication(argv)
    window = NarrateWindow(initial_pdf=initial_pdf)
    window.show()
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
