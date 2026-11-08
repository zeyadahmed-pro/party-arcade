@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18 or newer is required. Install it from https://nodejs.org and launch again.
  pause
  exit /b 1
)
if not exist "node_modules\express\package.json" (
  echo Installing Party Arcade dependencies...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)
node launcher.js
if errorlevel 1 pause
