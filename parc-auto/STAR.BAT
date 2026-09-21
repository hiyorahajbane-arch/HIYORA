@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js not found. Install from https://nodejs.org
  pause
  exit /b 1
)
echo [PARC-AUTO] Node version:
node --version
if not exist "server\node_modules" (
  echo [PARC-AUTO] Installing server packages...
  call npm.cmd install --prefix server
  if not exist "server\node_modules" (
    echo [PARC-AUTO] Installing from parc-auto package...
    call npm.cmd install
  )
)
REM Install parc-auto deps if needed
if not exist "node_modules\express" (
  if exist "package.json" call npm.cmd install
)
echo.
echo [PARC-AUTO] Starting Parc Auto - 50 vehicules...
echo   App: http://localhost:3002
echo   API: http://localhost:3002/api/parc
echo.
echo [PARC-AUTO] Opening browser automatically in 4 seconds...
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3002"
node server\server.js
if errorlevel 1 (
  echo [ERROR] Server failed to start - check messages above
  pause
  exit /b 1
)
