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
import sys
from pathlib import Path

# ── PyQt6 imports ───────────────────────────────────────────────────────────
from PyQt6.QtWidgets import (
    QApplication, QFrame, QMainWindow, QWidget,
    QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QTextEdit, QPlainTextEdit, QTabWidget,
    QFileDialog, QSizePolicy,
)
from PyQt6.QtCore import Qt, QObject, QThread, pyqtSignal
from PyQt6.QtGui import QFont, QDragEnterEvent, QDropEvent

# ── Sibling modules from this folder ────────────────────────────────────────
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
                                  "prompt": str, "formdata": dict}
    finished()                 — auto-emitted by QThread when run() returns
    """

    log_line = pyqtSignal(str)
    success = pyqtSignal(dict)

    def __init__(self, pdf_path: str, out_dir: str, parent=None):
        super().__init__(parent)
        self._pdf_path = pdf_path
        self._out_dir = out_dir

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
        self._narrative_view = QPlainTextEdit()
        self._narrative_view.setReadOnly(True)
        self._narrative_view.setFont(QFont("Consolas", 9))
        self._narrative_view.setStyleSheet(self._textarea_style())
        self._narrative_view.setPlaceholderText("Generated narrative will appear here.")
        self._tabs.addTab(self._narrative_view, "Narrative (skeleton)")

        self._prompt_view = QPlainTextEdit()
        self._prompt_view.setReadOnly(True)
        self._prompt_view.setFont(QFont("Consolas", 9))
        self._prompt_view.setStyleSheet(self._textarea_style())
        self._prompt_view.setPlaceholderText("Paste-ready LM Studio prompt will appear here.")
        self._tabs.addTab(self._prompt_view, "LM Studio Prompt")

        # Default to the Prompt tab — the primary use case.
        self._tabs.setCurrentIndex(1)
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

        action_row.addStretch()
        layout.addLayout(action_row)

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

        self._log.clear()
        self._narrative_view.clear()
        self._prompt_view.clear()
        self._copy_btn.setEnabled(False)
        self._open_folder_btn.setEnabled(False)
        self._generate_btn.setEnabled(False)

        self._worker = NarrateWorker(self._pdf_path, self._out_dir, parent=self)
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
        self._prompt_view.setPlainText(payload["prompt"])
        self._copy_btn.setEnabled(True)
        self._open_folder_btn.setEnabled(True)

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
