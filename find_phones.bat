@echo off
setlocal enabledelayedexpansion

set SERVER=localhost\PZSQLSERVER
set DB=PZ
set USER=readonly_user
set PASS=U07cef1s9Tkc61rfYyA0BEZ43tdNyS

set LOGFILE=find_phones_output.txt
echo [Начат анализ таблиц на наличие телефонов] > %LOGFILE%
set TABLES=OwnPhones ConvertedPhones CommunicationComments AdChannelPhones Persons Patients OnlineTickets Persons_History

for %%T in (%TABLES%) do (
  echo ==== Проверка таблицы %%T ==== >> %LOGFILE%
  sqlcmd -S %SERVER% -U %USER% -P %PASS% -d %DB% -Q "SET NOCOUNT ON; SELECT TOP 5 * FROM %%T WHERE Phone IS NOT NULL" -W -s "	" > tmp_phones.txt 2>nul

  findstr /R /C:"." tmp_phones.txt >nul
  if !errorlevel! == 0 (
    echo ✅ Найдены непустые записи в %%T >> %LOGFILE%
    type tmp_phones.txt >> %LOGFILE%
  ) else (
    echo ⛔ Нет непустых записей или поле Phone отсутствует >> %LOGFILE%
  )
  echo. >> %LOGFILE%
)

del tmp_phones.txt >nul 2>nul
echo [Анализ завершён. Смотри файл %LOGFILE%] >> %LOGFILE%

notepad %LOGFILE%
endlocal