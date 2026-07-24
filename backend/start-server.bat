@echo off
echo ==========================================
echo Starting SeaBird HR Analytics Backend
echo ==========================================
cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found. Run setup.bat first.
    pause
    exit /b 1
)

echo Starting FastAPI server on http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
venv\Scripts\python main.py
pause
