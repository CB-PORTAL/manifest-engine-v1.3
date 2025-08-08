@echo off
cls
echo.
echo ================================================
echo    COMPILING MANIFEST ENGINE INSTALLER
echo ================================================
echo.

:: Check if Inno Setup is installed
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
) else if exist "tools\InnoSetup\ISCC.exe" (
    set ISCC="tools\InnoSetup\ISCC.exe"
) else (
    echo ERROR: Inno Setup not found!
    echo.
    echo Please install Inno Setup from:
    echo https://jrsoftware.org/isdl.php
    echo.
    echo Or run create-installer.bat first
    pause
    exit /b 1
)

echo Found Inno Setup at: %ISCC%
echo.

:: Create output directory
if not exist "dist" mkdir dist

echo Compiling installer...
echo ======================
%ISCC% /Q "build\manifest-installer.iss"

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo    ✅ INSTALLER CREATED SUCCESSFULLY!
    echo ================================================
    echo.
    echo Output: dist\ManifestEngine-v1.3-Setup.exe
    echo Size: ~45 MB
    echo.
    echo This installer includes:
    echo - Manifest Engine application
    echo - Automatic Python installation
    echo - Automatic Node.js installation
    echo - FFmpeg bundled
    echo - All dependencies
    echo - Desktop shortcut
    echo - Uninstaller
    echo.
    echo Ready to upload to GitHub!
    echo.
) else (
    echo.
    echo ❌ Compilation failed!
    echo Please check the error messages above.
    echo.
)

pause