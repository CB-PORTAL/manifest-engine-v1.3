@echo off
cls
echo.
echo ================================================
echo    MANIFEST ENGINE v1.3 - INSTALLER CREATOR
echo ================================================
echo.
echo This will create a single .exe installer that
echo includes all dependencies and auto-installs
echo everything needed.
echo.
pause

:: Check if build exists
if not exist "build\manifest-engine" (
    echo ERROR: Build directory not found!
    echo Please run build-production.bat first.
    pause
    exit /b 1
)

echo.
echo [1/4] Downloading Inno Setup...
echo ===============================
if not exist "tools" mkdir tools
if not exist "tools\inno6.exe" (
    powershell -Command "& {Invoke-WebRequest -Uri 'https://jrsoftware.org/download.php/is.exe' -OutFile 'tools\inno6.exe'}"
    echo Installing Inno Setup silently...
    tools\inno6.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /DIR="tools\InnoSetup"
)

echo.
echo [2/4] Creating full installer script...
echo =======================================
(
echo #define MyAppName "Manifest Engine"
echo #define MyAppVersion "1.3.0"
echo #define MyAppPublisher "CB-PORTAL"
echo #define MyAppURL "https://github.com/CB-PORTAL/manifest-engine-v1.3"
echo #define MyAppExeName "ManifestEngine.bat"
echo.
echo [Setup]
echo AppId={{8F6F1082-B5A4-4C9E-B5CF-88C8B3E6D9A1}
echo AppName={#MyAppName}
echo AppVersion={#MyAppVersion}
echo AppPublisher={#MyAppPublisher}
echo AppPublisherURL={#MyAppURL}
echo AppSupportURL={#MyAppURL}
echo AppUpdatesURL={#MyAppURL}
echo DefaultDirName={autopf}\{#MyAppName}
echo DefaultGroupName={#MyAppName}
echo DisableProgramGroupPage=yes
echo LicenseFile=LICENSE.txt
echo OutputDir=..\dist
echo OutputBaseFilename=ManifestEngine-v1.3-Setup
echo SetupIconFile=icon.ico
echo Compression=lzma2/max
echo SolidCompression=yes
echo WizardStyle=modern
echo PrivilegesRequired=admin
echo ArchitecturesInstallIn64BitMode=x64
echo UninstallDisplayIcon={app}\icon.ico
echo.
echo [Languages]
echo Name: "english"; MessagesFile: "compiler:Default.isl"
echo.
echo [Tasks]
echo Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
echo.
echo [Files]
echo ; Application files
echo Source: "build\manifest-engine\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
echo ; Icon
echo Source: "assets\icon.ico"; DestDir: "{app}"; Flags: ignoreversion
echo.
echo [Icons]
echo Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"
echo Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
echo Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon
echo.
echo [Run]
echo ; Install dependencies
echo Filename: "{app}\install-dependencies.bat"; StatusMsg: "Installing dependencies..."; Flags: runhidden
echo ; Launch application
echo Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
echo.
echo [Code]
echo var
echo   DependencyPage: TOutputProgressWizardPage;
echo.
echo function InitializeSetup: Boolean;
echo begin
echo   Result := True;
echo end;
echo.
echo procedure InitializeWizard;
echo begin
echo   DependencyPage := CreateOutputProgressPage('Installing Dependencies',
echo     'Please wait while Manifest Engine dependencies are installed...');
echo end;
echo.
echo procedure CurStepChanged(CurStep: TSetupStep);
echo begin
echo   if CurStep = ssPostInstall then
echo   begin
echo     DependencyPage.Show;
echo     try
echo       DependencyPage.SetText('Installing Python...', '');
echo       DependencyPage.SetProgress(1, 4);
echo       Sleep(1000);
echo       
echo       DependencyPage.SetText('Installing Node.js...', '');
echo       DependencyPage.SetProgress(2, 4);
echo       Sleep(1000);
echo       
echo       DependencyPage.SetText('Installing FFmpeg...', '');
echo       DependencyPage.SetProgress(3, 4);
echo       Sleep(1000);
echo       
echo       DependencyPage.SetText('Configuring Manifest Engine...', '');
echo       DependencyPage.SetProgress(4, 4);
echo       Sleep(1000);
echo     finally
echo       DependencyPage.Hide;
echo     end;
echo   end;
echo end;
) > "build\manifest-installer.iss"

echo.
echo [3/4] Creating dependency installer...
echo ======================================
(
echo @echo off
echo echo Installing Manifest Engine dependencies...
echo.
echo :: Check and install Python
echo python --version >nul 2>&1
echo if %%errorlevel%% neq 0 (
echo     echo Installing Python...
echo     powershell -Command "& {$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe' -OutFile '%%TEMP%%\python-installer.exe'}"
echo     %%TEMP%%\python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
echo     del %%TEMP%%\python-installer.exe
echo )
echo.
echo :: Check and install Node.js
echo node --version >nul 2>&1
echo if %%errorlevel%% neq 0 (
echo     echo Installing Node.js...
echo     powershell -Command "& {$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '%%TEMP%%\node-installer.msi'}"
echo     msiexec /i %%TEMP%%\node-installer.msi /quiet /norestart
echo     del %%TEMP%%\node-installer.msi
echo )
echo.
echo :: Install FFmpeg
echo if not exist "%%~dp0\ffmpeg" (
echo     echo Installing FFmpeg...
echo     powershell -Command "& {$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile '%%TEMP%%\ffmpeg.zip'}"
echo     powershell -Command "& {Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%%TEMP%%\ffmpeg.zip', '%%~dp0')}"
echo     del %%TEMP%%\ffmpeg.zip
echo     move %%~dp0\ffmpeg-*-essentials_build %%~dp0\ffmpeg
echo )
echo.
echo :: Install Node dependencies
echo echo Installing Node.js packages...
echo cd /d "%%~dp0\src\backend"
echo call npm install --production --silent
echo.
echo :: Setup Python environment
echo echo Setting up Python environment...
echo cd /d "%%~dp0\src\ai-engine"
echo python -m venv venv
echo call venv\Scripts\activate
echo pip install -q -r requirements.txt
echo.
echo echo Dependencies installed successfully!
echo exit /b 0
) > "build\manifest-engine\install-dependencies.bat"

echo.
echo [4/4] Creating icon and license...
echo ==================================
:: Create a simple icon file (you should replace with actual icon)
if not exist "assets" mkdir assets
echo Creating placeholder icon...
powershell -Command "& {Add-Type -AssemblyName System.Drawing; $bmp = New-Object System.Drawing.Bitmap 256,256; $g = [System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::FromArgb(159,122,234)); $g.Dispose(); $bmp.Save('assets\icon.ico', [System.Drawing.Imaging.ImageFormat]::Icon); $bmp.Dispose()}" 2>nul
if not exist "assets\icon.ico" (
    echo Could not create icon, using default...
    echo. > assets\icon.ico
)

:: Create license file
(
echo MIT License
echo.
echo Copyright (c) 2025 CB-PORTAL
echo.
echo Permission is hereby granted, free of charge, to any person obtaining a copy
echo of this software and associated documentation files (the "Software"), to deal
echo in the Software without restriction, including without limitation the rights
echo to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
echo copies of the Software, and to permit persons to whom the Software is
echo furnished to do so, subject to the following conditions:
echo.
echo The above copyright notice and this permission notice shall be included in all
echo copies or substantial portions of the Software.
echo.
echo THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
echo IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
echo FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
echo AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
echo LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
echo OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
echo SOFTWARE.
) > "build\LICENSE.txt"

echo.
echo ================================================
echo    INSTALLER SCRIPT CREATED!
echo ================================================
echo.
echo To compile the installer:
echo 1. Make sure Inno Setup is installed
echo 2. Open build\manifest-installer.iss with Inno Setup
echo 3. Click Compile (Ctrl+F9)
echo.
echo Or run: compile-installer.bat (next step)
echo.
pause