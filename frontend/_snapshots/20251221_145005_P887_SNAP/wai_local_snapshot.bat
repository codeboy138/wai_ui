@echo off
REM WAI Local Snapshot Runner
REM - 위치: C:\wai-ui\frontend\wai_local_snapshot.bat
REM - 사용 예:
REM     더블클릭 후:
REM         py tools\wai_local_snapshot.py save "P23: 프리뷰/Dev 작업 전"
REM     또는 CMD에서:
REM         wai_local_snapshot.bat save "P23: 프리뷰/Dev 작업 전"

cd /d "%~dp0"
py tools\wai_local_snapshot.py %*
