# Launch into the signed-in console session, not SSH's session 0.
param(
    [ValidateSet('Release', 'Debug')][string]$Config = 'Release',
    [string]$Open = '',
    [string]$Exe = ''
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$build = Join-Path $root "build-win-$Config"
if (!$Exe) { $Exe = Join-Path $build 'Gelbox.exe' }
$Exe = (Resolve-Path -LiteralPath $Exe).Path
if ($Open) { $Open = (Resolve-Path -LiteralPath $Open).Path }
$user = (Get-CimInstance Win32_ComputerSystem).UserName
if (!$user) { throw 'Nobody is logged on at the console; sign in at the PC and leave it unlocked.' }
if (Get-CimInstance Win32_Process -Filter "Name = 'Gelbox.exe'" |
    Where-Object { $_.ExecutablePath -eq $Exe }) {
    throw 'This Gelbox executable is already running; use stop.ps1 first.'
}
New-Item -ItemType Directory -Force $build | Out-Null
$log = Join-Path $build 'gelbox.log'
if (Test-Path -LiteralPath $log) { Remove-Item -LiteralPath $log }
function Quote-Literal([string]$value) { "'" + $value.Replace("'", "''") + "'" }
$launcher = Join-Path $build 'gelbox-launch.ps1'
$launch = @(
    '$ErrorActionPreference = ''Stop''',
    ('Set-Location -LiteralPath ' + (Quote-Literal (Split-Path -Parent $Exe))),
    ('$env:GELBOX_LOG = ' + (Quote-Literal $log)),
    ('& ' + (Quote-Literal $Exe) + $(if ($Open) { ' ' + (Quote-Literal $Open) } else { '' })),
    'exit $LASTEXITCODE'
)
# UTF8 includes a BOM in Windows PowerShell 5.1, preserving non-ASCII paths.
Set-Content -LiteralPath $launcher -Value $launch -Encoding UTF8
$action = New-ScheduledTaskAction -Execute "$PSHOME\powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`""
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName GelboxRun -Action $action -Principal $principal -Settings $settings -Force | Out-Null
Start-ScheduledTask -TaskName GelboxRun
Start-Sleep -Seconds 4
$process = Get-CimInstance Win32_Process -Filter "Name = 'Gelbox.exe'" |
    Where-Object { $_.ExecutablePath -eq $Exe -and $_.SessionId -ne 0 }
if (Test-Path -LiteralPath $log) { Get-Content -LiteralPath $log }
if (!$process -or !(Test-Path -LiteralPath $log)) {
    throw 'Gelbox did not start with a fresh log in the console session; check that the desktop is unlocked.'
}
"running (PID $($process.ProcessId), session $($process.SessionId)); log: $log"
