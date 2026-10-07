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
echo [DEV] LINGERIE YAKOUTE - Hot-reload mode
echo   Client: http://localhost:5174
echo   Server: http://localhost:3002
echo.
start "YAKOUTE Server" cmd /k "npm.cmd --prefix server run dev"
start "YAKOUTE Client" cmd /k "npm.cmd --prefix client run dev"
timeout /t 6 >nul
start http://localhost:5174
