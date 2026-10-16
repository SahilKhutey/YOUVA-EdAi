# Regenerates the real, reproducible Truth Baseline numbers on Windows for mvp/clean. Run from repo root.
$ErrorActionPreference = "Continue"

Write-Host "=== YOUVA-EdAI Truth Baseline Check (mvp/clean) ===" -ForegroundColor Cyan
Set-Location backend

Write-Host "Running prisma generate..." -ForegroundColor Yellow
npx prisma generate | Out-Null

$commitHash = (git rev-parse --short HEAD).Trim()
$isoDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
Write-Host "Date: $isoDate | Commit: $commitHash"

$models = (Select-String -Path "prisma\schema.prisma" -Pattern "^model\s+").Count
Write-Host "Models in schema.prisma: $models"

$migrationTables = 0
if (Test-Path "prisma\migrations") {
    $migrationTables = (Select-String -Path "prisma\migrations\*\migration.sql" -Pattern "CREATE TABLE" -SimpleMatch).Count
}
Write-Host "CREATE TABLE in migrations: $migrationTables"

Write-Host "--- TypeScript Typecheck ---" -ForegroundColor Yellow
$tscOutput = (npx tsc --noEmit 2>&1)
$tscErrors = ($tscOutput | Select-String -Pattern "error TS").Count
Write-Host "tsc errors: $tscErrors"

Write-Host "--- Unit Tests (non-e2e) ---" -ForegroundColor Yellow
$jestOutput = (npx jest --testPathIgnorePatterns="e2e" 2>&1)
$summaryLines = $jestOutput | Select-String -Pattern "(Tests|Test Suites):"
foreach ($line in $summaryLines) {
    Write-Host $line
}

Write-Host "=== Baseline Complete ===" -ForegroundColor Green
Set-Location ..
