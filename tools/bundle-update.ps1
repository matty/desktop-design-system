#!/usr/bin/env pwsh
# Update this design-language bundle to a release version.
# Ships at the bundle root; run it from your app, e.g.:
#   pwsh src/design-language/update.ps1 0.2.0
# Targets its own directory by default; override the target with $env:DL_DEST,
# or the source repo with $env:DL_REPO.
param([Parameter(Mandatory)][string]$Version)
$ErrorActionPreference = 'Stop'

$Repo    = $env:DL_REPO ?? 'matty/desktop-design-system'
$SelfDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Dest    = $env:DL_DEST ?? $SelfDir
$Version = $Version.TrimStart('v')           # accept 0.2.0 or v0.2.0
$Tag = "v$Version"; $Zip = "design-language-$Version.zip"

$old = (Test-Path "$Dest/VERSION") ? (Get-Content "$Dest/VERSION").Trim() : 'none'

# Refuse to clobber uncommitted edits (e.g. locally extended icons) in DEST.
if (git -C $Dest rev-parse --is-inside-work-tree 2>$null) {
  if (git -C $Dest status --porcelain -- .) { throw "$Dest has uncommitted changes — commit or stash first." }
}

$tmp = Join-Path ([IO.Path]::GetTempPath()) ([Guid]::NewGuid())
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  Write-Host "Downloading $Tag from $Repo ..."
  gh release download $Tag --repo $Repo --pattern "$Zip*" --dir $tmp
  Write-Host "Verifying checksum ..."
  $expected = ((Get-Content "$tmp/$Zip.sha256") -split '\s+')[0].ToLower()
  $actual   = (Get-FileHash "$tmp/$Zip" -Algorithm SHA256).Hash.ToLower()
  if ($expected -ne $actual) { throw "checksum mismatch for $Zip" }

  # Stage fully before touching DEST so a failed extract can't half-remove it.
  Expand-Archive -Path "$tmp/$Zip" -DestinationPath "$tmp/stage" -Force
  if (-not (Test-Path "$tmp/stage/VERSION")) { throw "extracted bundle missing VERSION" }
  Write-Host "Updating $Dest ($old -> $Version) ..."
  Set-Location $tmp                          # leave $Dest before replacing it
  if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest }
  Move-Item "$tmp/stage" $Dest
  Write-Host "Done: $Dest is now design-language $((Get-Content "$Dest/VERSION").Trim()) (was $old)."
  Write-Host "Review the diff: git add $Dest; git diff --cached --stat -- $Dest"
} finally { Set-Location ([IO.Path]::GetTempPath()); Remove-Item -Recurse -Force $tmp }
