@echo off
chcp 65001 >nul
cd /d "%~dp0"
title FinTrack - instalar dependencias
echo ============================================================
echo  FinTrack - Natan Forte Sauer
echo  Passo 1: instalando as dependencias (Expo SDK 58)
echo  Isso pode levar alguns minutos na primeira vez.
echo ============================================================
echo.

echo [1/5] Expo SDK 58...
call npm install expo@^58.0.0
if errorlevel 1 (
  echo Tentando de novo com --legacy-peer-deps...
  call npm install expo@^58.0.0 --legacy-peer-deps || goto :erro
)

echo.
echo [2/5] Bibliotecas do ecossistema Expo (versoes compativeis com o SDK)...
call npx expo install react react-dom react-native expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-native-web @expo/vector-icons react-native-svg @react-native-async-storage/async-storage react-native-webview || goto :erro

echo.
echo [3/5] Supabase, React Query, formularios e Open Finance (Pluggy)...
call npm install @supabase/supabase-js @tanstack/react-query react-hook-form zod @hookform/resolvers react-native-url-polyfill react-native-pluggy-connect pluggy-js
if errorlevel 1 (
  call npm install @supabase/supabase-js @tanstack/react-query react-hook-form zod @hookform/resolvers react-native-url-polyfill react-native-pluggy-connect pluggy-js --legacy-peer-deps || goto :erro
)

echo.
echo [4/5] Ferramentas de desenvolvimento (TypeScript, Jest, Prettier)...
call npx expo install typescript @types/react jest-expo jest @types/jest -- --save-dev || goto :erro
call npm install -D prettier || goto :erro

echo.
echo [5/5] Conferindo versoes com o SDK...
call npx expo install --fix

echo.
echo ============================================================
echo  Pronto! Proximo passo: 2-configurar-banco.bat
echo ============================================================
pause
exit /b 0

:erro
echo.
echo *** Algo deu errado na instalacao. Leia a mensagem acima. ***
echo Dica: confira a internet e rode este arquivo de novo.
pause
exit /b 1
