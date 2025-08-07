@echo off
cls
echo.
echo ============================================
echo    MANIFEST ENGINE - GITHUB SETUP
echo ============================================
echo.

:: Check if git is initialized
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git branch -M main
    echo ✓ Git repository initialized
) else (
    echo ✓ Git repository already initialized
)

echo.
echo Creating initial commit...
echo ==========================

:: Add all files
git add .

:: Create commit
git commit -m "🚀 Initial commit - Manifest Engine v1.3

- Complete AI-powered video processing platform
- Frontend: React with Material-UI
- Backend: Node.js/Express
- AI Engine: Python FastAPI with Whisper, CLIP
- Docker deployment ready
- One-click installation scripts
- Full documentation

Create Anything. Manifest Everything."

echo.
echo ✓ Initial commit created
echo.

:: Get GitHub username
set /p GITHUB_USERNAME="Enter your GitHub username: "

:: Get repository name
set /p REPO_NAME="Enter repository name (default: manifest-engine): "
if "%REPO_NAME%"=="" set REPO_NAME=manifest-engine

echo.
echo Setting up GitHub remote...
echo ===========================

:: Add remote origin
git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
echo ✓ Remote origin added

echo.
echo ============================================
echo    READY TO PUSH TO GITHUB
echo ============================================
echo.
echo Next steps:
echo.
echo 1. Create a new repository on GitHub:
echo    https://github.com/new
echo.
echo    Repository name: %REPO_NAME%
echo    Description: AI-powered content creation platform
echo    Public repository: Yes
echo    Initialize: No (don't add README, .gitignore, or license)
echo.
echo 2. After creating the repository, run:
echo    git push -u origin main
echo.
echo 3. To push future updates:
echo    git add .
echo    git commit -m "Your commit message"
echo    git push
echo.
echo ============================================
echo.

set /p PUSH_NOW="Repository created? Push now? (y/n): "
if /i "%PUSH_NOW%"=="y" (
    echo.
    echo Pushing to GitHub...
    git push -u origin main
    echo.
    echo ✓ Successfully pushed to GitHub!
    echo.
    echo Your repository: https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
    echo.
)

pause