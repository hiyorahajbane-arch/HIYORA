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
if not exist "server\node_modules" (
  echo [DEV] Installing server packages...
  call npm.cmd --prefix server install
)
if not exist "client\node_modules" (
  echo [DEV] Installing client packages...
  call npm.cmd --prefix client install
)
echo.
echo [DEV] Hot-reload mode - edits appear instantly, no build needed.
echo   Client: http://localhost:5173
echo   Server: http://localhost:3001
echo.
start "HIYORA Server" cmd /k "npm.cmd --prefix server run dev"
start "HIYORA Client" cmd /k "npm.cmd --prefix client run dev"
timeout /t 6 >nul
start http://localhost:5173
