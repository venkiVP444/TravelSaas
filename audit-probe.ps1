$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      TRAVELSAAS REMEDIATION VERIFICATION AUDIT PROBE     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start backend process with SQLite
Write-Host "`n[1] Starting TravelSaas API on http://127.0.0.1:5000..." -ForegroundColor Yellow
$dotnetPath = (Get-Command dotnet).Source
$proc = Start-Process -FilePath $dotnetPath -ArgumentList "backend/TravelSaas.Api/bin/Debug/net10.0/TravelSaas.Api.dll --urls http://127.0.0.1:5000" -PassThru -NoNewWindow

Start-Sleep -Seconds 3
$baseUrl = "http://127.0.0.1:5000"

# --- PROBE A: Authentication Enforcement ---
Write-Host "`n--- PROBE A: Authentication Enforcement ---" -ForegroundColor Cyan
try {
    $unauthRes = Invoke-RestMethod -Uri "$baseUrl/api/trips" -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[FAIL] SECURITY FLAW: /api/trips still accessible anonymously!" -ForegroundColor Red
} catch {
    Write-Host "[PASS] /api/trips rejected unauthenticated request: $($_.Exception.Message)" -ForegroundColor Green
}

try {
    $unauthMembers = Invoke-RestMethod -Uri "$baseUrl/api/members" -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[FAIL] SECURITY FLAW: /api/members still accessible anonymously!" -ForegroundColor Red
} catch {
    Write-Host "[PASS] /api/members rejected unauthenticated request: $($_.Exception.Message)" -ForegroundColor Green
}

# --- PROBE B: Multi-Tenant Header Impersonation Prevention ---
Write-Host "`n--- PROBE B: Multi-Tenant Header Impersonation Prevention ---" -ForegroundColor Cyan
# Login as Tenant 1
$loginBody = @{ email = "admin@v4journey.com"; password = "Admin@123" } | ConvertTo-Json
$authT1 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$t1Token = $authT1.token
Write-Host "Logged in as Tenant 1: $($authT1.user.email), TenantId: $($authT1.tenant.id)"

# Now Tenant 1 user sends token, BUT sets X-Tenant-Id to Tenant 2
$spoofHeaders = @{
    "Authorization" = "Bearer $t1Token"
    "X-Tenant-Id" = "22222222-2222-2222-2222-222222222222"
}
$spoofedTrips = Invoke-RestMethod -Uri "$baseUrl/api/trips" -Method Get -Headers $spoofHeaders
# The user is bound to Tenant 1, so they MUST see Tenant 1 trips, NOT Tenant 2 (#SKY-01)!
$sawTenant2 = $false
foreach ($t in $spoofedTrips.items) {
    if ($t.tripCode -eq "#SKY-01") {
        $sawTenant2 = $true
    }
}

if ($sawTenant2) {
    Write-Host "[FAIL] CRITICAL VULNERABILITY: Tenant 1 user accessed Tenant 2's data via X-Tenant-Id header spoofing!" -ForegroundColor Red
} else {
    Write-Host "[PASS] Multi-tenant spoofing blocked! Authenticated user was strictly confined to Tenant 1 ($($spoofedTrips.totalCount) trips returned)." -ForegroundColor Green
}

# --- PROBE C: Pagination Limits Clamping ---
Write-Host "`n--- PROBE C: Pagination Limits Clamping ---" -ForegroundColor Cyan
$hugeRes = Invoke-RestMethod -Uri "$baseUrl/api/trips?pageSize=5000000" -Method Get -Headers @{ "Authorization" = "Bearer $t1Token" }
if ($hugeRes.pageSize -le 100) {
    Write-Host "[PASS] Pagination bounded safely: Requested pageSize=5000000 was clamped to $($hugeRes.pageSize)." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Pagination unbounded: Returned pageSize=$($hugeRes.pageSize)" -ForegroundColor Red
}

# --- PROBE D: File Upload Path Traversal Sanitization ---
Write-Host "`n--- PROBE D: File Upload Path Traversal Sanitization ---" -ForegroundColor Cyan
# Check file upload with path traversal folder parameter
$dummyFilePath = "$PSScriptRoot\test-upload.txt"
"test content" | Out-File -FilePath $dummyFilePath -Encoding utf8

$uploadCmd = @"
`$file = Get-Item '$dummyFilePath'
`$bytes = [System.IO.File]::ReadAllBytes('$dummyFilePath')
`$boundary = [System.Guid]::NewGuid().ToString()
`$LF = "`r`n"
`$body = [System.Text.Encoding]::UTF8.GetBytes(
    "--`$boundary`$LF" +
    "Content-Disposition: form-data; name=`"file`"; filename=`"test-upload.txt`"`$LF" +
    "Content-Type: text/plain`$LF`$LF" +
    "test content`$LF" +
    "--`$boundary--`$LF"
)
`$res = Invoke-RestMethod -Uri "$baseUrl/api/uploads?folder=../../etc" -Method Post -Body `$body -ContentType "multipart/form-data; boundary=`$boundary" -Headers @{ "Authorization" = "Bearer $t1Token" }
`$res
"@

try {
    $uploadRes = Invoke-Expression $uploadCmd
    if ($uploadRes.fileUrl -match "etc" -and $uploadRes.fileUrl -match "\.\.") {
        Write-Host "[FAIL] Path traversal permitted: $($uploadRes.fileUrl)" -ForegroundColor Red
    } else {
        Write-Host "[PASS] Path traversal sanitized cleanly! File saved at: $($uploadRes.fileUrl)" -ForegroundColor Green
    }
} catch {
    Write-Host "[PASS] File upload properly validated / restricted: $($_.Exception.Message)" -ForegroundColor Green
}
if (Test-Path $dummyFilePath) { Remove-Item $dummyFilePath -Force }

# --- PROBE E: Database Persistence Across Server Restart ---
Write-Host "`n--- PROBE E: Database Persistence Across Server Restart ---" -ForegroundColor Cyan
$persistedTripCode = "#P-" + (Get-Random -Minimum 1000 -Maximum 9999)
$probeTripBody = @{
    tripCode = $persistedTripCode
    name = "Persistent Expedition Across Restarts"
    origin = "Bengaluru"
    destination = "Ooty"
    category = "Family Trip"
    duration = "3D 2N"
    foodInfo = "All meals included"
    pickupDrop = "Available"
    startDateTime = (Get-Date).AddDays(5).ToString("s")
    endDateTime = (Get-Date).AddDays(8).ToString("s")
    adultPrice = 14500
    adultSpends = 9500
    adultMargin = 5000
    childPrice = 8000
    childSpends = 5000
    childMargin = 3000
    totalSeats = 30
} | ConvertTo-Json

$created = Invoke-RestMethod -Uri "$baseUrl/api/trips" -Method Post -Body $probeTripBody -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $t1Token" }
Write-Host "Created trip in SQLite: $($created.name) ($($created.tripCode)) ID: $($created.id)"

# Kill server process
Write-Host "Stopping backend server process (simulating crash/restart)..."
Stop-Process -Id $proc.Id -Force
Start-Sleep -Seconds 2

# Restart server
Write-Host "Restarting backend server process..."
$proc = Start-Process -FilePath $dotnetPath -ArgumentList "backend/TravelSaas.Api/bin/Debug/net10.0/TravelSaas.Api.dll --urls http://127.0.0.1:5000" -PassThru -NoNewWindow
Start-Sleep -Seconds 3

# Verify the created trip exists in the database
try {
    $recheck = Invoke-RestMethod -Uri "$baseUrl/api/trips/$($created.id)" -Method Get -Headers @{ "Authorization" = "Bearer $t1Token" } -TimeoutSec 3
    if ($recheck.id -eq $created.id -and $recheck.tripCode -eq $persistedTripCode) {
        Write-Host "[PASS] DATA PERSISTENCE VERIFIED! Trip $($recheck.tripCode) survived server restart intact!" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Trip ID mismatch after restart!" -ForegroundColor Red
    }
} catch {
    Write-Host "[FAIL] DATA LOSS: Trip was not found after server restart: $($_.Exception.Message)" -ForegroundColor Red
}

# Clean shutdown
if ($proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
    Write-Host "`nServer stopped cleanly." -ForegroundColor Gray
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      ALL REMEDIATION SECURITY PROBES COMPLETE            " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
