@echo off
REM ==========================================================
REM  YAKOUTE FASHION - stop everything
REM ==========================================================
title YAKOUTE FASHION - Stop
echo.
echo  Stopping MariaDB and the web server...
call "%~dp0tools\bin\db-stop.cmd"
taskkill /FI "IMAGENAME eq php.exe" /F >nul 2>&1
echo  Done. You can close this window.
echo.
timeout /t 3 /nobreak >nul
