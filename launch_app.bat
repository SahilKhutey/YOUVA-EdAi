@echo off
echo Starting Youva-EdAi Production Launch...
cd /d "%~dp0"

echo Starting Backend...
start "Youva Backend" cmd /k "cd backend && npm run start"

echo Waiting for Backend to initialize...
timeout /t 5

echo Starting Frontend...
start "Youva Frontend" cmd /k "cd frontend && npm run start"

echo Launch Complete! Open http://localhost:3000 in your browser.
pause
