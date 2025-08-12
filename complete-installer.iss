; Manifest Engine v1.3 - Complete Professional Installer
; With DevLog Portal Integration

#define MyAppName "Manifest Engine"
#define MyAppVersion "1.3.0"
#define MyAppPublisher "Meta Know Labs, LLC"
#define MyAppURL "https://manifestengine.me"

[Setup]
AppId={{MANIFEST-ENGINE-METAKNOW-V13}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}

DefaultDirName={autopf}\ManifestEngine
DefaultGroupName={#MyAppName}
OutputDir=dist
OutputBaseFilename=ManifestEngine-v1.3-Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

; This shows Meta Know Labs, LLC
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=AI-Powered Creation Platform with DevLog Portal
VersionInfoCopyright=© 2025 Meta Know Labs, LLC
VersionInfoProductName={#MyAppName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create desktop shortcut"

[Files]
; Copy ALL source files
Source: "src\*"; DestDir: "{app}\src"; Flags: ignoreversion recursesubdirs
Source: "data\*"; DestDir: "{app}\data"; Flags: ignoreversion recursesubdirs
Source: ".env"; DestDir: "{app}"; Flags: ignoreversion
Source: "package.json"; DestDir: "{app}"; Flags: ignoreversion

; Create the launcher
Source: "launcher.exe"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
Name: "{app}\data\uploads"
Name: "{app}\data\clips"
Name: "{app}\data\processed"

[Icons]
Name: "{commondesktop}\Manifest Engine"; Filename: "{app}\launcher.exe"; Tasks: desktopicon

[Run]
; Install Node.js if needed
Filename: "powershell"; Parameters: "-Command ""if (!(Get-Command node -ErrorAction SilentlyContinue)) {{ Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '$env:TEMP\node.msi'; Start-Process msiexec -ArgumentList '/i', '$env:TEMP\node.msi', '/quiet' -Wait }}"""; StatusMsg: "Installing Node.js..."; Flags: runhidden

; Install Python if needed  
Filename: "powershell"; Parameters: "-Command ""if (!(Get-Command python -ErrorAction SilentlyContinue)) {{ Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe' -OutFile '$env:TEMP\python.exe'; Start-Process '$env:TEMP\python.exe' -ArgumentList '/quiet', 'InstallAllUsers=1', 'PrependPath=1' -Wait }}"""; StatusMsg: "Installing Python..."; Flags: runhidden

; Install Node dependencies
Filename: "cmd"; Parameters: "/c cd ""{app}\src\backend"" && npm install"; StatusMsg: "Installing backend dependencies..."; Flags: runhidden

; Setup Python environment
Filename: "cmd"; Parameters: "/c cd ""{app}\src\ai-engine"" && python -m venv venv && venv\Scripts\pip install fastapi uvicorn moviepy opencv-python-headless numpy"; StatusMsg: "Setting up AI engine..."; Flags: runhidden

; Launch app
Filename: "{app}\launcher.exe"; Description: "Launch Manifest Engine"; Flags: postinstall nowait