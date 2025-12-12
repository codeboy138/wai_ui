@echo off
chcp 65001 >nul
REM ============================================================
REM WAI-UI frontend 구조/파일 개요 출력 배치파일
REM 위치: C:\wai-ui\frontend\wai_frontend_overview.bat
REM 실행: C:\wai-ui\frontend> wai_frontend_overview.bat
REM 출력: 콘솔에 Markdown 형식으로
REM       - 현재 시점의 폴더 구조
REM       - 파일 목록 + 확장자 기반 간략 설명
REM ============================================================

REM 스크립트 위치 기준으로 frontend 루트로 이동
cd /d "%~dp0"

setlocal ENABLEDELAYEDEXPANSION

REM ----- 날짜/시간 -----
for /f "tokens=1-2 delims= " %%a in ('wmic os get localdatetime ^| find "."') do set LDT=%%a
set DATESTR=!LDT:~0,4!-!LDT:~4,2!-!LDT:~6,2! !LDT:~8,2!:!LDT:~10,2!:!LDT:~12,2!

REM ----- Markdown 출력 시작 -----
echo # WAI-UI frontend 폴더 구조 및 파일 개요
echo
echo 생성 시점: !DATESTR!
echo 루트 경로: `C:\wai-ui\frontend`
echo
echo ---
echo
echo ## 1. frontend 폴더 구조 (ls -r 스타일)
echo
echo 아래는 현재 시점의 frontend 폴더 구조를 `ls -r` 스타일로 나열한 것이다.
echo ChatGPT는 이 구조를 기준으로 파일 위치/모듈 구성을 이해하면 된다.
echo
echo ^```text
powershell -NoProfile -Command "Get-ChildItem -Recurse ^| ForEach-Object { $_.FullName }"
echo ^```
echo
echo ---
echo
echo ## 2. 파일 목록 + 간단한 파일 내용 설명
echo
echo 확장자 기준으로 **대략적인 역할 설명**을 붙인 목록이다.
echo 실제 의미/상세 로직은 각 파일 내용에서 추가로 확인해야 한다.
echo
echo 구분 규칙(기본값):
echo - .html  ^: HTML 템플릿 / 뷰
echo - .js    ^: JavaScript / Vue / 로직
echo - .css   ^: 스타일(CSS)
echo - .py    ^: Python 스크립트 / 도구
echo - .md    ^: 문서 / Markdown
echo - 기타   ^: 기타 파일
echo
echo ^```text
powershell -NoProfile -Command "Get-ChildItem -Recurse -File ^| ForEach-Object { $ext = $_.Extension.ToLower(); $desc = switch ($ext) { '.html' { 'HTML 템플릿/뷰' } '.js' { 'JavaScript/Vue 로직' } '.css' { 'CSS 스타일' } '.py' { 'Python 스크립트/도구' } '.md' { '문서/Markdown' } default { '기타 파일' } }; Write-Output ($_.FullName + ' - ' + $desc) }"
echo ^```
echo
echo ---
echo
echo ^> 이 출력 전체를 복사해서 새 ChatGPT 대화의 첫 메시지에 붙여넣으면, ^
echo ^> 현재 frontend 폴더 구조와 파일 구성을 이해하는 데 도움이 됩니다.
echo.

endlocal

echo.
echo ==============================================
echo 작업이 완료되었습니다.
echo 이 창을 닫으려면 아무 키나 누르세요...
echo ==============================================
pause >nul
