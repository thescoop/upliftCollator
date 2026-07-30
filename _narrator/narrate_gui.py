"""
narrate_gui.py
==============
PyQt6 GUI front-end for the LAA Uplift Narrator.

Drop a Collator-generated PDF on the window (or click Browse) and click
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

Run standalone via ``python narrate_gui.py [path/to/case.pdf]`` — the optional
PDF path pre-loads the file so you only need to click Generate.
"""

# ── Standard library imports ────────────────────────────────────────────────
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
import checks
import lmstudio
import polish as polish_mod
import prompts as prompts_mod
from extract import extract_formdata
from prompts import assemble_prompt
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


# ─────────────────────────────────────────────────────────────────────────────
# Section 2 — NarrateWorker (background thread)
# ─────────────────────────────────────────────────────────────────────────────

class NarrateWorker(QThread):
    """
    Background worker that runs the full narrate pipeline on a PDF.

    Why a QThread? PDF extraction and template parsing usually finish in well
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

    def __init__(self, pdf_path: str, out_dir: str, model_hint: str = "",
                 allow_swap: bool = False, parent=None):
        super().__init__(parent)
        self._pdf_path = pdf_path
        self._out_dir = out_dir
        self._model_hint = model_hint
        # Confirmed on the UI thread before the worker starts — a background
        # thread must never raise a dialog.
        self._allow_swap = allow_swap

    def run(self):
        try:
            self.log_line.emit(
                f'<span style="color:#88aaff;">Reading {os.path.basename(self._pdf_path)}…</span>'
            )
            formdata = extract_formdata(self._pdf_path)

            n_panel = len(formdata.get("panelMembership", {}))
            n_s1 = len(formdata.get("stage1", {}))
            n_s2 = len(formdata.get("stage2", {}))
            uplift = formdata.get("finalUpliftPercent", "?")
            self.log_line.emit(
                f'<span style="color:#88aaff;">Extracted: {n_panel} panel · '
                f'{n_s1} Stage 1 · {n_s2} Stage 2 · {uplift}% uplift</span>'
            )

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
            prompt = assemble_prompt(skeleton, case_meta)

            # ── Write files to disk ──────────────────────────────────────
            out_dir = Path(self._out_dir)
            out_dir.mkdir(parents=True, exist_ok=True)

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
                    allow_swap=self._allow_swap,
                    on_status=lambda msg: self.log_line.emit(
                        f'<span style="color:#88aaff;">{msg}</span>'
                    ),
                )
                polished = result.polished
                report = checks.format_report(result.check)
                if result.llm_verification:
                    report += ("\n\n---\n\n## LLM second opinion\n\n"
                               + result.llm_verification + "\n")
                elif result.verification_error:
                    report += ("\n\n---\n\n## LLM second opinion\n\n"
                               f"Did not run: {result.verification_error}\n")

                (out_dir / "narrative-polished.md").write_text(
                    polished + "\n", encoding="utf-8")
                (out_dir / "citation-check.txt").write_text(report, encoding="utf-8")

                colour = "#a6e3a1" if result.check.ok else "#f9e2af"
                self.log_line.emit(
                    f'<span style="color:{colour};">{result.check.verdict} — '
                    f'{len(result.check.skeleton_citations)} citations, '
                    f'{len(result.check.dropped_citations)} dropped, '
                    f'{len(result.check.placeholders)} placeholders left.</span>'
                )
            except lmstudio.LMStudioError as exc:
                # A failed polish must never lose the skeleton, which is the
                # part that took the PDF to get. Fall back to the paste route.
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
    """A QLabel that accepts drag-and-dropped PDF files. Emits ``file_dropped(str)``."""

    file_dropped = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAcceptDrops(True)
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.setText("Drag && drop a PDF here\nor click Browse")
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
            if path.lower().endswith(".pdf"):
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
    │  │  Drag & drop a PDF here                   │    │
    │  └────────────────────────────────────────────┘    │
    │  [ Browse… ]                                      │
    │  case.pdf                                         │
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
        self._pdf_path: str | None = None
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
        self._log.setMinimumHeight(80)
        self._log.setMaximumHeight(140)
        self._log.setFont(QFont("Consolas", 9))
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
        self._polished_view = QPlainTextEdit()
        self._polished_view.setReadOnly(True)
        self._polished_view.setFont(QFont("Consolas", 9))
        self._polished_view.setStyleSheet(self._textarea_style())
        self._polished_view.setPlaceholderText(
            "The finished narrative will appear here once LM Studio has polished it."
        )
        self._tabs.addTab(self._polished_view, "Polished Narrative")

        self._check_view = QPlainTextEdit()
        self._check_view.setReadOnly(True)
        self._check_view.setFont(QFont("Consolas", 9))
        self._check_view.setStyleSheet(self._textarea_style())
        self._check_view.setPlaceholderText(
            "Citation and placeholder check will appear here."
        )
        self._tabs.addTab(self._check_view, "Citation Check")

        self._narrative_view = QPlainTextEdit()
        self._narrative_view.setReadOnly(True)
        self._narrative_view.setFont(QFont("Consolas", 9))
        self._narrative_view.setStyleSheet(self._textarea_style())
        self._narrative_view.setPlaceholderText("Generated skeleton will appear here.")
        self._tabs.addTab(self._narrative_view, "Narrative (skeleton)")

        # Default to the finished narrative — the thing you actually want.
        self._tabs.setCurrentIndex(0)
        self._tabs.setMinimumHeight(260)
        self._tabs.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        layout.addWidget(self._tabs)

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

    def _textarea_style(self) -> str:
        return (
            "QTextEdit { "
            "  background: #1a1a2a; "
            f"  color: {TEXT_MAIN}; "
            "  border: 1px solid #3a3a5e; "
            "  border-radius: 4px; "
            "  padding: 4px; "
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
            "PDF files (*.pdf);;All files (*.*)",
        )
        if chosen:
            self._load_pdf(chosen)

    def load_pdf(self, path: str) -> None:
        """Public alias used by the launcher when a path is passed on argv."""
        self._load_pdf(path)

    def _load_pdf(self, path: str):
        if not path.lower().endswith(".pdf"):
            self._append_log(
                '<span style="color:#fab387;">Please select a PDF file (.pdf).</span>'
            )
            return
        if not os.path.isfile(path):
            self._append_log(
                '<span style="color:#ff6b6b;">File not found.</span>'
            )
            return

        self._pdf_path = path
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
        if not self._pdf_path:
            self._append_log(
                '<span style="color:#fab387;">No PDF loaded. '
                'Drop a file or click Browse.</span>'
            )
            return

        # Ask before evicting a model another application may be using. Done
        # here, on the UI thread, because a QThread cannot raise a dialog.
        allow_swap = self._confirm_model_swap()
        if allow_swap is None:
            return

        self._log.clear()
        self._narrative_view.clear()
        self._polished_view.clear()
        self._check_view.clear()
        self._copy_btn.setEnabled(False)
        self._open_folder_btn.setEnabled(False)
        self._generate_btn.setEnabled(False)

        self._worker = NarrateWorker(
            self._pdf_path, self._out_dir, self._selected_model(),
            allow_swap, parent=self,
        )
        self._worker.log_line.connect(self._append_log)
        self._worker.success.connect(self._on_success)
        self._worker.finished.connect(self._on_finished)
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
        """Return True/False to proceed, or None if the user cancelled.

        Auto never swaps — the pipeline stays on whatever is loaded — so this
        only ever fires on an explicit pick that differs from the loaded model.
        """
        model = self._selected_model()
        if not model:
            return False

        try:
            host = lmstudio.resolve_host()
            evicted = lmstudio.swap_needed(host, model)
        except lmstudio.LMStudioError:
            return False  # unreachable: let the worker report it properly

        if not evicted:
            return False

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
        return True

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

    # Optional first positional arg: pre-load this PDF into the GUI.
    initial_pdf = None
    if len(argv) > 1 and argv[1] and not argv[1].startswith("-"):
        candidate = argv[1]
        if os.path.isfile(candidate) and candidate.lower().endswith(".pdf"):
            initial_pdf = candidate

    app = QApplication(argv)
    window = NarrateWindow(initial_pdf=initial_pdf)
    window.show()
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
