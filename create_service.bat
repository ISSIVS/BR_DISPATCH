@echo off
REM This batch file installs and configure the NSSM service

REM Set the service name
set SERVICE_NAME=securosgea

REM Set the service display name
set SERVICE_DISPLAY="SecurOS GEA Module"

REM Set the path to the Node.js executable
set NODE_PATH="C:\Program Files (x86)\ISS\BR_GEA\node.exe"

REM Set the application directory (where the script is located)
set APP_DIR="C:\Program Files (x86)\ISS\BR_GEA"

REM Set the path to the application script
set APP_SCRIPT="index.js"

REM Set the description of the service
set DESCRIPTION="Module to Manage SecurOS Events"

REM Registration of SecurOS events
node.exe register.js

REM Configuration and installation of the NSSM service

nssm install %SERVICE_NAME% %NODE_PATH% %APP_SCRIPT%
nssm set %SERVICE_NAME% AppDirectory %APP_DIR%
nssm set %SERVICE_NAME% Description %DESCRIPTION%
nssm set %SERVICE_NAME% DisplayName %SERVICE_DISPLAY%

REM Start the service
nssm start %SERVICE_NAME%

echo Installation of %SERVICE_NAME% complete.
pause
