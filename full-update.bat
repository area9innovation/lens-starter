@echo off

echo Remove node_modules
echo.
rmdir /s /q node_modules

echo Remove package-lock.json
echo.
del /f /q package-lock.json

echo.
echo Install modules
echo.
call npm i

echo.
echo GULP
echo.
call gulp

echo.
echo Completed
echo.
pause