@echo off
cd /d %~dp0

echo [1/2] Получаем данные из базы...
sqlcmd -S localhost\PZSQLSERVER -U readonly_user -P U07cef1s9Tkc61rfYyA0BEZ43tdNyS -d PZ -Q "SET NOCOUNT ON; SELECT DISTINCT per.SurName, per.Name, per.Patronymic, per.ID FROM PaymentsIn p LEFT JOIN Patients pat ON p.ID_Patients = pat.ID_Persons LEFT JOIN Persons per ON pat.ID_Persons = per.ID WHERE per.Phone IS NULL OR LTRIM(RTRIM(per.Phone)) = ''" -s "	" -W -o users_without_phone.tsv

echo [2/2] Преобразуем в JSON...
node parse_users_to_json.js