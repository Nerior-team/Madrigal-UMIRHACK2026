param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$DaemonRoot = Join-Path $RepoRoot "Desktop\daemon"
$DownloadsRoot = Join-Path $RepoRoot "server\downloads"
$WindowsSource = Join-Path $DaemonRoot "dist\windows-x64\PredictMVDaemonSetup.exe"
$WindowsManifestSource = Join-Path $DaemonRoot "dist\windows-x64\manifest.json"
$LinuxArchiveSource = Join-Path $DaemonRoot "dist\linux-x64\predictmv-linux-x64.tar.gz"
$LinuxManifestSource = Join-Path $DaemonRoot "dist\linux-x64\manifest.json"
$LinuxInstallSource = Join-Path $DaemonRoot "linux\install.sh"
$LinuxUninstallSource = Join-Path $DaemonRoot "linux\uninstall.sh"
$WindowsTargetDir = Join-Path $DownloadsRoot "windows"
$LinuxTargetDir = Join-Path $DownloadsRoot "linux"

if ($DryRun) {
    [pscustomobject]@{
        windows_source = $WindowsSource
        windows_manifest_source = $WindowsManifestSource
        linux_archive_source = $LinuxArchiveSource
        linux_manifest_source = $LinuxManifestSource
        linux_install_source = $LinuxInstallSource
        linux_uninstall_source = $LinuxUninstallSource
        windows_target = (Join-Path $WindowsTargetDir "CrossplatDaemonSetup.exe")
        linux_archive_target = (Join-Path $LinuxTargetDir "crossplat-linux-x64.tar.gz")
    } | ConvertTo-Json -Depth 3
    exit 0
}

$Required = @($WindowsSource, $WindowsManifestSource, $LinuxArchiveSource, $LinuxManifestSource, $LinuxInstallSource, $LinuxUninstallSource)
foreach ($PathValue in $Required) {
    if (-not (Test-Path $PathValue)) {
        throw "Missing source artifact: $PathValue"
    }
}

New-Item -ItemType Directory -Path $WindowsTargetDir -Force | Out-Null
New-Item -ItemType Directory -Path $LinuxTargetDir -Force | Out-Null

$LegacyLinuxArchive = Join-Path $LinuxTargetDir "predict-mv-daemon-linux-x64.tar.gz"
if (Test-Path $LegacyLinuxArchive) {
    Remove-Item -LiteralPath $LegacyLinuxArchive -Force
}
$PreviousLinuxArchive = Join-Path $LinuxTargetDir "predictmv-linux-x64.tar.gz"
if (Test-Path $PreviousLinuxArchive) {
    Remove-Item -LiteralPath $PreviousLinuxArchive -Force
}
$PreviousWindowsInstaller = Join-Path $WindowsTargetDir "PredictMVDaemonSetup.exe"
if (Test-Path $PreviousWindowsInstaller) {
    Remove-Item -LiteralPath $PreviousWindowsInstaller -Force
}

Copy-Item $WindowsSource (Join-Path $WindowsTargetDir "CrossplatDaemonSetup.exe") -Force
Copy-Item $WindowsManifestSource (Join-Path $WindowsTargetDir "manifest.json") -Force
Copy-Item $LinuxArchiveSource (Join-Path $LinuxTargetDir "crossplat-linux-x64.tar.gz") -Force
Copy-Item $LinuxManifestSource (Join-Path $LinuxTargetDir "manifest.json") -Force
Copy-Item $LinuxInstallSource (Join-Path $LinuxTargetDir "install.sh") -Force
Copy-Item $LinuxUninstallSource (Join-Path $LinuxTargetDir "uninstall.sh") -Force

Write-Output "Daemon artifacts published into $DownloadsRoot"
