set mypath= "%cd%
cd %mypath%
cd BR_GEA
call create_db.bat
SET F="deamon"
IF EXIST %F% RMDIR  %F%
node install.js
node register.js
echo Install successfull. 
@echo off
pause