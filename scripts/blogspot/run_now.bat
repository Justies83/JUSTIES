@echo off
chcp 65001 >nul
REM Blogspot 자동 발행 — 더블 클릭 한 번으로 돈다.
REM 처음이라면 scripts\blogspot\.env 에 키를 먼저 넣는다 (docs/routines/blogspot.md).
cd /d "%~dp0..\.."

if "%~1"=="" (
  echo [1회 발행] 멈추려면 창을 닫는다.
  python scripts\blogspot\auto_post.py
) else (
  echo [%~1분 간격 반복] 멈추려면 Ctrl+C.
  python scripts\blogspot\auto_post.py --loop %~1
)

echo.
pause
