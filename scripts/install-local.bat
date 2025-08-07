@echo off
cls
echo.
echo ============================================
echo    MANIFEST ENGINE v1.3 - LOCAL INSTALLATION
echo    No Admin Required!
echo ============================================
echo.

echo [1/6] Setting up Backend...
echo ===========================
cd src\backend
call npm init -y
call npm install express cors dotenv multer socket.io jsonwebtoken bcrypt mongoose
cd ..\..
echo Backend ready!

echo.
echo [2/6] Setting up Frontend...
echo ============================
cd src\frontend
call npm init -y
call npm install react react-dom @mui/material @emotion/react @emotion/styled
call npm install @mui/icons-material axios socket.io-client framer-motion
call npm install --save-dev @types/react @types/react-dom typescript
cd ..\..
echo Frontend ready!

echo.
echo [3/6] Setting up Python Environment...
echo ======================================
cd src\ai-engine
python -m venv venv
call venv\Scripts\activate
pip install fastapi uvicorn redis celery
pip install opencv-python moviepy numpy
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install transformers whisper
deactivate
cd ..\..
echo Python environment ready!

echo.
echo [4/6] Creating Environment File...
echo ==================================
(
echo NODE_ENV=development
echo PORT=3001
echo MONGODB_URI=mongodb://localhost:27017/manifest-engine
echo JWT_SECRET=manifest-engine-secret-key-change-in-production
echo AI_ENGINE_URL=http://localhost:8000
) > .env
echo Environment configured!

echo.
echo [5/6] Creating Start Script...
echo ==============================
(
echo @echo off
echo start /B cmd /c "cd src\backend && node server.js"
echo timeout /t 3
echo start /B cmd /c "cd src\ai-engine && venv\Scripts\activate && python main.py"
echo timeout /t 3
echo start http://localhost:3001
echo echo Manifest Engine is running!
echo pause
) > start-local.bat
echo Start script created!

echo.
echo [6/6] Installation Complete!
echo ============================
echo.
echo To start: run start-local.bat
echo.
pause