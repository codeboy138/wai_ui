Project scaffold created.

How to run frontend (dev):
  cd frontend
  npm run dev

How to run backend:
  cd backend
  .\venv\Scripts\Activate.ps1
  uvicorn server:app --reload --port 8001

How to run electron (dev):
  cd frontend
  npm run dev:electron

Note: If execution policy blocks scripts, run:
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
