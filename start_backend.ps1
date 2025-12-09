# C:\wai-ui\start_backend.ps1
# Electron 개발 모드 실행 전 백엔드 서버를 자동으로 실행하는 스크립트

# 1. 백엔드 폴더로 이동
cd C:\wai-ui\backend

# 2. 가상 환경 활성화 스크립트 경로 지정
$venvActivateScript = ".\venv\Scripts\Activate.ps1"

# 3. Uvicorn 서버 실행 명령어 정의
$uvicornCommand = "uvicorn server:app --reload --port 8001"

# 4. 백엔드 서버를 새로운 PowerShell 프로세스에서 실행
Write-Host ">>> 백엔드 서버 (Uvicorn)를 백그라운드에서 실행합니다."

# PowerShell에서 다른 PowerShell을 실행하며 가상환경 활성화 및 Uvicorn 실행
Start-Process powershell -ArgumentList "-NoExit -Command & { . $venvActivateScript ; Write-Host 'Uvicorn 기동 시작...'; & $uvicornCommand }"

Write-Host ">>> Uvicorn 서버가 8001 포트에서 실행 중인지 확인하십시오."
Write-Host ">>> 이 창은 닫지 마십시오. Electron 실행 준비 완료."