@echo off
cls
echo.
echo ============================================
echo    MANIFEST ENGINE v1.3 - INSTALLATION
echo    Create Anything. Manifest Everything.
echo ============================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo This script requires administrator privileges.
    echo Please run as Administrator.
    pause
    exit /b 1
)

:: Set colors
color 0D

echo [1/8] Checking system requirements...
echo =====================================

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Node.js not found. Installing Node.js...
    echo Please wait...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi' -OutFile 'node-installer.msi'}"
    msiexec /i node-installer.msi /quiet /norestart
    del node-installer.msi
    echo Node.js installed successfully!
) else (
    echo ✓ Node.js found
)

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Python not found. Installing Python...
    echo Please wait...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe' -OutFile 'python-installer.exe'}"
    python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
    del python-installer.exe
    echo Python installed successfully!
) else (
    echo ✓ Python found
)

:: Check FFmpeg
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo FFmpeg not found. Installing FFmpeg...
    echo Please wait...
    powershell -Command "& {
        Invoke-WebRequest -Uri 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip' -OutFile 'ffmpeg.zip'
        Expand-Archive -Path 'ffmpeg.zip' -DestinationPath 'C:\ffmpeg' -Force
        [Environment]::SetEnvironmentVariable('Path', $env:Path + ';C:\ffmpeg\ffmpeg-master-latest-win64-gpl\bin', [EnvironmentVariableTarget]::Machine)
    }"
    del ffmpeg.zip
    echo FFmpeg installed successfully!
) else (
    echo ✓ FFmpeg found
)

:: Check Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Git not found. Installing Git...
    echo Please wait...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/git-for-windows/git/releases/download/v2.41.0.windows.1/Git-2.41.0-64-bit.exe' -OutFile 'git-installer.exe'}"
    git-installer.exe /VERYSILENT /NORESTART
    del git-installer.exe
    echo Git installed successfully!
) else (
    echo ✓ Git found
)

echo.
echo [2/8] Creating project structure...
echo ===================================
if not exist "src" mkdir src
if not exist "src\backend" mkdir src\backend
if not exist "src\frontend" mkdir src\frontend
if not exist "src\ai-engine" mkdir src\ai-engine
if not exist "src\automation" mkdir src\automation
if not exist "data" mkdir data
if not exist "data\uploads" mkdir data\uploads
if not exist "data\processed" mkdir data\processed
if not exist "data\clips" mkdir data\clips
if not exist "logs" mkdir logs
echo ✓ Project structure created

echo.
echo [3/8] Installing Node.js dependencies...
echo ========================================
call npm install --silent
if %errorlevel% neq 0 (
    echo ✗ Failed to install Node dependencies
    pause
    exit /b 1
)
echo ✓ Node dependencies installed

echo.
echo [4/8] Setting up Backend...
echo ===========================
cd src\backend
call npm init -y --silent
call npm install express cors dotenv multer socket.io jsonwebtoken bcrypt mongoose --silent
call npm install -D nodemon --silent
cd ..\..
echo ✓ Backend configured

echo.
echo [5/8] Setting up Frontend...
echo ============================
cd src\frontend
call npx create-react-app . --template typescript --use-npm
call npm install @mui/material @emotion/react @emotion/styled @mui/icons-material --silent
call npm install axios react-router-dom react-dropzone react-player --silent
call npm install @reduxjs/toolkit react-redux --silent
cd ..\..
echo ✓ Frontend configured

echo.
echo [6/8] Setting up AI Engine...
echo =============================
cd src\ai-engine
python -m venv venv
call venv\Scripts\activate
pip install -q fastapi uvicorn python-multipart
pip install -q torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -q transformers whisper moviepy opencv-python
pip install -q celery redis
pip install -q numpy pandas scikit-learn
call venv\Scripts\deactivate
cd ..\..
echo ✓ AI Engine configured

echo.
echo [7/8] Creating environment configuration...
echo ===========================================
(
echo # Manifest Engine Configuration
echo NODE_ENV=development
echo PORT=3001
echo.
echo # Database
echo MONGODB_URI=mongodb://localhost:27017/manifest-engine
echo REDIS_URL=redis://localhost:6379
echo.
echo # API Keys
echo OPENAI_API_KEY=your_openai_key_here
echo YOUTUBE_API_KEY=your_youtube_key_here
echo TIKTOK_API_KEY=your_tiktok_key_here
echo.
echo # AWS S3 (Optional)
echo AWS_ACCESS_KEY_ID=your_aws_key
echo AWS_SECRET_ACCESS_KEY=your_aws_secret
echo AWS_BUCKET_NAME=manifest-engine-storage
echo.
echo # Security
echo JWT_SECRET=change_this_to_random_string_%random%%random%
echo ENCRYPTION_KEY=change_this_to_random_string_%random%%random%
echo.
echo # AI Engine
echo AI_ENGINE_URL=http://localhost:8000
echo MAX_VIDEO_SIZE_MB=2000
echo MAX_PROCESSING_TIME_MINUTES=30
) > .env
echo ✓ Environment configuration created

echo.
echo [8/8] Creating startup script...
echo ================================
(
echo @echo off
echo cls
echo echo Starting Manifest Engine v1.3...
echo echo.
echo start /B cmd /c "cd src\backend && npm start"
echo timeout /t 3 >nul
echo start /B cmd /c "cd src\frontend && npm start"
echo timeout /t 3 >nul
echo start /B cmd /c "cd src\ai-engine && venv\Scripts\activate && python main.py"
echo timeout /t 5 >nul
echo echo.
echo echo ============================================
echo echo    MANIFEST ENGINE IS RUNNING!
echo echo ============================================
echo echo.
echo echo    Frontend: http://localhost:3000
echo echo    Backend:  http://localhost:3001
echo echo    AI Engine: http://localhost:8000
echo echo.
echo echo    Press Ctrl+C to stop all services
echo echo ============================================
echo pause
) > start.bat
echo ✓ Startup script created

echo.
echo.
echo ============================================
echo    INSTALLATION COMPLETE!
echo ============================================
echo.
echo    Manifest Engine v1.3 has been installed
echo.
echo    To start the application:
echo    1. Run: start.bat
echo    2. Open: http://localhost:3000
echo.
echo    Documentation: docs/README.md
echo    Support: support@manifestengine.com
echo.
echo ============================================
echo.
pause