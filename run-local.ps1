# ==============================================================================
# TravelSaas - Local Development Launcher
# Starts: PostgreSQL (port 5433), .NET Web API (port 5000), Angular Client (port 4200)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  TRAVELSAAS — STARTING LOCAL DEVELOPMENT SERVICES" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = "C:\Source\apps\TravelSaas"
$pgData = "$root\pgdata"
$pgExe = "C:\Program Files\PostgreSQL\18\bin\postgres.exe"

# 1. PostgreSQL Daemon Check
$pgConn = Get-NetTCPConnection -LocalPort 5433 -ErrorAction SilentlyContinue
if (-not $pgConn) {
    Write-Host "[1/3] Starting PostgreSQL 18 daemon on port 5433..." -ForegroundColor Yellow
    if (Test-Path $pgExe) {
        Start-Process $pgExe -ArgumentList "-D `"$pgData`" -p 5433" -WindowStyle Hidden
        Start-Sleep -Seconds 2
        Write-Host "  -> PostgreSQL started successfully." -ForegroundColor Green
    } else {
        Write-Host "  -> PostgreSQL executable not found at $pgExe" -ForegroundColor Red
    }
} else {
    Write-Host "[1/3] PostgreSQL daemon is already running on port 5433." -ForegroundColor Green
}

# 2. Backend .NET API Check
$apiConn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if (-not $apiConn) {
    Write-Host "[2/3] Launching .NET 10 Web API on http://localhost:5000..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend\TravelSaas.Api'; Write-Host 'TravelSaas API running on http://localhost:5000' -ForegroundColor Green; dotnet run --urls 'http://127.0.0.1:5000'"
} else {
    Write-Host "[2/3] Backend API is already running on port 5000." -ForegroundColor Green
}

# 3. Frontend Angular Client Check
$clientConn = Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue
if (-not $clientConn) {
    Write-Host "[3/3] Launching Angular 21 dev server on http://localhost:4200..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\TravelSaasClient'; Write-Host 'TravelSaas Client running on http://localhost:4200' -ForegroundColor Green; npm start"
} else {
    Write-Host "[3/3] Frontend dev server is already running on port 4200." -ForegroundColor Green
}

Write-Host "`nAll services initialized!" -ForegroundColor Cyan
Write-Host "Frontend URL : http://localhost:4200" -ForegroundColor White
Write-Host "Backend API  : http://localhost:5000" -ForegroundColor White
Write-Host "PostgreSQL   : 127.0.0.1:5433 (travelsaas_dev)" -ForegroundColor White
Write-Host "`nDefault Demo Login Credentials:" -ForegroundColor Yellow
Write-Host "Email    : admin@v4journey.com" -ForegroundColor White
Write-Host "Password : Admin@123" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
