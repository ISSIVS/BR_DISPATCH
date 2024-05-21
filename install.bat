@echo off
set mypath= "%cd%
cd %mypath%
cd BR_GEA
call create_db.bat
SET F="deamon"
IF EXIST %F% RMDIR  %F%
node.exe install.js
node.exe register.js
echo Install successfull. 
pause