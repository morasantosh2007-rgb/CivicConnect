@echo off
echo Running CivicConnect Automated Test Suite...
cd /d "%~dp0backend"
if exist "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" -m pytest tests/test_civicconnect.py -v
) else (
    python -m pytest tests/test_civicconnect.py -v
)
pause
