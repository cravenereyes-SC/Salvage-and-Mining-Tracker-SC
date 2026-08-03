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
    Start-Process -FilePath "py" -ArgumentList "-m", "http.server", $Port -WorkingDirectory $ScriptRoot -WindowStyle Minimized | Out-Null
    Write-Host "Started local server on port $Port."
  }
  catch {
    Write-Error "Could not start local server with 'py -m http.server $Port'."
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
