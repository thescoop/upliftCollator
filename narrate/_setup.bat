@echo off
REM Create or update the conda environment for the uplift narrator.
REM Run from the narrate\ folder.

setlocal
set ENV_NAME=uplift-narrate
set PY_VERSION=3.11

cd /d "%~dp0"

call conda env list | findstr /B /C:"%ENV_NAME% " >nul
if %errorlevel%==0 (
    echo Updating existing conda env '%ENV_NAME%'...
    call conda activate %ENV_NAME%
) else (
    echo Creating conda env '%ENV_NAME%' (python %PY_VERSION%)...
    REM conda-forge avoids the Anaconda main-channel ToS gate.
    call conda create -y -n %ENV_NAME% -c conda-forge --override-channels python=%PY_VERSION%
    if errorlevel 1 exit /b 1
    call conda activate %ENV_NAME%
)

pip install -r requirements.txt
if errorlevel 1 exit /b 1

echo.
echo Done. Activate with:  conda activate %ENV_NAME%
echo Or use _run.bat which activates automatically.
endlocal
