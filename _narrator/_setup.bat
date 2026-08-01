@echo off
REM _setup.bat - Create or update the conda environment for the uplift narrator.
REM
REM Safe to re-run. An existing environment is updated in place rather than
REM being treated as an error, which is how you pick up a dependency added
REM since you last ran this. The previous version always called "conda create",
REM so on an existing environment it failed and reported "Is conda installed?",
REM which sent you looking in the wrong place entirely.
REM
REM Note that the Windows and WSL conda environments are separate installations
REM that happen to share a name. Installing a package in one does nothing for
REM the other, so run this on whichever side you actually launch the tool from.

cd /d "%~dp0"

SET ENV_NAME=uplift-narrate
SET PY_VERSION=3.11

conda env list | findstr /R /C:"^%ENV_NAME% " >nul 2>&1
IF ERRORLEVEL 1 (
    echo Creating conda env '%ENV_NAME%' ^(python %PY_VERSION%^)...
    REM conda-forge avoids the Anaconda main-channel ToS gate.
    CALL conda create -y -n %ENV_NAME% -c conda-forge --override-channels python=%PY_VERSION%
    IF ERRORLEVEL 1 (
        echo.
        echo Failed to create the environment. Is conda installed and on PATH?
        pause
        exit /b 1
    )
) ELSE (
    echo Updating existing conda env '%ENV_NAME%'...
)

CALL conda activate %ENV_NAME%
IF ERRORLEVEL 1 (
    echo.
    echo Failed to activate '%ENV_NAME%'.
    pause
    exit /b 1
)

echo Installing/updating dependencies...
pip install -r requirements.txt
IF ERRORLEVEL 1 (
    echo.
    echo Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Done. The environment is ready.
echo.
echo Next: drag a PDF onto _Generate_Uplift_Narrative.bat, or run from cmd:
echo   _Generate_Uplift_Narrative.bat path\to\case.pdf
echo.
pause
