@echo off
:: ==============================================================================
:: OverWatch 1-Click Windows Setup Launcher
:: Double-click this file to set up everything automatically.
:: ==============================================================================
title OverWatch Windows Setup
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [OverWatch] Setup exited with an error. Please check the logs above.
    pause
) else (
    echo.
    echo [OverWatch] Setup finished successfully!
    pause
)
