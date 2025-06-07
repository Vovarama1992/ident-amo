@echo off
cd /d %~dp0

chcp 1251 >nul
sqlcmd -S localhost\PZSQLSERVER -U readonly_user -P U07cef1s9Tkc61rfYyA0BEZ43tdNyS -d PZ ^
-Q "SET NOCOUNT ON; SELECT p.ID, p.DateTimePayment, p.Payment, per.Phone, per.SurName, per.Name FROM PaymentsIn p LEFT JOIN Patients pat ON p.ID_Patients = pat.ID_Persons LEFT JOIN Persons per ON pat.ID_Persons = per.ID" ^
-s "	" -W -o output.tsv