@echo off
echo Starting Manifest Engine v1.3...
start /B cmd /c "cd src\backend && node server.js"
timeout /t 3
start /B cmd /c "cd src\ai-engine && call venv\Scripts\activate && python main.py"
timeout /t 3
start http://localhost:3001
echo Manifest Engine is running!
pause