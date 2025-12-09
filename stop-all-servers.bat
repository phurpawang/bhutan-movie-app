@echo off
echo Stopping all servers...

REM Kill all node processes (will stop both backend and admin servers)
taskkill /F /IM node.exe /T 2>nul

echo.
echo All servers stopped.
pause
