@echo off
setlocal
cd /d "%~dp0"
echo [STOP] Stopping LINGERIE YAKOUTE server (port 3002)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr LISTENING') do (
  echo   Killing PID %%a
  taskkill /F /PID %%a >nul 2>&1
)
echo [STOP] Done. Start again with START.BAT
pause
