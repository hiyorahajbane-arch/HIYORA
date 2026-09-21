@echo off
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)
echo.
echo [PARC-AUTO DEV] Standalone - 50 vehicules
echo   App: http://localhost:3002
echo.
start "PARC-AUTO Server" cmd /k "node server\server.js"
timeout /t 3 >nul
start http://localhost:3002
