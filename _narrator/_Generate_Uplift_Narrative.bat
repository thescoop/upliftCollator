@echo off
REM _Generate_Uplift_Narrative.bat - Launch the Uplift Narrator GUI
REM Usage: double-click, or _Generate_Uplift_Narrative.bat path\to\case.pdf to pre-load a PDF
REM (you can also drag a PDF onto _Generate_Uplift_Narrative.bat in Explorer)

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
    echo   - "ModuleNotFoundError: No module named X" - a dependency is missing
    echo     from this environment. Run _setup.bat; it updates an existing
    echo     environment in place, it does not just create a new one.
    echo   - Windows and WSL have SEPARATE conda environments that share the
    echo     name 'uplift-narrate'. Installing a package under WSL does nothing
    echo     for this one. Run _setup.bat here, on Windows.
    echo   - Some other error - the message above will say what.
    echo.
    pause
    exit /b 1
)
