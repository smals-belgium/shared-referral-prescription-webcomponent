@echo off

REM You can double-click the .bat file, and it will:
REM
REM ==> Run your PowerShell script
REM ==> Show output
REM ==> Stay open so you can see errors
REM
REM ==> close by pressing enter in the window it opens

powershell -ExecutionPolicy Bypass -File "%~dp0pull-translations.ps1"
pause
