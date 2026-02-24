@echo off
echo Starting LAA Narrative Generator...
echo.

REM Activate virtual environment
call narrative_env\Scripts\activate.bat

REM Run the application
python narrative_generator.py

REM Keep window open if there's an error
if %errorlevel% neq 0 (
    echo.
    echo An error occurred. Press any key to exit...
    pause >nul
)