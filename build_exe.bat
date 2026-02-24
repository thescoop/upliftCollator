@echo off
echo ====================================
echo Building LAA Narrative Generator EXE
echo ====================================
echo.

REM Activate virtual environment
call narrative_env\Scripts\activate.bat

REM Install PyInstaller if not already installed
pip install pyinstaller

echo.
echo Creating executable...
echo.

REM Create the executable
pyinstaller --onefile --windowed --name="LAA_Narrative_Generator" --icon=favicon.ico narrative_generator.py

echo.
echo ====================================
echo Build Complete!
echo ====================================
echo.
echo The executable can be found in: dist\LAA_Narrative_Generator.exe
echo.
echo This file can be run on any Windows computer without Python installed.
echo.
pause