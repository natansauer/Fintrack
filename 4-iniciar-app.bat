@echo off
chcp 65001 >nul
cd /d "%~dp0"
title FinTrack - Expo
echo ============================================================
echo  Passo 4: iniciar o app (escaneie o QR Code no Expo Go)
echo  Celular e PC precisam estar na mesma rede Wi-Fi.
echo  Se o QR Code nao abrir (rede da faculdade), use 4b-iniciar-app-tunnel.bat
echo ============================================================
call npx expo start -c
pause
