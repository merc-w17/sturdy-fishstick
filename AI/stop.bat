@echo off
taskkill /f /im python.exe 2>nul
if %errorlevel% equ 0 (
    echo Server stopped.
) else (
    echo Server was not running.
)
pause
