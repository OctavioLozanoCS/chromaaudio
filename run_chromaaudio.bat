@echo off
title ChromaAudio Studio
cd /d "%~dp0"
echo ========================================================
echo           Starting ChromaAudio Studio DAW
echo ========================================================
echo.
start http://localhost:5174
call npm.cmd run dev
pause
