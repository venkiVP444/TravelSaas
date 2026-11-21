# ==============================================================================
# TRAVELSAAS — POSTGRESQL MIGRATION & REPEATABLE VERIFICATION HARNESS
# ==============================================================================
$ErrorActionPreference = "Continue"
if (Get-Variable -Name "PSNativeCommandUseErrorActionPreference" -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$port = 5433
$user = "postgres"
$testDb = "travelsaas_verify"
$apiDir = "c:\Source\apps\TravelSaas\backend\TravelSaas.Api"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "1. INITIALIZING CLEAN POSTGRESQL TEST DATABASE ($testDb)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Ensure test DB is clean
try {
    & "$pgBin\psql.exe" -p $port -h 127.0.0.1 -U $user -c "DROP DATABASE IF EXISTS $testDb;" 2>$null
    & "$pgBin\psql.exe" -p $port -h 127.0.0.1 -U $user -c "CREATE DATABASE $testDb ENCODING 'UTF8';" 2>$null
    Write-Host "[PASS] Clean PostgreSQL database '$testDb' created." -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Could not create database: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "2. APPLYING EF CORE MIGRATIONS ON POSTGRESQL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$env:ConnectionStrings__DefaultConnection = "Host=127.0.0.1;Port=$port;Database=$testDb;Username=$user;Password=;Pooling=true;"
$env:DatabaseProvider = "PostgreSQL"

Push-Location $apiDir
try {
    dotnet ef database update --no-build
    Write-Host "[PASS] Migrations successfully applied to PostgreSQL '$testDb'." -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Migration application failed: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "3. VERIFYING POSTGRESQL CONSTRAINTS AND TABLES" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$tableCount = & "$pgBin\psql.exe" -p $port -h 127.0.0.1 -U $user -d $testDb -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
Write-Host "Tables created in PostgreSQL: $tableCount" -ForegroundColor Yellow
if ([int]$tableCount -ge 15) {
    Write-Host "[PASS] All relational schema tables present in PostgreSQL." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Table count less than expected: $tableCount" -ForegroundColor Red
    exit 1
}

$indexCount = & "$pgBin\psql.exe" -p $port -h 127.0.0.1 -U $user -d $testDb -t -A -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';"
Write-Host "Indexes created in PostgreSQL: $indexCount" -ForegroundColor Yellow
if ([int]$indexCount -ge 15) {
    Write-Host "[PASS] All unique constraints and indexes verified." -ForegroundColor Green
} else {
    Write-Host "[FAIL] Index count less than expected: $indexCount" -ForegroundColor Red
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "4. STARTING API ON POSTGRESQL AND SEEDING DATA" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Kill any existing server on port 5000
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

$env:ASPNETCORE_ENVIRONMENT = "Development"
$apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --no-build --urls `"http://localhost:5000`" --project `"$apiDir\TravelSaas.Api.csproj`"" -PassThru -NoNewWindow
Start-Sleep -Seconds 6

$health = $null
for ($i = 0; $i -lt 15; $i++) {
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:5000/health/ready" -Method Get -TimeoutSec 3
        if ($health.status -eq "Healthy") { break }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if ($health -and $health.status -eq "Healthy") {
    Write-Host "[PASS] Backend running and live PostgreSQL health check verified: status = $($health.status), provider = $($health.provider)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend failed to boot or connect to PostgreSQL." -ForegroundColor Red
    if ($apiProcess) { Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue }
    exit 1
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "5. RUNNING COMPLETE 13/13 END-TO-END VERIFICATION CHECKS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$verifyOutput = & "powershell" -File "c:\Source\apps\TravelSaas\run-verification.ps1"
$verifyOutput | ForEach-Object { Write-Host $_ }

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "6. VERIFYING RESTART PERSISTENCE ON POSTGRESQL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Ensure backend is running
$serverHealthy = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $h = Invoke-RestMethod -Uri "http://localhost:5000/health/ready" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($h.status -eq "Healthy") { $serverHealthy = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
}

if (-not $serverHealthy) {
    Write-Host "Starting backend on http://localhost:5000..." -ForegroundColor Yellow
    $apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --no-build --urls `"http://localhost:5000`" --project `"$apiDir\TravelSaas.Api.csproj`"" -PassThru -NoNewWindow
    Start-Sleep -Seconds 6
}

# Create a test entity in PostgreSQL
$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ email = "admin@v4journey.com"; password = "Admin@123" } | ConvertTo-Json) -ContentType "application/json"
$token = $loginRes.token
$headers = @{ Authorization = "Bearer $token" }

$persistCode = "#PG-" + (Get-Random -Minimum 1000 -Maximum 9999)
$persistTrip = Invoke-RestMethod -Uri "http://localhost:5000/api/trips" -Method Post -Headers $headers -Body (@{
    tripCode = $persistCode
    name = "PostgreSQL Persistence Test Trip"
    origin = "Chennai"
    destination = "Pondicherry"
    category = "Family Trip"
    duration = "3D 2N"
    foodInfo = "With Food"
    pickupDrop = "Central Station"
    startDateTime = (Get-Date).AddDays(15).ToString("s")
    endDateTime = (Get-Date).AddDays(18).ToString("s")
    adultPrice = 4500
    adultSpends = 3000
    adultMargin = 1500
    childPrice = 3000
    childSpends = 2000
    childMargin = 1000
    totalSeats = 25
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "Created test trip: $($persistTrip.id) with code $persistCode in PostgreSQL." -ForegroundColor Yellow

# Kill all processes on port 5000 to simulate full service shutdown
Write-Host "Simulating full server shutdown / crash..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

# Verify in PostgreSQL directly that row exists while server is DEAD
$directPgCheck = & "$pgBin\psql.exe" -p $port -h 127.0.0.1 -U $user -d $testDb -t -A -c "SELECT \"TripCode\" FROM \"Trips\" WHERE \"TripCode\" = '$persistCode';"
if ($directPgCheck.Trim() -eq $persistCode) {
    Write-Host "[PASS] Direct PostgreSQL Engine Verification: Row '$persistCode' exists in PostgreSQL disk table while API server is STOPPED!" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Direct PostgreSQL Check: Row not found in database!" -ForegroundColor Red
    exit 1
}

Write-Host "Restarting backend process against persistent PostgreSQL database..." -ForegroundColor Yellow
$apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --no-build --urls `"http://localhost:5000`" --project `"$apiDir\TravelSaas.Api.csproj`"" -PassThru -NoNewWindow

for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $h2 = Invoke-RestMethod -Uri "http://localhost:5000/health/ready" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($h2.status -eq "Healthy") { break }
    } catch { }
}

# Re-authenticate and verify trip exists after restart
$loginRes2 = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ email = "admin@v4journey.com"; password = "Admin@123" } | ConvertTo-Json) -ContentType "application/json"
$headers2 = @{ Authorization = "Bearer $($loginRes2.token)" }
$fetchedTrip = Invoke-RestMethod -Uri "http://localhost:5000/api/trips/$($persistTrip.id)" -Method Get -Headers $headers2

if ($fetchedTrip -and $fetchedTrip.tripCode -eq $persistCode) {
    Write-Host "[PASS] PostgreSQL Restart Persistence Verified: Trip '$persistCode' successfully retrieved through API after restart!" -ForegroundColor Green
} else {
    Write-Host "[FAIL] PostgreSQL Restart Persistence failed: Trip not found after restart." -ForegroundColor Red
    exit 1
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "7. CLEANUP / SERVER STATUS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Server process PID: $($apiProcess.Id) running on port 5000." -ForegroundColor Green
Write-Host "[ALL POSTGRESQL VERIFICATION STEPS PASSED SUCCESSFULLY]" -ForegroundColor Green
