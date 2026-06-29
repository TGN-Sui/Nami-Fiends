# Start a local Walrus Sites portal (testnet) so deployed SPAs are browsable.
# Deploy uploads to Walrus — this step is separate and required for testnet viewing.
#
# Prefers bun (no virtualization). Falls back to Docker when bun is unavailable.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/start-walrus-portal.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/start-walrus-portal.ps1 -Mode bun

param(
  [int]$Port = 3000,
  [ValidateSet('auto', 'bun', 'docker')]
  [string]$Mode = 'auto'
)

$ErrorActionPreference = 'Stop'

function Get-NamiPortalUrl {
  $deployUrls = Join-Path $PSScriptRoot '..\deployments\testnet\deploy-urls.json'
  if (Test-Path $deployUrls) {
    $json = Get-Content $deployUrls -Raw | ConvertFrom-Json
    if ($json.walrusPortalUrl) {
      return ($json.walrusPortalUrl.TrimEnd('/') + '/')
    }
  }

  $objectId = $null
  $wsResources = Join-Path $PSScriptRoot '..\frontend\ws-resources.json'
  if (Test-Path $wsResources) {
    $ws = Get-Content $wsResources -Raw | ConvertFrom-Json
    $objectId = $ws.object_id
  }

  if (-not $objectId) {
    return "http://localhost:$Port/"
  }

  $convert = site-builder --context=testnet convert $objectId 2>&1 | Out-String
  if ($convert -match 'https?://[^\s]+') {
    return ($Matches[0].TrimEnd('/') + '/')
  }

  return "http://localhost:$Port/"
}

function Resolve-BunExe {
  $candidate = Join-Path $env:USERPROFILE '.bun\bin\bun.exe'
  if (Test-Path $candidate) {
    return $candidate
  }

  $fromPath = Get-Command bun -ErrorAction SilentlyContinue
  if ($fromPath) {
    return $fromPath.Source
  }

  return $null
}

function Ensure-PortalRepo {
  $portalRoot = Join-Path $env:USERPROFILE '.nami\walrus-sites'

  if (-not (Test-Path (Join-Path $portalRoot 'portal\server\portal-config.yaml'))) {
    Write-Host 'Cloning walrus-sites portal (one-time setup)...'
    New-Item -ItemType Directory -Force -Path $portalRoot | Out-Null
    git clone --depth 1 https://github.com/MystenLabs/walrus-sites.git $portalRoot
    Copy-Item `
      (Join-Path $portalRoot 'portal\server\portal-config.testnet.example.yaml') `
      (Join-Path $portalRoot 'portal\server\portal-config.yaml') `
      -Force
  }

  return $portalRoot
}

function Test-DockerReady {
  docker info *> $null
  return $LASTEXITCODE -eq 0
}

function Get-SiteBuilderPortalTag {
  $raw = (site-builder -V 2>&1 | Out-String).Trim()
  if ($raw -match '(\d+\.\d+\.\d+)') {
    return 'mainnet-v' + $Matches[1]
  }
  throw "Could not parse site-builder version from: $raw"
}

$portalUrl = Get-NamiPortalUrl
$portalRoot = Ensure-PortalRepo

if ($Mode -eq 'auto') {
  if (Resolve-BunExe) {
    $Mode = 'bun'
  } elseif (Test-DockerReady) {
    $Mode = 'docker'
  } else {
    Write-Host ''
    Write-Host 'No portal runtime available.'
    Write-Host ''
    Write-Host 'Docker Desktop needs CPU virtualization (often blocked on school/work PCs).'
    Write-Host 'Use bun instead — no virtualization required:'
    Write-Host ''
    Write-Host '  powershell -NoProfile -Command "irm https://bun.sh/install | bash"'
    Write-Host '  powershell -ExecutionPolicy Bypass -File scripts/start-walrus-portal.ps1 -Mode bun'
    Write-Host ''
    Write-Host 'Hackathon fallback (no local portal): https://nami-fiends.vercel.app'
    exit 1
  }
}

Write-Host ''
Write-Host 'Walrus Sites testnet portal'
Write-Host '============================='
Write-Host "Mode:   $Mode"
Write-Host "Port:   $Port"
Write-Host "Browse: $portalUrl"
Write-Host ''
Write-Host 'Leave this window open while testing. Press Ctrl+C to stop.'
Write-Host ''

if ($Mode -eq 'bun') {
  $bun = Resolve-BunExe
  if (-not $bun) {
    Write-Host 'bun not found. Install: irm https://bun.sh/install | bash'
    exit 1
  }

  $portalDir = Join-Path $portalRoot 'portal'
  Push-Location $portalDir
  try {
    if (-not (Test-Path (Join-Path $portalDir 'node_modules'))) {
      Write-Host 'Installing portal dependencies (first run only)...'
      & $bun install
    }

    & $bun run server
  } finally {
    Pop-Location
  }

  exit $LASTEXITCODE
}

if (-not (Test-DockerReady)) {
  Write-Host 'Docker is not running. Use -Mode bun when virtualization is unavailable.'
  exit 1
}

$portalTag = Get-SiteBuilderPortalTag
$image = "mysten/walrus-sites-server-portal:$portalTag"
$configPath = Join-Path $portalRoot 'portal\server\portal-config.yaml'

docker run `
  -it `
  --rm `
  -v "${configPath}:/portal-config.yaml:ro" `
  -e PORTAL_CONFIG=/portal-config.yaml `
  -p "${Port}:3000" `
  $image