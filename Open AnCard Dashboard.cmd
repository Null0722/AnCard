@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install Node.js 20 or newer from https://nodejs.org/
  echo Then open this file again.
  pause
  exit /b 1
)
where git >nul 2>nul
if errorlevel 1 (
  echo Git is required for saving and publishing. Install Git for Windows from https://git-scm.com/install/windows
  echo Then open this file again.
  pause
  exit /b 1
)
echo Opening the AnCard editorial dashboard...
echo Keep this window open while you use it. Press Ctrl+C to stop.
node scripts\review-dashboard.mjs
if errorlevel 1 echo The dashboard could not start. Check the message above.
pause
