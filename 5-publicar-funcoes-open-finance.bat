@echo off
chcp 65001 >nul
cd /d "%~dp0"
title FinTrack - publicar Edge Functions (Open Finance)
echo ============================================================
echo  OPCIONAL - so para o Open Finance REAL (o app ja funciona no modo simulado)
echo  Depois de publicar, troque no .env: EXPO_PUBLIC_OPEN_FINANCE_MODE=pluggy
echo  Precisa do Client ID e do Client Secret da aplicacao no Pluggy
echo  (dashboard.pluggy.ai). Eles ficam SO no servidor do Supabase.
echo ============================================================
echo.
echo [1/4] Login na CLI do Supabase (abre o navegador)...
call npx -y supabase login || goto :erro

echo.
echo [2/4] Ligando a pasta ao projeto xwtgcosvtrnucahdvqfs...
echo (se pedir a senha do banco, pode deixar em branco e apertar Enter)
call npx -y supabase link --project-ref xwtgcosvtrnucahdvqfs || goto :erro

echo.
echo [3/4] Segredos do Pluggy
set /p PLUGGY_ID=Cole o Client ID do Pluggy e aperte Enter: 
set /p PLUGGY_SECRET=Cole o Client Secret do Pluggy e aperte Enter: 
call npx -y supabase secrets set PLUGGY_CLIENT_ID=%PLUGGY_ID% PLUGGY_CLIENT_SECRET=%PLUGGY_SECRET% || goto :erro
set PLUGGY_SECRET=
cls

echo.
echo [4/4] Publicando as tres funcoes (sem Docker: --use-api)...
for %%F in (bank-connect-token bank-sync bank-disconnect) do (
  call npx -y supabase functions deploy %%F --use-api --no-verify-jwt || goto :erro
)

echo.
call npx -y supabase functions list
call npx -y supabase secrets list
echo.
echo As tres funcoes devem aparecer como ACTIVE.
pause
exit /b 0

:erro
echo.
echo *** Falhou. Leia a mensagem acima. ***
pause
exit /b 1
