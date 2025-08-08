@echo off
cls
echo.
echo ============================================
echo    MANIFEST ENGINE v1.3 - PRODUCTION BUILD
echo ============================================
echo.

:: Create build directory
if exist "build" rmdir /s /q "build"
mkdir build
mkdir build\manifest-engine
mkdir build\manifest-engine\src
mkdir build\manifest-engine\data
mkdir build\manifest-engine\data\uploads
mkdir build\manifest-engine\data\clips
mkdir build\manifest-engine\data\processed

echo [1/6] Copying core files...
echo ============================
:: Copy backend
xcopy /E /I /Y "src\backend" "build\manifest-engine\src\backend" >nul
:: Copy AI engine
xcopy /E /I /Y "src\ai-engine" "build\manifest-engine\src\ai-engine" >nul
:: Remove venv from AI engine (will be recreated on install)
if exist "build\manifest-engine\src\ai-engine\venv" rmdir /s /q "build\manifest-engine\src\ai-engine\venv"

echo [2/6] Cleaning unnecessary files...
echo ===================================
:: Remove node_modules (will be installed fresh)
if exist "build\manifest-engine\src\backend\node_modules" rmdir /s /q "build\manifest-engine\src\backend\node_modules"
:: Remove test files
del /q "build\manifest-engine\src\backend\*.test.js" 2>nul
:: Remove Docker files (not needed for desktop)
del /q "build\manifest-engine\src\backend\Dockerfile" 2>nul

echo [3/6] Creating launcher script...
echo =================================
(
echo @echo off
echo title Manifest Engine v1.3
echo cd /d "%%~dp0"
echo.
echo echo Starting Manifest Engine...
echo.
echo :: Start Backend
echo start /B cmd /c "cd src\backend && node server.js"
echo.
echo :: Wait for backend to start
echo timeout /t 3 /nobreak ^>nul
echo.
echo :: Start AI Engine
echo start /B cmd /c "cd src\ai-engine && call venv\Scripts\activate && python main.py"
echo.
echo :: Wait for services
echo timeout /t 5 /nobreak ^>nul
echo.
echo :: Open browser
echo start http://localhost:3001
echo.
echo echo.
echo echo ============================================
echo echo    MANIFEST ENGINE IS RUNNING!
echo echo ============================================
echo echo.
echo echo    Close this window to stop all services
echo echo ============================================
echo echo.
echo :: Keep window open
echo pause ^>nul
) > "build\manifest-engine\ManifestEngine.bat"

echo [4/6] Creating environment configuration...
echo ===========================================
(
echo NODE_ENV=production
echo PORT=3001
echo MONGODB_URI=mongodb://localhost:27017/manifest-engine
echo JWT_SECRET=manifest-engine-secret-key-%RANDOM%%RANDOM%
echo AI_ENGINE_URL=http://localhost:8000
) > "build\manifest-engine\.env"

echo [5/6] Creating installer configuration...
echo =========================================
:: This will be used by Inno Setup
(
echo ; Manifest Engine v1.3 Installer Configuration
echo [Setup]
echo AppName=Manifest Engine
echo AppVersion=1.3.0
echo AppPublisher=CB-PORTAL
echo AppPublisherURL=https://github.com/CB-PORTAL/manifest-engine-v1.3
echo DefaultDirName={autopf}\ManifestEngine
echo DefaultGroupName=Manifest Engine
echo OutputDir=..\dist
echo OutputBaseFilename=ManifestEngine-v1.3-Setup
echo Compression=lzma2
echo SolidCompression=yes
echo SetupIconFile=icon.ico
echo WizardStyle=modern
echo DisableDirPage=no
echo DisableProgramGroupPage=yes
) > "build\installer-config.iss"

echo [6/6] Build complete!
echo ====================
echo.
echo Build directory created at: build\manifest-engine
echo.
echo Next step: Run create-installer.bat to generate the .exe
echo.
pause