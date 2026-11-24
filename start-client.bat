@echo off
title OverWatch Windows Client Daemon
cd /d "%~dp0client"
echo ======================================================
echo    Starting OverWatch Windows Client Daemon...
echo ======================================================
node dist/index.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo OverWatch Client crashed or exited with error code %ERRORLEVEL%.
    pause
)
