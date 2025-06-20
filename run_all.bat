@echo off
cd /d %~dp0

echo === Шаг 1: Экспорт всех таблиц из MSSQL ===
node export_from_ident.js
if %ERRORLEVEL% NEQ 0 (
  echo ⚠️ Node-экспорт не сработал, пробуем export_from_ident.bat...
  call export_from_ident.bat
  if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка при выполнении резервного экспорта
    pause
    exit /b
  )
)

echo.
echo === Шаг 2: Генерация всех diff_<table>.json ===
node parse_and_diff.js
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Ошибка при генерации diff
  pause
  exit /b
)

echo.
echo === Шаг 3: Склейка diff-файлов в логические пайплайны ===
node merge_diff_to_logic/index.js
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Ошибка при склейке
  pause
  exit /b
)

echo.
echo === Шаг 4: Отправка данных в AmoCRM ===
node send_all_to_amo.js
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Ошибка при отправке в AmoCRM
  pause
  exit /b
)

echo.
echo ✅ Все шаги завершены
pause