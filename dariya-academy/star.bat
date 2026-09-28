@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Dariya Academy - star.bat
cd /d "%~dp0"

rem ==========================================================================
rem  star.bat - one click launcher for Dariya Academy
rem
rem    star.bat            auto: production if client\dist exists, else dev
rem    star.bat dev        API + Vite dev server with hot reload
rem    star.bat prod       build (if needed) then serve everything from the API
rem    star.bat rebuild    force a fresh production build, then serve
rem    star.bat test       run the API + dev client test suites
rem    star.bat lint       run the content linter only
rem    star.bat clean      delete node_modules, dist and generated data
rem    star.bat reset      wipe the database (seed accounts) and start
rem
rem    add --no-open to skip opening the browser
rem ==========================================================================

set "MODE=%~1"
set "OPEN=1"
call :parse_flags %*
if "%MODE%"=="" set "MODE=auto"

set "API_PORT=4000"
set "WEB_PORT=5173"

call :banner
call :need node "Node.js is required. Download it from https://nodejs.org then reopen this file."
call :need npm "npm is required (it ships with Node.js)."
call :pick-mode
call :pick-port
set "PORT=%API_PORT%"

:main
if /i "%MODE%"=="test"  goto :do_test
if /i "%MODE%"=="lint"  goto :do_lint
if /i "%MODE%"=="clean" goto :do_clean
if /i "%MODE%"=="reset" goto :do_reset

rem ---- dependencies --------------------------------------------------------
if not exist "node_modules\concurrently" (
  call :step "Installing root dependencies (concurrently)..."
  call :install "."
  if errorlevel 1 goto :failed
)
if not exist "server\node_modules\express" (
  call :step "Installing server dependencies..."
  call :install "server"
  if errorlevel 1 goto :failed
)
if not exist "client\node_modules\vite" (
  call :step "Installing client dependencies..."
  call :install "client"
  if errorlevel 1 goto :failed
  rem npm 11+ blocks postinstall scripts until they are approved; esbuild needs it.
  if not exist "client\node_modules\esbuild\bin\esbuild.exe" (
    call :step "Approving the esbuild install script..."
    pushd "client" && call npm approve-scripts esbuild && popd
  )
)

rem ---- database + content --------------------------------------------------
if not exist "server\data\db.json" (
  call :step "Seeding the database and generating lessons.json..."
  call npm run seed
  if errorlevel 1 goto :failed
) else (
  call :step "Regenerating lessons.json from the content files..."
  pushd "server" && call npm run seed >nul && popd
)

if /i "%MODE%"=="prod"  goto :do_build
goto :announce

:announce
if /i "%MODE%"=="prod" (
  set "SITE=http://localhost:%API_PORT%"
  set "_port=%API_PORT%"
) else (
  set "SITE=http://localhost:%WEB_PORT%"
  set "_port=%WEB_PORT%"
)
echo.
echo   Mode : %MODE%
echo   Site : %SITE%
echo   API  : http://localhost:%API_PORT%
echo   Stop : press CTRL+C in this window
echo.
if "%OPEN%"=="1" call :open-browser
if /i "%MODE%"=="prod" (call npm start) else (call npm run dev)
goto :done

rem ==========================================================================
rem  actions
rem ==========================================================================

rem  :do_build must always end in a goto, never in goto :eof - at the top level of a
rem  batch file goto :eof silently ends the script.
:do_build
if exist "client\dist\index.html" goto :announce
call :step "Building the client for production..."
call npm run build
if errorlevel 1 goto :failed
goto :announce

:do_test
call :step "API + SPA test suite..."
call npm test
if errorlevel 1 goto :failed
call :step "Dev client test suite..."
call npm run test:client
if errorlevel 1 goto :failed
goto :done

:do_lint
call :step "Linting the lesson content..."
call npm run lint:content
goto :done

:do_clean
call :step "Removing node_modules, dist and generated data..."
if exist "node_modules"        rmdir /s /q "node_modules"
if exist "server\node_modules" rmdir /s /q "server\node_modules"
if exist "client\node_modules" rmdir /s /q "client\node_modules"
if exist "client\dist"         rmdir /s /q "client\dist"
if exist "server\data"         rmdir /s /q "server\data"
echo   Done. Run star.bat again to reinstall everything from scratch.
goto :done

:do_reset
call :step "Wiping the database and re-seeding the demo accounts..."
call npm run seed:force
if errorlevel 1 goto :failed
set "MODE=auto"
goto :main

rem ==========================================================================
rem  helpers
rem ==========================================================================

:banner
echo.
echo   ===========================================================
echo     Dariya Academy  ^|  darija - francais - english - espanol - deutsch
echo   ===========================================================
goto :eof

rem :parse_flags <args...> - recognises --no-open without breaking on no args
:parse_flags
if "%~1"=="" goto :eof
if /i "%~1"=="--no-open" set "OPEN=0"
shift
goto :parse_flags

:need
where %~1 >nul 2>&1
if not errorlevel 1 goto :eof
echo.
echo   [X] %~2
echo.
pause
exit /b 1

rem :install <dir> - npm install inside a subfolder of the project
:install
pushd "%~1" || exit /b 1
call npm install --no-audit --no-fund
set "_rc=%errorlevel%"
popd
exit /b %_rc%

:pick-mode
if /i "%MODE%"=="dev"     goto :eof
if /i "%MODE%"=="prod"    goto :eof
if /i "%MODE%"=="test"    goto :eof
if /i "%MODE%"=="lint"    goto :eof
if /i "%MODE%"=="clean"   goto :eof
if /i "%MODE%"=="reset"   goto :eof
if /i "%MODE%"=="rebuild" (
  set "MODE=prod"
  if exist "client\dist" rmdir /s /q "client\dist"
  goto :eof
)
if exist "client\dist\index.html" (set "MODE=prod") else (set "MODE=dev")
goto :eof

rem :pick-port - if the API port is busy, walk forward so star.bat can run twice
:pick-port
set /a "_try=%API_PORT%"
:pick_port_loop
netstat -ano -p TCP | find ":%API_PORT% " | find "LISTENING" >nul 2>&1
if errorlevel 1 goto :eof
set /a "_try+=1"
if !_try! GTR 4010 (
  echo.
  echo   [X] No free API port between %API_PORT% and 4010.
  echo.
  pause
  exit /b 1
)
echo   [*] Port %API_PORT% is busy, moving to port !_try!.
set "API_PORT=!_try!"
goto :pick_port_loop

:step
echo.
echo   [.] %~1
goto :eof

rem :sleep <seconds> - works even when stdin is redirected (timeout does not)
:sleep
ping -n %~2 127.0.0.1 >nul 2>&1
goto :eof

rem :open-browser - waits until the site answers, then opens the default browser
:open-browser
if not exist "server\scripts\open-browser.mjs" goto :open_fallback
start "Dariya Academy browser" /min "%ComSpec%" /c node "server\scripts\open-browser.mjs" "%SITE%" "%_port%"
goto :eof
:open_fallback
start "" "%SITE%"
goto :eof

:failed
echo.
echo   [X] Something failed. Scroll up for the error.
echo.
pause
exit /b 1

:done
echo.
echo   Bye.
call :sleep 3
endlocal
