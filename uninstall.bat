@echo off
:: ==============================================================================
:: OverWatch 1-Click Windows Uninstaller Launcher
:: Double-click this file to stop the daemon and unregister all hooks & startup.
:: ==============================================================================
title OverWatch Windows Uninstaller
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1" %*
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [OverWatch] Uninstaller exited with code %ERRORLEVEL%.
    pause
) else (
    echo.
    pause
)
