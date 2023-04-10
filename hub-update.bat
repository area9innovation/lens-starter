@echo off

set baseDir=%~dp0
set srcDir=%baseDir%\dist
set hubDir=%baseDir%\..\jbjs\hub\www\pages\elensreader\
set hubDir2=%baseDir%\..\jbjshub\www2\pages\elensreader\

echo Copy from lens-starter to hub
echo.
echo Copy to /www
echo.
call xcopy /f/y %srcDir%\lens.js %hubDir%
call xcopy /f/y %srcDir%\lens.worker.js %hubDir%
call xcopy /f/y %srcDir%\lens.css %hubDir%
echo.
echo Copy to /www2
echo.
call xcopy /f/y %srcDir%\lens.js %hubDir2%
call xcopy /f/y %srcDir%\lens.worker.js %hubDir2%
call xcopy /f/y %srcDir%\lens.css %hubDir2%
echo.
echo Done
echo.

pause
