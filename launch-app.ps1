param(
  [int]$Port = 5500
)

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Url = "http://localhost:$Port"

$edgeCandidates = @(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$edgePath = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $edgePath) {
  Write-Error "Microsoft Edge was not found in common install locations."
  exit 1
}

$edgeProxyPath = Join-Path (Split-Path -Parent $edgePath) "msedge_proxy.exe"
$edgeLauncherPath = if (Test-Path $edgeProxyPath) { $edgeProxyPath } else { $edgePath }

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $listener) {
  try {
    $serverScript = Join-Path $env:TEMP "sc-tracker-server-$Port.ps1"
    $serverSource = @'
param(
  [string]$Root,
  [int]$Port
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Server listening on http://localhost:$Port/"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.LocalPath).TrimStart('/')
    if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
    $file = Join-Path $Root $path
    if ((Test-Path $file -PathType Leaf) -and ((Resolve-Path $file).Path.StartsWith($Root))) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $mime = switch ($ext) {
        '.html' { 'text/html; charset=utf-8' }
        '.css'  { 'text/css; charset=utf-8' }
        '.js'   { 'text/javascript; charset=utf-8' }
        '.mjs'  { 'text/javascript; charset=utf-8' }
        '.json' { 'application/json; charset=utf-8' }
        '.svg'  { 'image/svg+xml' }
        '.png'  { 'image/png' }
        '.jpg'  { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.ico'  { 'image/x-icon' }
        default { 'application/octet-stream' }
      }
      $ctx.Response.ContentType = $mime
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  }
  catch {
    # Keep serving subsequent requests even if one client disconnects mid-response.
  }
}
'@

    Set-Content -Path $serverScript -Value $serverSource -Encoding UTF8
    Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $serverScript, "-Root", ('"' + $ScriptRoot + '"'), "-Port", $Port -WorkingDirectory $ScriptRoot -WindowStyle Minimized | Out-Null
    Write-Host "Started local server on port $Port (PowerShell HttpListener, no Python required)."
  }
  catch {
    Write-Error "Could not start local server on port $Port. Details: $($_.Exception.Message)"
    exit 1
  }
}
else {
  Write-Host "Using existing server on port $Port."
}

$edgeArgs = @(
  "--new-window",
  "--app=$Url",
  "--no-first-run",
  "--disable-session-crashed-bubble"
)

Start-Process -FilePath $edgeLauncherPath -ArgumentList $edgeArgs | Out-Null
Write-Host "Opened Edge app window at $Url"
