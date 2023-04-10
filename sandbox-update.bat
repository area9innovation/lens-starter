@echo off

set baseDir=%~dp0
set srcDir=%baseDir%\dist\
set sandboxDir=%baseDir%\..\jbjs\hub\www\sandbox\eLens\dist\
set sandbox2Dir=%baseDir%\..\jbjs\hub\www2\sandbox\eLens\dist\

echo Copy from lens-starter to sandbox
echo.
echo Clear sandbox
echo.
if exist %sandboxDir% (
   @RD /S /Q %sandboxDir%
)
if exist %sandbox2Dir% (
   @RD /S /Q %sandbox2Dir%
)
echo Copy files to \www\sandbox
echo.
call xcopy /e/q %srcDir% %sandboxDir%
echo.

echo Copy files to \www2\sandbox
echo.
call xcopy /e/q %srcDir% %sandbox2Dir%
echo.
echo Done
echo.
pause
