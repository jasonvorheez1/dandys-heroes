@echo off
title Dandy's Heroes Launcher
echo ===================================================
echo           Starting Dandy's Heroes...
echo ===================================================
echo.

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Launching local server with Python...
    start "" http://localhost:8000
    python -m http.server 8000
    goto end
)

where npx >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Launching local server with Node.js...
    start "" http://localhost:8000
    npx -y http-server -p 8000
    goto end
)

echo [INFO] Opening directly in default browser...
start "" index.html

:end
