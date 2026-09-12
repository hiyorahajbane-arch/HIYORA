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
echo [STAR] Node version:
node --version
if not exist "server\node_modules" (
  echo [STAR] Installing server packages...
  call npm.cmd --prefix server install
)
if not exist "client\node_modules" (
  echo [STAR] Installing client packages...
  call npm.cmd --prefix client install
)
if not exist "server\data\db.json" (
  echo [STAR] Seeding demo products...
  node server\seed.js
)
if not exist "client\dist\index.html" (
  echo [STAR] Building client...
  call npm.cmd --prefix client run build
)
echo.
echo [STAR] Starting store...
echo   Server: http://localhost:3001
echo   Admin:  http://localhost:3001/admin  (admin / admin123)
echo.
echo [STAR] Opening browser automatically in 4 seconds...
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3001"
call npm.cmd --prefix server start
if errorlevel 1 (
  echo [ERROR] Server failed to start - check messages above
  pause
  exit /b 1
)
