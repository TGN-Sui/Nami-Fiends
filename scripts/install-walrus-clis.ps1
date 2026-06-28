# Install Walrus + site-builder CLIs for Phase 9.1.4 (Windows).
# Requires: suiup in PATH (https://github.com/MystenLabs/suiup)
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/install-walrus-clis.ps1

$ErrorActionPreference = 'Stop'

function Resolve-Suiup {
  $candidate = Join-Path $env:LOCALAPPDATA 'bin\suiup.exe'

  if (Test-Path $candidate) {
    return $candidate
  }

  $fromPath = Get-Command suiup -ErrorAction SilentlyContinue

  if ($fromPath) {
    return $fromPath.Source
  }

  throw 'suiup not found. Install from https://github.com/MystenLabs/suiup'
}

$suiup = Resolve-Suiup

Write-Host 'Installing walrus@testnet and site-builder@mainnet via suiup...'
& $suiup install walrus@testnet -y
& $suiup install site-builder@mainnet -y
& $suiup switch walrus@testnet
& $suiup switch site-builder@mainnet

$walrusDir = Join-Path $env:USERPROFILE '.config\walrus'
New-Item -ItemType Directory -Force -Path $walrusDir | Out-Null

Write-Host 'Downloading Walrus client_config.yaml...'
Invoke-WebRequest -Uri 'https://docs.wal.app/setup/client_config.yaml' -OutFile (Join-Path $walrusDir 'client_config.yaml')

Write-Host 'Downloading official sites-config.yaml...'
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/MystenLabs/walrus-sites/main/sites-config.yaml' -OutFile (Join-Path $walrusDir 'sites-config.yaml')

Write-Host ''
Write-Host 'Installed:'
walrus --version
site-builder --help | Select-Object -First 1
Write-Host ''
Write-Host 'Next:'
Write-Host '  node scripts/setup-walrus-sites-config.mjs   # optional repo copy'
Write-Host '  walrus get-wal --context testnet             # fund WAL for uploads'
Write-Host '  node scripts/verify-walrus-sites-ready.mjs --build'
Write-Host '  node scripts/deploy-walrus-sites.mjs --epochs 5 --context testnet'