@echo off
echo ==========================================
echo SeaBird HR Analytics - Backend Setup
echo ==========================================
cd /d "%~dp0"

echo.
echo [1/4] Creating virtual environment...
py -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create venv. Make sure Python is installed.
    pause
    exit /b 1
)

echo.
echo [2/4] Upgrading pip...
venv\Scripts\python -m pip install --upgrade pip

echo.
echo [3/4] Installing dependencies (no pandas needed!)...
venv\Scripts\pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo [4/4] Setup complete!
echo.
echo To start the server, run: start-server.bat
echo.
pause
