param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$DaemonRoot = Join-Path $RepoRoot "Desktop\daemon"
$DownloadsRoot = Join-Path $RepoRoot "server\downloads"
$WindowsSource = Join-Path $DaemonRoot "dist\windows-x64\PredictMVDaemonSetup.exe"
$LinuxArchiveSource = Join-Path $DaemonRoot "dist\linux-x64\predict-mv-daemon-linux-x64.tar.gz"
$LinuxInstallSource = Join-Path $DaemonRoot "linux\install.sh"
$LinuxUninstallSource = Join-Path $DaemonRoot "linux\uninstall.sh"
$WindowsTargetDir = Join-Path $DownloadsRoot "windows"
$LinuxTargetDir = Join-Path $DownloadsRoot "linux"

if ($DryRun) {
    [pscustomobject]@{
        windows_source = $WindowsSource
        linux_archive_source = $LinuxArchiveSource
        linux_install_source = $LinuxInstallSource
        linux_uninstall_source = $LinuxUninstallSource
        windows_target = (Join-Path $WindowsTargetDir "PredictMVDaemonSetup.exe")
        linux_archive_target = (Join-Path $LinuxTargetDir "predict-mv-daemon-linux-x64.tar.gz")
    } | ConvertTo-Json -Depth 3
    exit 0
}

$Required = @($WindowsSource, $LinuxArchiveSource, $LinuxInstallSource, $LinuxUninstallSource)
foreach ($PathValue in $Required) {
    if (-not (Test-Path $PathValue)) {
        throw "Missing source artifact: $PathValue"
    }
}

New-Item -ItemType Directory -Path $WindowsTargetDir -Force | Out-Null
New-Item -ItemType Directory -Path $LinuxTargetDir -Force | Out-Null

Copy-Item $WindowsSource (Join-Path $WindowsTargetDir "PredictMVDaemonSetup.exe") -Force
Copy-Item $LinuxArchiveSource (Join-Path $LinuxTargetDir "predict-mv-daemon-linux-x64.tar.gz") -Force
Copy-Item $LinuxInstallSource (Join-Path $LinuxTargetDir "install.sh") -Force
Copy-Item $LinuxUninstallSource (Join-Path $LinuxTargetDir "uninstall.sh") -Force

Write-Output "Daemon artifacts published into $DownloadsRoot"
