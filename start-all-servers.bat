@echo off
echo Starting Bhutan Movie App Servers...
echo.

REM Start Backend Server
echo Starting Backend Server on port 5001...
start "Backend Server" /MIN cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 3 /nobreak > nul

REM Start Admin Server
echo Starting Admin Server on port 5000...
start "Admin Server" /MIN cmd /k "cd /d %~dp0admin\server && npm start"
timeout /t 3 /nobreak > nul

REM Start Admin Frontend
echo Starting Admin Frontend on port 5174...
start "Admin Frontend" /MIN cmd /k "cd /d %~dp0admin && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo All servers started!
echo - Backend Server: http://192.168.2.219:5001
echo - Admin Server: http://localhost:5000
echo - Admin Panel: http://localhost:5174
echo.
echo Servers are running in minimized windows.
echo To stop servers, run stop-all-servers.bat
echo.
echo Opening admin panel in 5 seconds...
timeout /t 5 /nobreak > nul
start http://localhost:5174
pause
