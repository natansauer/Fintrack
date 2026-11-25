@echo off
chcp 65001 >nul
cd /d "%~dp0"
title FinTrack - typecheck e testes
echo ============================================================
echo  Passo 3: verificacao de tipos e testes automatizados
echo ============================================================
echo.
echo [1/2] npm run typecheck
call npm run typecheck
if errorlevel 1 (echo *** Erros de tipo encontrados. ***) else (echo OK: nenhum erro de tipo.)
echo.
echo [2/2] npm test  (esperado: 5 suites, 51 testes)
call npm test
echo.
pause
