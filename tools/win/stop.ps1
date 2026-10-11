# Stop only Gelbox from this checkout, or the explicitly supplied installed copy.
param([string]$Exe = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$paths = @((Join-Path $root 'build-win-Release\Gelbox.exe'), (Join-Path $root 'build-win-Debug\Gelbox.exe'))
if ($Exe) { $paths += (Resolve-Path -LiteralPath $Exe).Path }
Stop-ScheduledTask -TaskName GelboxRun -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -Filter "Name = 'Gelbox.exe'" |
    Where-Object { $paths -contains $_.ExecutablePath } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Unregister-ScheduledTask -TaskName GelboxRun -Confirm:$false -ErrorAction SilentlyContinue
'stopped'
