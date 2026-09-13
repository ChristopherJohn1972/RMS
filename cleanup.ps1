$path = "C:\Users\MUTUKU\mu_code\RMS\Frontend\frontend"
$old = "C:\Users\MUTUKU\mu_code\RMS\Frontend\_old_frontend"

# Rename first (this breaks the lock)
Rename-Item -Path $path -NewName "_old_frontend" -Force -ErrorAction SilentlyContinue

if (Test-Path $old) {
    # Remove read-only attributes
    Get-ChildItem $old -Recurse -Force | ForEach-Object {
        $_.Attributes = 'Normal'
    }
    Remove-Item -Recurse -Force $old
    Write-Host "Deleted!" -ForegroundColor Green
} else {
    Write-Host "Could not rename - restart PC then try again" -ForegroundColor Yellow
}
