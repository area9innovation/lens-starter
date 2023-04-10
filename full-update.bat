@echo off

echo Clean up
echo.

if exist "node_modules" (
	echo Remove node_modules
	echo.
	rmdir /s /q node_modules
	echo.
)

if exist "package-lock.json" (
	echo Remove package-lock.json
	echo.
	del /f /q package-lock.json
	echo.
)

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
