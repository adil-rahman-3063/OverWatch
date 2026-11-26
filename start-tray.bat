@echo off
:: OverWatch Silent System Tray Launcher
:: Uses Windows Script Host (wscript.exe) to launch PowerShell in completely hidden mode (SW_HIDE).
:: Completely bypasses Windows 11 Windows Terminal interception so no blank window is left open.

wscript.exe //nologo "%~dp0client\scripts\silent-launch.vbs" "%~dp0client\scripts\tray.ps1"
exit
