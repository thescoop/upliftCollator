@echo off
REM _run.bat - Launch the Uplift Narrator GUI
REM Usage: double-click, or _run.bat path\to\case.pdf to pre-load a PDF
REM (you can also drag a PDF onto _run.bat in Explorer)

cd /d "%~dp0"

CALL conda activate uplift-narrate 2>nul
IF ERRORLEVEL 1 (
    echo Environment 'uplift-narrate' not found. Run _setup.bat first.
    pause
    exit /b 1
)

echo Launching Uplift Narrator GUI...
python narrate_gui.py %*
IF ERRORLEVEL 1 (
    echo.
    echo ERROR: narrate_gui.py exited with an error.
    echo.
    echo Common causes:
    echo   - Missing PyQt6 dependency. Re-run _setup.bat to update.
    echo   - Some other import error - the message above will say which module.
    echo.
    pause
    exit /b 1
)
