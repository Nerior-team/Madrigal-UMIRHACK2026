#define MyAppName "Predict MV Daemon"
#define MyAppPublisher "Predict MV"

#ifndef SourceDir
  #error SourceDir define is required
#endif

#ifndef OutputDir
  #error OutputDir define is required
#endif

#ifndef AppVersion
  #define AppVersion "0.1.0"
#endif

[Setup]
AppId={{C6C6E7A5-1F43-4A8B-8DB4-99F7D4A64A10}
AppName={#MyAppName}
AppVersion={#AppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Predict MV\Daemon
DefaultGroupName=Predict MV
DisableProgramGroupPage=yes
OutputDir={#OutputDir}
OutputBaseFilename=PredictMVDaemonSetup
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
WizardStyle=modern
UninstallDisplayIcon={app}\predict-mv-daemon.exe

[Dirs]
Name: "{commonappdata}\PredictMV"
Name: "{commonappdata}\PredictMV\logs"

[Files]
Source: "{#SourceDir}\predict-mv-daemon.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\predict-mv-daemon-cli.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\PredictMVService.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\PredictMVService.xml"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Predict MV Daemon CLI"; Filename: "{app}\predict-mv-daemon-cli.exe"

[Run]
Filename: "{app}\PredictMVService.exe"; Parameters: "install"; Flags: runhidden waituntilterminated
Filename: "{app}\PredictMVService.exe"; Parameters: "start"; Flags: runhidden waituntilterminated

[UninstallRun]
Filename: "{app}\PredictMVService.exe"; Parameters: "stop"; Flags: runhidden waituntilterminated skipifdoesntexist; RunOnceId: "PredictMVServiceStop"
Filename: "{app}\PredictMVService.exe"; Parameters: "uninstall"; Flags: runhidden waituntilterminated skipifdoesntexist; RunOnceId: "PredictMVServiceUninstall"

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
  ExistingServiceExe: String;
begin
  ExistingServiceExe := ExpandConstant('{app}\PredictMVService.exe');
  if FileExists(ExistingServiceExe) then
  begin
    Exec(ExistingServiceExe, 'stop', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec(ExistingServiceExe, 'uninstall', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
  Result := '';
end;
