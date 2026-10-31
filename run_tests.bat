@echo off
echo Running CivicConnect Automated Test Suite...
cd backend
python -m pytest tests/test_civicconnect.py -v
pause
