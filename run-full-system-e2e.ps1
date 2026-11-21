# ==============================================================================
# TRAVELSAAS — FULL SYSTEM IN-BROWSER E2E VERIFICATION WITH POSTGRESQL
# ==============================================================================
$apiDir = "c:\Source\apps\TravelSaas\backend\TravelSaas.Api"

# Clean ports 5000 and 4200
Get-NetTCPConnection -LocalPort 5000, 4200 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

Write-Host "1. Starting ASP.NET Core API with PostgreSQL on http://127.0.0.1:5000..." -ForegroundColor Cyan
$env:ConnectionStrings__DefaultConnection = "Host=127.0.0.1;Port=5433;Database=travelsaas_dev;Username=postgres;Password=;Pooling=true;"
$env:DatabaseProvider = "PostgreSQL"
$env:ASPNETCORE_ENVIRONMENT = "Development"

$apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --no-build --urls `"http://127.0.0.1:5000`" --project `"$apiDir\TravelSaas.Api.csproj`"" -PassThru -NoNewWindow

Write-Host "2. Starting Angular SPA Server on http://127.0.0.1:4200..." -ForegroundColor Cyan
$spaProcess = Start-Process -FilePath "node" -ArgumentList "serve-spa.js" -WorkingDirectory "c:\Source\apps\TravelSaas" -PassThru -NoNewWindow

# Wait for both services to be responsive
$apiReady = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:5000/health/ready" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($res.status -eq "Healthy") {
            $apiReady = $true
            break
        }
    } catch { }
}

if (-not $apiReady) {
    Write-Host "[FAIL] API failed to boot on port 5000." -ForegroundColor Red
    Stop-Process -Id $apiProcess.Id, $spaProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "[PASS] API and PostgreSQL are Healthy!" -ForegroundColor Green

Write-Host "3. Executing Puppeteer In-Browser Chrome E2E Suite..." -ForegroundColor Cyan
$e2eOutput = & "node" "frontend-audit.js"
$e2eOutput | ForEach-Object { Write-Host $_ }

# Stop processes
Stop-Process -Id $apiProcess.Id, $spaProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "`n[FULL SYSTEM E2E VERIFICATION COMPLETED]" -ForegroundColor Green

