@echo off
setlocal enabledelayedexpansion

:: ==========================================
:: 🚀 WAI Studio 통합 런처 (Git Auto-Commit Edition)
:: ==========================================
title WAI Studio Launcher
cd /d "C:\wai-ui"

echo.
echo ========================================================
echo   [ WAI Studio ] 시스템을 가동합니다...
echo ========================================================
echo.

:: 1. Magic Sync 실행 (Git 자동 커밋 포함)
echo [1/3] 🎩 Magic Sync + Git Auto-Commit 시작...
start "WAI Magic Sync" cmd /k "python wai_magic.py"

:: 2. Backend 실행 (Python Server)
echo [2/3] 🧠 Backend Server (Port 8001) 시작...
if exist "backend\venv\Scripts\activate.bat" (
    start "WAI Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn server:app --reload --port 8001"
) else (
    start "WAI Backend" cmd /k "cd backend && uvicorn server:app --reload --port 8001"
)

:: 잠시 대기 (서버 안정화)
timeout /t 2 /nobreak >nul

:: 3. Frontend 실행 (Electron)
echo [3/3] 🖥️ Frontend (Electron) 시작...
cd frontend
start "WAI Client" cmd /k "npm start"

echo.
echo ========================================================
echo   ✅ 모든 시스템이 실행되었습니다.
echo      - Magic Sync: 코드 자동 반영 + Git 커밋
echo      - Backend: http://localhost:8001
echo      - Frontend: Electron UI
echo.
echo   이 창은 3초 뒤 자동으로 닫힙니다.
echo ========================================================
timeout /t 3
exit