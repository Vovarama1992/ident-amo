@echo off
cd /d %~dp0

echo === Шаг 1: Экспорт из MSSQL ===
call export.bat
if %ERRORLEVEL% NEQ 0 (
  echo Ошибка при экспорте из MSSQL
  pause
  exit /b
)

echo.
echo === Шаг 2: Генерация diff.json ===
node parse_and_diff.js
if %ERRORLEVEL% NEQ 0 (
  echo Ошибка при генерации diff.json
  pause
  exit /b
)

echo.
echo === Шаг 3: Отправка в AmoCRM ===
node send_diff_to_amo.js
if %ERRORLEVEL% NEQ 0 (
  echo Ошибка при отправке в AmoCRM
  pause
  exit /b
)

echo.
echo ✅ Завершено
pause