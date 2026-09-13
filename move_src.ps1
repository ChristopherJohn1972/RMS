# Move src directory using robocopy (handles locks better)
$src = "C:\Users\MUTUKU\mu_code\RMS\Frontend\frontend\src"
$dst = "C:\Users\MUTUKU\mu_code\RMS\Frontend\src"

Write-Host "[MOVE] Moving src/..." -ForegroundColor Cyan

# robocopy mirrors source to destination, then we delete source
robocopy $src $dst /E /MOVE /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS /NP
Write-Host "  src/ moved successfully." -ForegroundColor Green

# Also move node_modules if it didn't move
$nmSrc = "C:\Users\MUTUKU\mu_code\RMS\Frontend\frontend\node_modules"
$nmDst = "C:\Users\MUTUKU\mu_code\RMS\Frontend\node_modules"
if ((Test-Path $nmSrc) -and (-not (Test-Path $nmDst))) {
    Write-Host "[MOVE] Moving node_modules/ (this may take a moment)..." -ForegroundColor Cyan
    robocopy $nmSrc $nmDst /E /MOVE /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS /NP
    Write-Host "  node_modules/ moved." -ForegroundColor Green
} elseif (Test-Path $nmDst) {
    Write-Host "  node_modules/ already at root." -ForegroundColor Yellow
}

# Check what's left in frontend/
$remaining = Get-ChildItem "C:\Users\MUTUKU\mu_code\RMS\Frontend\frontend" -ErrorAction SilentlyContinue
if ($remaining) {
    Write-Host "`n  Remaining in Frontend/frontend/:" -ForegroundColor Yellow
    $remaining | ForEach-Object { Write-Host "    $($_.Name)" }
} else {
    Write-Host "`n  Frontend/frontend/ is empty - can be deleted." -ForegroundColor Green
}

# Verify src is in place
if (Test-Path "C:\Users\MUTUKU\mu_code\RMS\Frontend\src\App.jsx") {
    Write-Host "`n[DONE] src/ is now at Frontend/src/" -ForegroundColor Green
} else {
    Write-Host "`n[WARN] src/App.jsx not found at root!" -ForegroundColor Red
}
