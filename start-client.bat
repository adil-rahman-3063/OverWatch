@echo off
title OverWatch Windows Client Daemon
cd /d "%~dp0client"
echo ======================================================
echo    Starting OverWatch Windows Client Daemon...
echo    Tip: Run 'start-tray.bat' to hide this console
echo         and run in the Windows System Tray!
echo ======================================================
node dist/index.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo OverWatch Client crashed or exited with error code %ERRORLEVEL%.
    pause
)
