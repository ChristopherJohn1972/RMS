# ============================================
# Migrate RMS to CRM V2 directory structure
# Run from: C:\Users\MUTUKU\mu_code\RMS
# ============================================

$projectDir = "C:\Users\MUTUKU\mu_code\RMS"
$backendSrc = "$projectDir\BACKEND"
$frontendSrc = "$projectDir\FRONTEND\frontend"
$backendDst = "$projectDir\Backend"
$frontendDst = "$projectDir\Frontend"

Write-Host "`n[MIGRATE] Restructuring RMS to Backend/ + Frontend/ pattern" -ForegroundColor Green

# ---- Step 1: Copy Backend ----
Write-Host "[STEP] Copying Backend..." -ForegroundColor Cyan
if (Test-Path $backendDst) {
    Write-Host "  Backend/ already exists, skipping." -ForegroundColor Yellow
} else {
    # robocopy mirrors directory, excludes venv and __pycache__
    robocopy $backendSrc $backendDst /E /XD venv __pycache__ .git node_modules *.pyc db.sqlite3 /NFL /NDL /NJH /NJS /NC /NS /NP
    Write-Host "  Backend copied to Backend/"
}

# ---- Step 2: Copy Frontend ----
Write-Host "[STEP] Copying Frontend..." -ForegroundColor Cyan
if (Test-Path $frontendDst) {
    Write-Host "  Frontend/ already exists, skipping." -ForegroundColor Yellow
} else {
    robocopy $frontendSrc $frontendDst /E /XD node_modules .git dist .vercel /NFL /NDL /NJH /NJS /NC /NS /NP
    Write-Host "  Frontend copied to Frontend/"
}

# ---- Step 3: Init git repos ----
Write-Host "[STEP] Setting up git repos..." -ForegroundColor Cyan

if (-not (Test-Path "$backendDst\.git")) {
    Push-Location $backendDst
    git init
    git remote add origin https://github.com/ChristopherJohn1972/Rental-Management-Services-backend-.git
    Pop-Location
    Write-Host "  Backend git initialized"
}

if (-not (Test-Path "$frontendDst\.git")) {
    Push-Location $frontendDst
    git init
    git remote add origin https://github.com/ChristopherJohn1972/Rental-Management-Services-frontend-.git
    Pop-Location
    Write-Host "  Frontend git initialized"
}

# ---- Step 4: Create root .gitignore ----
$gitignore = @"
# Dependencies
Backend/venv/
Frontend/node_modules/

# Python
__pycache__/
*.pyc
*.sqlite3
db.sqlite3

# Environment
.env
.env.local

# Build
Backend/staticfiles/
Frontend/dist/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
desktop.ini
"@

Set-Content -Path "$projectDir\.gitignore" -Value $gitignore
Write-Host "  .gitignore created"

# ---- Done ----
Write-Host "`n[DONE] Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "New structure:"
Write-Host "  $backendDst\"
Write-Host "  $frontendDst\"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. cd $backendDst"
Write-Host "     git add . && git commit -m 'restructure'"
Write-Host "     git push -u origin main"
Write-Host ""
Write-Host "  2. cd $frontendDst"
Write-Host "     git add . && git commit -m 'restructure'"
Write-Host "     git push -u origin main"
Write-Host ""
Write-Host "  3. Delete old BACKEND/ and FRONTEND/ directories if no longer needed"
