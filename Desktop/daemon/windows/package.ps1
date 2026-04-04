param(
    [string]$PlatformId = "windows-x64",
    [string]$WinSWVersion = "v2.12.0",
    [string]$WinSWSourcePath,
    [string]$CompilerPath,
    [switch]$SkipCompile,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$WindowsRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$DaemonRoot = Split-Path -Parent $WindowsRoot
$DistRoot = Join-Path $DaemonRoot "dist"
$ArtifactDir = Join-Path $DistRoot $PlatformId
$StageDir = Join-Path $ArtifactDir "windows-installer"
$DaemonBinary = Join-Path $ArtifactDir "predict-mv-daemon.exe"
$CliBinary = Join-Path $ArtifactDir "predict-mv-daemon-cli.exe"
$InstallerPath = Join-Path $ArtifactDir "PredictMVDaemonSetup.exe"
$ServiceXmlSource = Join-Path $WindowsRoot "service.xml"
$ServiceXmlTarget = Join-Path $StageDir "PredictMVService.xml"
$WinSWTargetPath = Join-Path $StageDir "PredictMVService.exe"
$WinSWUrl = "https://github.com/winsw/winsw/releases/download/$WinSWVersion/WinSW-x64.exe"
$InstallerScript = Join-Path $WindowsRoot "installer.iss"
$ManifestPath = Join-Path $ArtifactDir "manifest.json"
$AppVersion = "0.1.0"

if (Test-Path $ManifestPath) {
    $Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
    if ($Manifest.version) {
        $AppVersion = [string]$Manifest.version
    }
}

if ($DryRun) {
    [pscustomobject]@{
        platform_id = $PlatformId
        daemon_binary = $DaemonBinary
        cli_binary = $CliBinary
        winsw_url = $WinSWUrl
        winsw_source_override = $WinSWSourcePath
        stage_dir = $StageDir
        installer_output = $InstallerPath
        app_version = $AppVersion
    } | ConvertTo-Json -Depth 3
    exit 0
}

if (-not (Test-Path $DaemonBinary)) {
    throw "Missing daemon binary: $DaemonBinary"
}

if (-not (Test-Path $CliBinary)) {
    throw "Missing CLI binary: $CliBinary"
}

New-Item -ItemType Directory -Path $StageDir -Force | Out-Null
Copy-Item $DaemonBinary (Join-Path $StageDir "predict-mv-daemon.exe") -Force
Copy-Item $CliBinary (Join-Path $StageDir "predict-mv-daemon-cli.exe") -Force
Copy-Item $ServiceXmlSource $ServiceXmlTarget -Force

if ($WinSWSourcePath) {
    if (-not (Test-Path $WinSWSourcePath)) {
        throw "Provided WinSWSourcePath does not exist: $WinSWSourcePath"
    }
    $ResolvedSource = (Resolve-Path $WinSWSourcePath).Path
    if ($ResolvedSource -ne $WinSWTargetPath) {
        Copy-Item $WinSWSourcePath $WinSWTargetPath -Force
    }
} else {
    & curl.exe -fsSL --retry 3 --retry-delay 2 $WinSWUrl -o $WinSWTargetPath
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $WinSWTargetPath)) {
        throw "Failed to download WinSW from $WinSWUrl"
    }
}

if ($SkipCompile) {
    Write-Output "Staged Windows installer files in $StageDir"
    Write-Output "Expected output: $InstallerPath"
    exit 0
}

$CompilerCandidates = @()
$PossibleCompilerPaths = @(
    $CompilerPath,
    $env:ISCC_PATH,
    (Join-Path ${env:ProgramFiles(x86)} "Inno Setup 6\ISCC.exe"),
    (Join-Path $env:ProgramFiles "Inno Setup 6\ISCC.exe")
)

foreach ($Candidate in $PossibleCompilerPaths) {
    if ($Candidate -and (Test-Path $Candidate)) {
        $CompilerCandidates += $Candidate
    }
}

if (-not $CompilerCandidates) {
    throw "ISCC.exe not found. Install Inno Setup 6 or set ISCC_PATH."
}

$Compiler = $CompilerCandidates[0]
& $Compiler "/DSourceDir=$StageDir" "/DOutputDir=$ArtifactDir" "/DAppVersion=$AppVersion" $InstallerScript
Write-Output "Created $InstallerPath"
