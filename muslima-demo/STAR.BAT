@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
where node >nul 2>&1
if errorlevel 1 (echo Node.js not found & pause & exit /b 1)
echo [ZAWAJ-HAJBANE] Node %node --version%
echo [ZAWAJ-HAJBANE] http://localhost:3003
echo   API: http://localhost:3003/api/zawaj
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3003"
node server/server.js
if errorlevel 1 (pause)
