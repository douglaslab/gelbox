; Built by tools\win\package.cmd.
#ifndef AppVersion
  #define AppVersion "1.1"
#endif
#ifndef BuildDir
  #define BuildDir "..\..\build-win-Release"
#endif

[Setup]
AppId={{B5D5E1A4-6C2E-4C2B-9A2B-5F0B3B4E1D01}
AppName=Gelbox
AppVersion={#AppVersion}
AppPublisher=Douglas Lab, UCSF
AppPublisherURL=https://douglaslab.org/gelbox/
DefaultDirName={autopf}\Gelbox
DefaultGroupName=Gelbox
UninstallDisplayIcon={app}\Gelbox.exe
OutputDir=..\..\dist
OutputBaseFilename=Gelbox-Setup-{#AppVersion}
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
SetupIconFile=..\cmake\Gelbox.ico
PrivilegesRequiredOverridesAllowed=dialog

[Files]
Source: "{#BuildDir}\Gelbox.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#BuildDir}\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#BuildDir}\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Gelbox"; Filename: "{app}\Gelbox.exe"
Name: "{autodesktop}\Gelbox"; Filename: "{app}\Gelbox.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; Flags: unchecked

[Run]
Filename: "{app}\Gelbox.exe"; Description: "Launch Gelbox"; Flags: nowait postinstall skipifsilent
