@echo off
echo Installing missing python-docx module...
echo.

REM Activate virtual environment
call narrative_env\Scripts\activate.bat

REM Install python-docx
pip install python-docx

echo.
echo Testing import...
python -c "import docx; print('python-docx installed successfully!')"

echo.
echo Fix complete! You can now run the application.
echo.
pause