@echo off
echo ====================================
echo LAA Narrative Generator Setup
echo ====================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo Step 1: Creating virtual environment...
echo.

REM Create virtual environment
python -m venv narrative_env

echo Step 2: Activating virtual environment...
echo.

REM Activate virtual environment
call narrative_env\Scripts\activate.bat

echo Step 3: Installing required packages...
echo.

REM Upgrade pip first
python -m pip install --upgrade pip

REM Install requirements
pip install pdfplumber==0.10.3
pip install pyperclip==1.8.2
pip install python-docx==1.1.0

REM Verify installations
echo.
echo Verifying installations...
python -c "import pdfplumber; print('pdfplumber OK')"
python -c "import pyperclip; print('pyperclip OK')"
python -c "import docx; print('python-docx OK')"

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo To run the application:
echo   1. Run: narrative_env\Scripts\activate
echo   2. Run: python narrative_generator.py
echo.
echo Or use the run_narrative_generator.bat file
echo.
pause