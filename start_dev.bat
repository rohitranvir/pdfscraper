@echo off
echo Starting Autonomous Insurance Claims Processing Agent...

:: Start Backend
echo Starting Backend (FastAPI)...
start "Backend" cmd /k "cd backend && .venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Start Frontend  
echo Starting Frontend (Vite React)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo Both services are booting up!
echo Backend: http://localhost:8000/docs
echo Frontend: http://localhost:5173
