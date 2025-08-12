; Manifest Engine v1.3 Professional Installer
; Publisher: Meta Know Labs, LLC

#define MyAppName "Manifest Engine"
#define MyAppVersion "1.3.0"
#define MyAppPublisher "Meta Know Labs, LLC"
#define MyAppURL "https://manifestengine.me"

[Setup]
; Application Information
AppId={{CB-PORTAL-MANIFEST-ENGINE-V13}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/support
AppUpdatesURL={#MyAppURL}/updates

; Installation Settings
DefaultDirName={autopf}\ManifestEngine
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=dist
OutputBaseFilename=ManifestEngine-v1.3-Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
SetupIconFile=assets\icon.ico

; Privileges and Architecture
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

; Version Info
VersionInfoVersion=1.3.0
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription=AI-Powered Creation and Automation Platform
VersionInfoCopyright=© 2025 Meta Know Labs, LLC. All rights reserved.
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
BeveledLabel=Meta Know Labs, LLC

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Core Application Files
Source: "src\backend\*"; DestDir: "{app}\src\backend"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "src\ai-engine\*"; DestDir: "{app}\src\ai-engine"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "data\*"; DestDir: "{app}\data"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "assets\icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "install-dependencies.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "ManifestEngine.bat"; DestDir: "{app}"; Flags: ignoreversion

; Environment Configuration
Source: ".env"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\ManifestEngine.bat"; IconFilename: "{app}\icon.ico"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\ManifestEngine.bat"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Run]
; Install dependencies after file extraction - THIS IS THE KEY FIX!
Filename: "{app}\install-dependencies.bat"; StatusMsg: "Installing dependencies (this may take a few minutes)..."; Flags: runhidden waituntilterminated

; Launch application after installation
Filename: "{app}\ManifestEngine.bat"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
var
  ResultCode: Integer;

function InitializeSetup(): Boolean;
begin
  Result := True;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Set permissions for data directory
    Exec('icacls.exe', ExpandConstant('"{app}\data" /grant Everyone:F /T'), '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;