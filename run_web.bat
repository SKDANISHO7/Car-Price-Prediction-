@echo off
setlocal
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
    echo Could not create the Python environment. Install Python 3.10 or newer and try again.
    pause
    exit /b 1
  )
)

"%WEB_PY%" -c "import flask, pandas, numpy, sklearn, joblib" >nul 2>nul
if errorlevel 1 (
  echo Installing website dependencies. This may take a few minutes the first time...
  "%WEB_PY%" -m pip install -r web-requirements.txt
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo Starting Carwise. Open http://127.0.0.1:5000 in your browser.
"%WEB_PY%" app.py
pause
