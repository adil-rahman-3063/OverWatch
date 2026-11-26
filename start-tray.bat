@echo off
:: OverWatch Silent System Tray Launcher
:: Runs OverWatch in the background with an icon in the Windows notification area (System Tray).
:: No persistent command prompt window is left open on your screen.

start "" powershell.exe -STA -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0client\scripts\tray.ps1"
exit
