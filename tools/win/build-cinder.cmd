@echo off
rem Build Cinder (static, x64) with Ninja under the VS 2022 Build Tools environment.
rem Usage: build-cinder.cmd [Release|Debug] [path\to\Cinder]
setlocal
set "CONFIG=%~1"
if "%CONFIG%"=="" set CONFIG=Release
set "CINDER=%~2"
if "%CINDER%"=="" set "CINDER=%~dp0..\..\..\Cinder"
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul || exit /b 1
cmake -S "%CINDER%" -B "%CINDER%\build\%CONFIG%" -G Ninja -DCMAKE_BUILD_TYPE=%CONFIG% || exit /b 1
cmake --build "%CINDER%\build\%CONFIG%" || exit /b 1
dir "%CINDER%\lib\msw\x64\%CONFIG%\v143\cinder.lib" || exit /b 1
dir "%CINDER%\lib\msw\x64\%CONFIG%\cinderConfig.cmake" || exit /b 1
endlocal
