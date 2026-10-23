@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
set "WEB_PY=%~dp0.venv-web\Scripts\python.exe"

if not exist "%WEB_PY%" (
  echo Setting up the Carwise web environment...
  where py >nul 2>nul
  if not errorlevel 1 (
    py -3 -m venv "%~dp0.venv-web"
  ) else (
    python -m venv "%~dp0.venv-web"
  )
  if errorlevel 1 (
    echo Virtual environment setup failed. Checking the installed Python instead...
    where python >nul 2>nul
    if errorlevel 1 (
      echo Could not find Python. Install Python 3.10 or newer and try again.
      pause
      exit /b 1
    )
    set "WEB_PY=python"
  )
)

"%WEB_PY%" -c "import flask, pandas, numpy, sklearn, joblib" >nul 2>nul
if errorlevel 1 (
  if "%WEB_PY%"=="python" (
    echo Required web packages are missing from the installed Python. Install web-requirements.txt and try again.
    pause
    exit /b 1
  )
  echo Installing website dependencies. This may take a few minutes the first time...
  "%WEB_PY%" -m pip install -r web-requirements.txt
  if errorlevel 1 (
    echo Virtual environment dependencies are unavailable. Trying the installed Python...
    set "WEB_PY=python"
    "!WEB_PY!" -c "import flask, pandas, numpy, sklearn, joblib" >nul 2>nul
    if errorlevel 1 (
      echo Dependencies are missing. Install web-requirements.txt and try again.
      pause
      exit /b 1
    )
  )
)

echo Starting Carwise. Open http://127.0.0.1:5000 in your browser.
"%WEB_PY%" app.py
pause
