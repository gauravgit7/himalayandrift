@echo off
REM ============================================================================
REM  Himalayan Drift - development launcher
REM  Double-click this file, or run  start.bat  from a terminal.
REM
REM  It installs dependencies if they are missing, checks your .env.local,
REM  starts the Next.js dev server and opens the browser.
REM ============================================================================

setlocal
cd /d "%~dp0"

echo.
echo  ===========================================
echo   Himalayan Drift - starting dev server
echo  ===========================================
echo.

REM -- Node present? ----------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo  [X] Node.js was not found on your PATH.
  echo      Install Node 20 LTS or later from https://nodejs.org and try again.
  echo.
  pause
  exit /b 1
)

REM -- Dependencies installed? ------------------------------------------------
if not exist "node_modules\" (
  echo  [*] node_modules missing - running npm install ...
  echo.
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo.
    echo  [X] npm install failed. Scroll up for the reason.
    pause
    exit /b 1
  )
  echo.
)

REM -- Environment file ------------------------------------------------------
if not exist ".env.local" (
  echo  [!] No .env.local found - creating one from .env.local.example
  copy /y ".env.local.example" ".env.local" >nul
  echo.
  echo      It contains PLACEHOLDER values. Until you paste in real Supabase
  echo      keys, pages that read the database will fail to load.
  echo.
  echo      Fill in, at minimum:
  echo        NEXT_PUBLIC_SUPABASE_URL
  echo        NEXT_PUBLIC_SUPABASE_ANON_KEY
  echo        ADMIN_EMAILS       ^(full address, including the domain^)
  echo.
  echo      ADMIN_EMAILS is read server-side - restart this script after
  echo      changing it.
  echo.
  pause
)

REM -- Warn if the Supabase URL is still the placeholder ----------------------
findstr /c:"your-project-id.supabase.co" ".env.local" >nul 2>nul
if not errorlevel 1 (
  echo  [!] .env.local still has the placeholder Supabase URL.
  echo      The site will start, but ride/member pages will error until it is set.
  echo.
)

REM -- Go --------------------------------------------------------------------
echo  [*] Starting Next.js on http://localhost:3000
echo      Press Ctrl+C in this window to stop the server.
echo.

start "" "http://localhost:3000"
call npm run dev

echo.
echo  Dev server stopped.
pause
endlocal
