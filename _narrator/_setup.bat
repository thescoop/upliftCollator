@echo off
REM _setup.bat - First-time environment setup for the uplift narrator
REM Run this once before using _Generate_Uplift_Narrative.bat

cd /d "%~dp0"

echo Creating conda environment 'uplift-narrate'...
CALL conda create -n uplift-narrate python=3.11 -y
IF ERRORLEVEL 1 (
    echo Failed to create environment. Is conda installed?
    pause
    exit /b 1
)

echo Activating environment...
CALL conda activate uplift-narrate

echo Installing dependencies...
pip install -r requirements.txt
IF ERRORLEVEL 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Setup complete!
echo.
echo Next: drag a PDF onto _Generate_Uplift_Narrative.bat, or run from cmd:
echo   _Generate_Uplift_Narrative.bat path\to\case.pdf
echo.
pause
