@echo off
echo Starting TechCare AI Platform...

echo Stopping existing Node/Vite processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM vite.exe >nul 2>&1

echo Starting Backend Server...
start cmd /k "cd backend && npm install && npm start"

echo Starting Frontend Server...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Both servers are starting up in separate windows!
echo Backend will be available on port 5000
echo Frontend will be available on http://localhost:5173
echo.
pause
