@echo off
rem Build and package the unsigned Windows release. Usage: package.cmd [version]
setlocal
set "VERSION=%~1"
if "%VERSION%"=="" set "VERSION=1.1"
set "ROOT=%~dp0..\.."
set "ISCC=C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" set "ISCC=%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" (
  echo Install Inno Setup 6 with winget install --id JRSoftware.InnoSetup --exact
  exit /b 1
)
call "%~dp0build.cmd" Release || exit /b 1
"%ISCC%" "/DAppVersion=%VERSION%" "/DBuildDir=%ROOT%\build-win-Release" "%ROOT%\proj\win\Gelbox.iss" || exit /b 1
dir "%ROOT%\dist\Gelbox-Setup-%VERSION%.exe" || exit /b 1
endlocal
