@echo off
cls
echo.
echo ============================================
echo    MANIFEST ENGINE - SYSTEM VERIFICATION
echo ============================================
echo.

set ERRORS=0

echo Checking prerequisites...
echo =========================

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js installed
) else (
    echo ✗ Node.js not found
    set /a ERRORS+=1
)

:: Check Python
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Python installed
) else (
    echo ✗ Python not found
    set /a ERRORS+=1
)

:: Check FFmpeg
ffmpeg -version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ FFmpeg installed
) else (
    echo ✗ FFmpeg not found
    set /a ERRORS+=1
)

:: Check Git
git --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Git installed
) else (
    echo ✗ Git not found
    set /a ERRORS+=1
)

echo.
echo Checking project structure...
echo =============================

:: Check directories
if exist "src\backend" (
    echo ✓ Backend directory exists
) else (
    echo ✗ Backend directory missing
    set /a ERRORS+=1
)

if exist "src\frontend" (
    echo ✓ Frontend directory exists
) else (
    echo ✗ Frontend directory missing
    set /a ERRORS+=1
)

if exist "src\ai-engine" (
    echo ✓ AI Engine directory exists
) else (
    echo ✗ AI Engine directory missing
    set /a ERRORS+=1
)

if exist "data" (
    echo ✓ Data directory exists
) else (
    echo ✗ Data directory missing
    set /a ERRORS+=1
)

echo.
echo Checking dependencies...
echo ========================

:: Check Node modules
if exist "node_modules" (
    echo ✓ Root dependencies installed
) else (
    echo ✗ Root dependencies not installed
    set /a ERRORS+=1
)

if exist "src\backend\node_modules" (
    echo ✓ Backend dependencies installed
) else (
    echo ✗ Backend dependencies not installed
    set /a ERRORS+=1
)

if exist "src\frontend\node_modules" (
    echo ✓ Frontend dependencies installed
) else (
    echo ✗ Frontend dependencies not installed
    set /a ERRORS+=1
)

if exist "src\ai-engine\venv" (
    echo ✓ Python virtual environment exists
) else (
    echo ✗ Python virtual environment missing
    set /a ERRORS+=1
)

echo.
echo Checking configuration files...
echo ===============================

if exist ".env" (
    echo ✓ Environment configuration exists
) else (
    echo ✗ Environment configuration missing
    set /a ERRORS+=1
)

if exist "package.json" (
    echo ✓ Package.json exists
) else (
    echo ✗ Package.json missing
    set /a ERRORS+=1
)

if exist "README.md" (
    echo ✓ README.md exists
) else (
    echo ✗ README.md missing
    set /a ERRORS+=1
)

echo.
echo Testing service connectivity...
echo ================================

:: Test Backend
curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Backend API is running
) else (
    echo ⚠ Backend API not responding (may not be started)
)

:: Test AI Engine
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ AI Engine is running
) else (
    echo ⚠ AI Engine not responding (may not be started)
)

:: Test Frontend
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Frontend is running
) else (
    echo ⚠ Frontend not responding (may not be started)
)

echo.
echo ============================================
echo    VERIFICATION COMPLETE
echo ============================================
echo.

if %ERRORS% equ 0 (
    echo Status: ✓ READY TO RUN
    echo.
    echo Run 'start.bat' to launch Manifest Engine
) else (
    echo Status: ✗ ISSUES FOUND
    echo.
    echo Found %ERRORS% issues that need to be fixed.
    echo Run 'scripts\install.bat' to fix missing dependencies.
)

echo.
echo ============================================
echo.
pause