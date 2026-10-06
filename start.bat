@echo off
title Second Brain AI
cd /d "%~dp0"
echo ========================================================
echo   KHOI DONG SECOND BRAIN AI (BO NAO THU HAI CA NHAN)
echo ========================================================
echo.
echo Dang khoi chay may chu backend va giao dien web...
call "backend\.venv\Scripts\python.exe" run.py
pause
