# Run once from an elevated PowerShell if the agent could not clone:
#   cd C:\Users\paulr\.cursor\projects\empty-window\CursorHackSprint\scripts
#   .\sync-from-upstream.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$target = Join-Path $root "CursorHackSprint"
$temp = Join-Path $env:TEMP "CursorHackSprint-clone"

if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
git clone --depth 1 https://github.com/CheckmateWeb/CursorHackSprint.git $temp

if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target | Out-Null }
robocopy $temp $target /E /XD .git node_modules dist | Out-Null

Set-Location $target
if (-not (Test-Path ".git")) {
  git init
  git remote add origin https://github.com/CheckmateWeb/CursorHackSprint.git
  git fetch origin master --depth=1
  git checkout -b master FETCH_HEAD
}
git checkout -B feature/paul-scene-analysis-audio
Write-Host "Branch:" (git branch --show-current)
Write-Host "Paul lib files are in src/lib — review with: git status"
