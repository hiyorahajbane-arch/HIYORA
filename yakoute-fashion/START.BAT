@echo off
REM ==========================================================
REM  YAKOUTE FASHION - start everything (double-click me)
REM  1) MariaDB  2) Web server  3) Open in browser
REM ==========================================================
title YAKOUTE FASHION - Start
cd /d "%~dp0"

echo.
echo  ================================================
echo    YAKOUTE FASHION  -  متجر أزياء إلكتروني
echo  ================================================
echo.

REM --- 1. Database -------------------------------------------------
echo [1/3] Starting MariaDB database...
call "%~dp0tools\bin\db-start.cmd"

REM --- 2. Web server ----------------------------------------------
echo [2/3] Starting web server on http://localhost:8080 ...
start "Yakoute Fashion - Server" cmd /k ""%~dp0tools\bin\serve.cmd""

REM --- 3. Open browser --------------------------------------------
echo [3/3] Waiting a few seconds, then opening the shop...
timeout /t 8 /nobreak >nul
start "" http://localhost:8080
start "" http://localhost:8080/wp-admin

echo.
echo  ================================================
echo    Website : http://localhost:8080
echo    Admin   : http://localhost:8080/wp-admin
echo    User    : yakoute
echo    Password: yakoute@2026
echo  ================================================
echo  To stop everything: double-click STOP.BAT
echo.
pause
