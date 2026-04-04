#define MyAppName "PredictMV"
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
DefaultGroupName=PredictMV
DisableProgramGroupPage=yes
OutputDir={#OutputDir}
OutputBaseFilename=PredictMVDaemonSetup
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
WizardStyle=modern
UninstallDisplayIcon={app}\PredictMV.exe
ChangesEnvironment=yes
SetupIconFile={#SourceDir}\logo.ico

[Dirs]
Name: "{commonappdata}\PredictMV"
Name: "{commonappdata}\PredictMV\logs"

[Files]
Source: "{#SourceDir}\PredictMV.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\predict.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\PredictMVService.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\PredictMVService.xml"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\logo.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Predict CLI"; Filename: "{app}\predict.exe"; IconFilename: "{app}\logo.ico"

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

function PathContainsItem(Paths: string; Item: string): Boolean;
var
  Search: string;
begin
  Search := ';' + Lowercase(Paths) + ';';
  Result := Pos(';' + Lowercase(Item) + ';', Search) > 0;
end;

procedure AddAppToSystemPath();
var
  Paths: string;
  NewPaths: string;
begin
  if not RegQueryStringValue(HKLM, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', Paths) then
    Paths := '';

  if PathContainsItem(Paths, ExpandConstant('{app}')) then
    exit;

  if Paths = '' then
    NewPaths := ExpandConstant('{app}')
  else
    NewPaths := Paths + ';' + ExpandConstant('{app}');

  RegWriteExpandStringValue(
    HKLM,
    'SYSTEM\CurrentControlSet\Control\Session Manager\Environment',
    'Path',
    NewPaths
  );
end;

procedure RemoveAppFromSystemPath();
var
  Paths: string;
  RemainingPaths: string;
  Item: string;
  NewPaths: string;
  SeparatorPos: Integer;
begin
  if not RegQueryStringValue(HKLM, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', 'Path', Paths) then
    exit;

  RemainingPaths := Paths;
  NewPaths := '';
  while RemainingPaths <> '' do
  begin
    SeparatorPos := Pos(';', RemainingPaths);
    if SeparatorPos > 0 then
    begin
      Item := Trim(Copy(RemainingPaths, 1, SeparatorPos - 1));
      Delete(RemainingPaths, 1, SeparatorPos);
    end
    else
    begin
      Item := Trim(RemainingPaths);
      RemainingPaths := '';
    end;

    if (Item = '') or (CompareText(Item, ExpandConstant('{app}')) = 0) then
      continue;

    if NewPaths = '' then
      NewPaths := Item
    else
      NewPaths := NewPaths + ';' + Item;
  end;

  RegWriteExpandStringValue(
    HKLM,
    'SYSTEM\CurrentControlSet\Control\Session Manager\Environment',
    'Path',
    NewPaths
  );
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
    AddAppToSystemPath();
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
    RemoveAppFromSystemPath();
end;
