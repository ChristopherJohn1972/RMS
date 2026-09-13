# ============================================
# Flatten Frontend: move FRONTEND/frontend/* to Frontend/ root
# ============================================

$frontendRoot = "C:\Users\MUTUKU\mu_code\RMS\Frontend"
$frontendInner = "C:\Users\MUTUKU\mu_code\RMS\Frontend\frontend"

Write-Host "`n[FLATTEN] Moving Frontend/frontend/* to Frontend/ root" -ForegroundColor Green

# Verify inner frontend exists
if (-not (Test-Path $frontendInner)) {
    Write-Host "  Frontend/frontend/ not found. Already flattened?" -ForegroundColor Yellow
    exit 0
}

# Items to promote (the actual React app files)
$itemsToMove = @(
    "src",
    "public",
    "node_modules",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "index.html",
    ".gitignore",
    ".env.development",
    ".env.production",
    "vercel.json",
    "dist",
    ".vercel"
)

foreach ($item in $itemsToMove) {
    $src = Join-Path $frontendInner $item
    $dst = Join-Path $frontendRoot $item
    
    if (Test-Path $src) {
        if (Test-Path $dst) {
            Write-Host "  SKIP $item (already exists at root)" -ForegroundColor Yellow
        } else {
            Move-Item -Path $src -Destination $dst -Force
            Write-Host "  MOVE $item" -ForegroundColor Cyan
        }
    }
}

# Move any remaining files from inner frontend to root
Get-ChildItem $frontendInner -File | ForEach-Object {
    $dst = Join-Path $frontendRoot $_.Name
    if (-not (Test-Path $dst)) {
        Move-Item -Path $_.FullName -Destination $dst -Force
        Write-Host "  MOVE $($_.Name)" -ForegroundColor Cyan
    }
}

Write-Host "`n[DONE] Frontend flattened!" -ForegroundColor Green
Write-Host ""
Write-Host "New Frontend/ contents:"
Get-ChildItem $frontendRoot -Name | Where-Object { $_ -ne "node_modules" -and $_ -ne "dist" -and $_ -ne ".vercel" -and $_ -ne "frontend" } | ForEach-Object { Write-Host "  $_" }
