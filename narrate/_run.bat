@echo off
REM _run.bat - Launch the Uplift Narrator GUI
REM Usage: double-click, or _run.bat path\to\case.pdf to pre-load a PDF
REM (you can still drag a PDF onto _run.bat — it will be pre-loaded)

cd /d "%~dp0"

CALL conda activate uplift-narrate 2>nul
IF ERRORLEVEL 1 (
    echo Environment 'uplift-narrate' not found. Run _setup.bat first.
    pause
    exit /b 1
)

echo Launching Uplift Narrator GUI...
python narrate_gui.py %*
