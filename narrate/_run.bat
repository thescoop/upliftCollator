@echo off
REM Activate the conda env and run the narrator.
REM Usage: _run.bat path\to\case.pdf [--out-dir DIR]

setlocal
set ENV_NAME=uplift-narrate

cd /d "%~dp0"

call conda activate %ENV_NAME%
if errorlevel 1 exit /b 1

python narrate.py %*
endlocal
