@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Dariya Academy - double click me
cd /d "%~dp0"

rem ==========================================================================
rem  START_HERE.bat - the only file you ever need to double click.
rem
rem  Double click it and wait. It installs, builds, starts and opens the
rem  browser by itself. Keep the black window open while you use the site.
rem
rem  Extra commands (optional):
rem    START_HERE.bat test        run the self checks and exit
rem    START_HERE.bat reset       wipe the data and start fresh
rem    START_HERE.bat dev         developer mode with hot reload
rem    START_HERE.bat --no-open   do not open the browser
rem ==========================================================================

set "MODE=%~1"
set "OPEN=1"
if "%MODE%"=="" set "MODE=auto"
if /i "%MODE%"=="--no-open" (
  set "MODE=auto"
  set "OPEN=0"
)
if /i "%MODE%"=="-no-open" (
  set "MODE=auto"
  set "OPEN=0"
)

set "API_PORT=4000"
set "WEB_PORT=5173"

echo.
echo   =======================================================
echo      DARIYA ACADEMY   ^|   darija - francais - english
echo     Learn Darija, French, English, Spanish and German
echo   =======================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo   [X] Node.js is not installed on this computer.
  echo.
  echo       1. Open  https://nodejs.org
  echo       2. Press the big green LTS button and install it
  echo       3. Come back and double click this file again
  echo.
  pause
  exit /b 1
)

rem ---- 1. install packages (only the first time) ----------------------------
if exist "client\node_modules\vite" goto :have_packages
echo.
echo   [.] First run: installing everything. Please wait a few minutes.
echo       This happens once only.
call :step "root packages"
pushd "."
call npm install --no-audit --no-fund
popd
if errorlevel 1 goto :failed
call :step "server packages"
pushd "server"
call npm install --no-audit --no-fund
popd
if errorlevel 1 goto :failed
call :step "client packages"
pushd "client"
call npm install --no-audit --no-fund
popd
if errorlevel 1 goto :failed
echo.
echo   All installed. From now on it starts in seconds.

:have_packages
rem ---- 2. lessons + accounts ------------------------------------------------
call :step "Preparing lessons and accounts"
pushd "server"
call node src/seed.js
popd
if errorlevel 1 goto :failed

:main
if /i "%MODE%"=="test" goto :run_test
if /i "%MODE%"=="reset" goto :run_reset

rem ---- 3. pick dev or production -------------------------------------------
if /i "%MODE%"=="auto" (
  if exist "client\dist\index.html" (set "MODE=prod") else (set "MODE=dev")
)
if /i "%MODE%"=="prod" if not exist "client\dist\index.html" (
  call :step "Building the site, first time only"
  call npm run build
  if errorlevel 1 goto :build_repair
  goto :built
)
goto :built
:build_repair
rem npm can block install scripts, which stops esbuild from working. Approve and retry.
echo   [!] The build failed. Repairing the installer and trying once more...
pushd "client"
call npm approve-scripts esbuild
popd
call npm run build
if errorlevel 1 goto :failed
:built

rem ---- 4. find a free port so two copies can run side by side --------------
call :pick_port
set "PORT=%API_PORT%"

rem ---- 5. tell the user, open the browser, run -----------------------------
if /i "%MODE%"=="prod" (
  set "SITE=http://localhost:%API_PORT%"
  set "_port=%API_PORT%"
) else (
  set "SITE=http://localhost:%WEB_PORT%"
  set "_port=%WEB_PORT%"
)
echo.
echo   ------------------------------------------------------------
echo     Mode  : %MODE%
echo     Site  : %SITE%
echo     Login : demo@dariya.academy  /  demo1234
echo   ------------------------------------------------------------
echo   Leave this window open while you use the site.
echo   To stop, click here then press CTRL+C.
echo.
if "%OPEN%"=="1" start "" /b node "server\scripts\open-browser.mjs" "%SITE%" "%_port%"
if /i "%MODE%"=="prod" (call npm start) else (call npm run dev)
goto :done

rem ==========================================================================
rem  other modes
rem ==========================================================================

:run_test
call :step "Checking the API and the site"
call npm test
if errorlevel 1 goto :failed
call :step "Checking the dev server"
call npm run test:client
if errorlevel 1 goto :failed
goto :done

:run_reset
call :step "Resetting the data"
call npm run seed:force
if errorlevel 1 goto :failed
set "MODE=auto"
goto :main

:done
echo.
echo   Closed.
ping -n 3 127.0.0.1 >nul 2>&1
endlocal
exit /b 0

rem ==========================================================================
rem  helpers
rem ==========================================================================

:step
echo.
echo   [.] %~1
goto :eof

:pick_port
set /a "_try=%API_PORT%"
:pick_port_loop
netstat -ano -p TCP 2>&1 | find ":%API_PORT% " | find "LISTENING" >nul 2>&1
if errorlevel 1 goto :eof
set /a "_try+=1"
if !_try! GTR 4020 (
  echo   [X] No free port between 4000 and 4020. Close other apps and retry.
  goto :failed
)
echo   [*] Port %API_PORT% is busy, trying !_try!.
set "API_PORT=!_try!"
goto :pick_port_loop

:failed
echo.
echo   [X] Something went wrong. The lines above say why.
echo.
pause
exit /b 1
