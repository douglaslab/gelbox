# Capture the console's primary screen through an interactive scheduled task.
param([string]$Out = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$build = Join-Path $root 'build-win-Release'
New-Item -ItemType Directory -Force $build | Out-Null
if (!$Out) { $Out = Join-Path $build 'gelbox-shot.png' }
$Out = [IO.Path]::GetFullPath($Out)
$user = (Get-CimInstance Win32_ComputerSystem).UserName
if (!$user) { throw 'Sign in at the PC console and leave the desktop unlocked first.' }
if (Test-Path -LiteralPath $Out) { Remove-Item -LiteralPath $Out }
$inner = @'
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class GelboxScreenDpi { [DllImport("user32.dll")] public static extern bool SetProcessDPIAware(); }'
[GelboxScreenDpi]::SetProcessDPIAware() | Out-Null
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width,$bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $bitmap.Save(__OUTPUT__, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    $graphics.Dispose()
    $bitmap.Dispose()
}
'@
$inner = $inner.Replace('__OUTPUT__', "'" + $Out.Replace("'", "''") + "'")
$capture = Join-Path $build 'gelbox-capture.ps1'
Set-Content -LiteralPath $capture -Value $inner -Encoding UTF8
$action = New-ScheduledTaskAction -Execute "$PSHOME\powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$capture`""
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName GelboxShot -Action $action -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName GelboxShot
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    Start-Sleep -Milliseconds 500
    if ((Test-Path -LiteralPath $Out) -and (Get-ScheduledTask GelboxShot).State -ne 'Running') {
        $file = Get-Item -LiteralPath $Out
        if ($file.Length -gt 0) { $file | Select-Object FullName,Length; exit 0 }
    }
}
throw 'No fresh screenshot was written; is the console session unlocked?'
