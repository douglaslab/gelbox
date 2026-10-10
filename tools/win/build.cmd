@echo off
rem Configure and build Gelbox for Windows. Usage: build.cmd [Release|Debug]
setlocal
set "CONFIG=%~1"
if "%CONFIG%"=="" set CONFIG=Release
set "ROOT=%~dp0..\.."
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul || exit /b 1
cmake -S "%ROOT%\proj\cmake" -B "%ROOT%\build-win-%CONFIG%" -G Ninja -DCMAKE_BUILD_TYPE=%CONFIG% || exit /b 1
cmake --build "%ROOT%\build-win-%CONFIG%" || exit /b 1
dir "%ROOT%\build-win-%CONFIG%\Gelbox.exe" || exit /b 1
endlocal
