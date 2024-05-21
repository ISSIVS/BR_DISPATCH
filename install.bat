@echo off
set "mypath=%cd%"

REM Optionally change directory to BR_GEA if necessary
REM cd BR_GEA

call create_db.bat

SET F="deamon"
IF EXIST %F% (
    RMDIR %F%
)

node.exe install.js
node.exe register.js

echo Install successful. 
pause
