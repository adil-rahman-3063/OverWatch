@echo off
title OverWatch Windows Client
cd /d "%~dp0\client"
echo Starting OverWatch Client Daemon...
node dist/index.js
pause
