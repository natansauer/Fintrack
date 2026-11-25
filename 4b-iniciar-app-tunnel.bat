@echo off
chcp 65001 >nul
cd /d "%~dp0"
title FinTrack - Expo (tunnel)
echo ============================================================
echo  Iniciando com --tunnel (funciona mesmo em redes que bloqueiam
echo  a conexao entre celular e PC). Se perguntar para instalar
echo  @expo/ngrok, responda Y.
echo ============================================================
call npx expo start -c --tunnel
pause
