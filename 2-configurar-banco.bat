@echo off
chcp 65001 >nul
cd /d "%~dp0"
title FinTrack - configurar banco no Supabase
echo ============================================================
echo  Passo 2: configurar o banco no Supabase
echo ============================================================
echo.
echo O script supabase\setup-completo.sql (tabelas, RLS, categorias
echo e Open Finance) foi COPIADO para a area de transferencia.
echo.
echo 1. O navegador vai abrir o SQL Editor do seu projeto.
echo 2. Cole (Ctrl+V) e clique em Run.
echo 3. No final deve aparecer: categorias = 14.
echo.
powershell -NoProfile -Command "Get-Content -Raw -Encoding UTF8 'supabase\setup-completo.sql' | Set-Clipboard"
start "" "https://supabase.com/dashboard/project/xwtgcosvtrnucahdvqfs/sql/new"
pause
echo.
echo 4. Agora vai abrir a tela de login por e-mail.
echo    Em Email, DESLIGUE "Confirm email" e salve (facilita o cadastro em sala).
start "" "https://supabase.com/dashboard/project/xwtgcosvtrnucahdvqfs/auth/providers"
echo.
echo Proximo passo: 3-verificar-codigo.bat
pause
