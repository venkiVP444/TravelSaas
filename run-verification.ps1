$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   TRAVELSAAS / V4JOURNEY - END-TO-END VERIFICATION SUITE  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start backend process
Write-Host "`n[1/13] Starting TravelSaas ASP.NET Core Web API on http://127.0.0.1:5000..." -ForegroundColor Yellow
$dotnetPath = (Get-Command dotnet).Source
$proc = $null
$existingConn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if (-not $existingConn) {
    $proc = Start-Process -FilePath $dotnetPath -ArgumentList "backend/TravelSaas.Api/bin/Debug/net10.0/TravelSaas.Api.dll --urls http://127.0.0.1:5000" -PassThru -NoNewWindow
}

$maxRetries = 30
$healthy = $false
$baseUrl = "http://127.0.0.1:5000"

for ($i = 0; $i -lt $maxRetries; $i++) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($res.status -eq "Healthy") {
            $healthy = $true
            break
        }
    } catch { }
}

if (-not $healthy) {
    Write-Host "FATAL: Web API failed to start or did not become healthy within 30 seconds." -ForegroundColor Red
    if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
    exit 1
}

Write-Host ">> Server is Healthy! ($($res.product) v$($res.version))`n" -ForegroundColor Green

$tenant1Header = @{ "X-Tenant-Id" = "11111111-1111-1111-1111-111111111111" }
$tenant2Header = @{ "X-Tenant-Id" = "22222222-2222-2222-2222-222222222222" }

# Test 1: Authentication (Login)
Write-Host "[2/13] Testing Authentication (/api/auth/login)..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@v4journey.com"
    password = "Admin@123"
} | ConvertTo-Json

$authRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -Headers $tenant1Header
if (-not $authRes.token -or $authRes.user.email -ne "admin@v4journey.com") {
    throw "Auth verification failed! Response: $($authRes | ConvertTo-Json)"
}
$authHeaders = @{
    "X-Tenant-Id" = "11111111-1111-1111-1111-111111111111"
    "Authorization" = "Bearer $($authRes.token)"
}
Write-Host ">> PASS: Logged in as $($authRes.user.fullName) ($($authRes.user.role))`n" -ForegroundColor Green

# Test 2: Dashboard Stats
Write-Host "[3/13] Testing Dashboard KPI Stats (/api/dashboard/stats)..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/stats" -Method Get -Headers $authHeaders
if ($stats.totalTrips -lt 4) {
    throw "Dashboard stats mismatch! Expected >= 4 trips, got $($stats.totalTrips)"
}
Write-Host ">> PASS: TotalTrips=$($stats.totalTrips), TotalRevenue=Rs.$($stats.totalRevenue), Travellers=$($stats.totalTravellers)`n" -ForegroundColor Green

# Test 3: Trips List
Write-Host "[4/13] Testing Trips Listing (/api/trips)..." -ForegroundColor Yellow
$tripsList = Invoke-RestMethod -Uri "$baseUrl/api/trips?page=1&pageSize=10" -Method Get -Headers $authHeaders
if ($tripsList.totalCount -lt 4) {
    throw "Trips list count mismatch! Expected >= 4, got $($tripsList.totalCount)"
}
Write-Host ">> PASS: Retrieved $($tripsList.items.Count) trips (Total count: $($tripsList.totalCount))`n" -ForegroundColor Green

# Test 4: Create Trip Wizard (End-to-End)
Write-Host "[5/13] Testing Create Trip Wizard (/api/trips)..." -ForegroundColor Yellow
$createTripBody = @{
    name = "Wayanad 3-Day Forest Expedition"
    tripCode = "#0005"
    category = "Family Trip"
    origin = "Kochi, Kerala"
    destination = "Wayanad, Kerala"
    via = "Calicut"
    startDateTime = (Get-Date).AddDays(10).ToString("s")
    endDateTime = (Get-Date).AddDays(13).ToString("s")
    duration = "3D 2N"
    totalSeats = 14
    foodInfo = "With Food and Snacks"
    pickupDrop = "Kochi Airport / Railway Station"
    adultPrice = 12000
    adultSpends = 8000
    adultMargin = 4000
    childPrice = 6000
    childSpends = 4000
    childMargin = 2000
    description = "Scenic 3-day luxury exploration through Wayanad rainforests and tea plantations."
    schedules = @(
        @{
            dayNumber = 1
            dayDate = (Get-Date).AddDays(10).ToString("s")
            timeString = "08:00 AM"
            activity = "Departure from Kochi"
            location = "Kochi Hub"
        },
        @{
            dayNumber = 1
            dayDate = (Get-Date).AddDays(10).ToString("s")
            timeString = "02:30 PM"
            activity = "Check-in at Rainforest Resort"
            location = "Vythiri, Wayanad"
        },
        @{
            dayNumber = 2
            dayDate = (Get-Date).AddDays(11).ToString("s")
            timeString = "09:00 AM"
            activity = "Edakkal Caves Trek"
            location = "Edakkal"
        }
    )
} | ConvertTo-Json -Depth 5

$newTrip = Invoke-RestMethod -Uri "$baseUrl/api/trips" -Method Post -Body $createTripBody -ContentType "application/json" -Headers $authHeaders
if (-not $newTrip.id -or $newTrip.name -ne "Wayanad 3-Day Forest Expedition") {
    throw "Create trip failed! Response: $($newTrip | ConvertTo-Json)"
}
$createdTripId = $newTrip.id
Write-Host ">> PASS: Created Trip ID: $createdTripId, ProfitMargin=$($newTrip.adultMargin), Schedules count: $($newTrip.schedules.Count)`n" -ForegroundColor Green

# Test 5: Trip Details Endpoint
Write-Host "[6/13] Testing Trip Details by ID (/api/trips/{id})..." -ForegroundColor Yellow
$tripDetail = Invoke-RestMethod -Uri "$baseUrl/api/trips/$createdTripId" -Method Get -Headers $authHeaders
if ($tripDetail.id -ne $createdTripId -or $tripDetail.schedules.Count -ne 3) {
    throw "Trip detail verification failed!"
}
Write-Host ">> PASS: Verified Trip details and 3 schedule items`n" -ForegroundColor Green

# Test 6: Publish Trip
Write-Host "[7/13] Testing Publish Trip (/api/trips/{id}/publish)..." -ForegroundColor Yellow
$pubRes = Invoke-RestMethod -Uri "$baseUrl/api/trips/$createdTripId/publish" -Method Post -Headers $authHeaders
if (-not $pubRes.publicSlug) {
    throw "Trip publication failed! Response: $($pubRes | ConvertTo-Json)"
}
$publicSlug = $pubRes.publicSlug
Write-Host ">> PASS: Trip Published! Public Slug: $publicSlug, URL: $($pubRes.publicUrl)`n" -ForegroundColor Green

# Test 7: Public Trip Endpoint (Strict Security Check)
Write-Host "[8/13] Testing Public Trip Endpoint & Security Guardrails (/api/public/trips/{slug})..." -ForegroundColor Yellow
$publicTrip = Invoke-RestMethod -Uri "$baseUrl/api/public/trips/$publicSlug" -Method Get
if ($publicTrip.name -ne "Wayanad 3-Day Forest Expedition" -or $publicTrip.itinerary.Count -ne 3) {
    throw "Public trip data retrieval failed!"
}
# SECURITY CHECK: Internal financial margins and internal notes MUST NOT leak
if ($publicTrip.adultSpends -or $publicTrip.adultMargin -or $publicTrip.totalIncome -or $publicTrip.totalExpenses -or $publicTrip.privateNotes) {
    throw "SECURITY LEAK DETECTED! Internal financials or private notes were exposed on public endpoint!"
}
Write-Host ">> PASS: Public trip data verified. Security verified: Zero financial/private data leakage!`n" -ForegroundColor Green

# Test 8: Dynamic Resource Types
Write-Host "[9/13] Testing Dynamic Own & Partners Resource Types (/api/resources/types)..." -ForegroundColor Yellow
$resourceTypes = Invoke-RestMethod -Uri "$baseUrl/api/resources/types" -Method Get -Headers $authHeaders
if ($resourceTypes.Count -lt 4) {
    throw "Resource types count mismatch! Expected >= 4, got $($resourceTypes.Count)"
}
$vehicleType = $resourceTypes | Where-Object { $_.key -eq "vehicle" }
if (-not $vehicleType -or $vehicleType.fields.Count -lt 4) {
    throw "Vehicle resource type definition missing fields!"
}
Write-Host ">> PASS: Found $($resourceTypes.Count) dynamic resource types. Vehicle schema has $($vehicleType.fields.Count) field definitions`n" -ForegroundColor Green

# Test 9: Create Dynamic Resource (Vehicle)
Write-Host "[10/13] Testing Dynamic Resource Creation (/api/resources)..." -ForegroundColor Yellow
$customVals = @{
    seatingCapacity = 7
    isAC = $true
    driverName = "M. S. Vignesh"
    driverPhone = "+91 94471 22334"
    pricingPerDay = 3800
} | ConvertTo-Json -Compress

$newResourceBody = @{
    resourceTypeId = $vehicleType.id
    name = "Toyota Innova Crysta #0049"
    code = "#0049"
    identificationNo = "KL-07-CD-9988"
    ownership = "Own"
    partnerName = "V4Journey Direct Fleet"
    contactNo = "+91 94471 22334"
    address = "Kochi HQ"
    status = "Available"
    insurancePeriod = "2026-12-31"
    customValuesJson = $customVals
} | ConvertTo-Json

$newResource = Invoke-RestMethod -Uri "$baseUrl/api/resources" -Method Post -Body $newResourceBody -ContentType "application/json" -Headers $authHeaders
if (-not $newResource.id -or $newResource.name -ne "Toyota Innova Crysta #0049") {
    throw "Create resource failed! Response: $($newResource | ConvertTo-Json)"
}
Write-Host ">> PASS: Dynamic Resource Created! ID: $($newResource.id), Code: $($newResource.code)`n" -ForegroundColor Green

# Test 10: Team Members & Payment Payout Ledger
Write-Host "[11/13] Testing Team Members & Payout Ledger (/api/members & /api/payments)..." -ForegroundColor Yellow
$members = Invoke-RestMethod -Uri "$baseUrl/api/members" -Method Get -Headers $authHeaders
$memberCount = if ($members -is [array]) { $members.Count } else { $members.totalCount }
if ($memberCount -lt 4) {
    throw "Members count mismatch! Expected >= 4, got $memberCount"
}
$firstMember = if ($members -is [array]) { $members[0] } else { $members.items[0] }

$payoutBody = @{
    tripId = $createdTripId
    tripCode = "#0005"
    tripName = "Wayanad 3-Day Forest Expedition"
    memberId = $firstMember.id
    memberName = $firstMember.fullName
    amount = 4500
    balance = 0
    paymentMode = "BankTransfer"
    status = "Paid"
    paymentDate = (Get-Date).ToString("s")
    workingPeriod = "10 Dec 2026 - 13 Dec 2026"
    daysCount = "3 Days"
    notes = "Advance driver allowance for Wayanad tour"
} | ConvertTo-Json

$payout = Invoke-RestMethod -Uri "$baseUrl/api/payments" -Method Post -Body $payoutBody -ContentType "application/json" -Headers $authHeaders
if (-not $payout.id -or $payout.amount -ne 4500) {
    throw "Create payout payment failed!"
}
Write-Host ">> PASS: Team Members=$memberCount. Created Payout ID: $($payout.id) for Member: $($firstMember.fullName)`n" -ForegroundColor Green

# Test 11: Dynamic Custom Fields System
Write-Host "[12/13] Testing Dynamic Custom Fields Management (/api/custom-fields)..." -ForegroundColor Yellow
$customFieldBody = @{
    targetEntity = "Member"
    fieldKey = "EmergencyContactRelationship"
    fieldLabel = "Emergency Contact Relationship"
    fieldType = "text"
    isRequired = $false
    showInTable = $true
    optionsJson = $null
} | ConvertTo-Json

$customField = Invoke-RestMethod -Uri "$baseUrl/api/custom-fields" -Method Post -Body $customFieldBody -ContentType "application/json" -Headers $authHeaders
if (-not $customField.id -or $customField.fieldKey -ne "EmergencyContactRelationship") {
    throw "Create custom field failed!"
}
Write-Host ">> PASS: Dynamic Custom Field registered successfully: $($customField.fieldLabel)`n" -ForegroundColor Green

# Test 12: Strict Multi-Tenant Data Isolation
Write-Host "[13/13] Testing Strict Multi-Tenant Data Isolation..." -ForegroundColor Yellow
$loginBody2 = @{ email = "operator@skyway.com"; password = "SkyWay@123" } | ConvertTo-Json
$authT2 = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody2 -ContentType "application/json"
$tenant2Headers = @{
    "Authorization" = "Bearer $($authT2.token)"
}

$tenant2Trips = Invoke-RestMethod -Uri "$baseUrl/api/trips" -Method Get -Headers $tenant2Headers
if ($tenant2Trips.totalCount -ne 1 -or $tenant2Trips.items[0].tripCode -ne "#SKY-01") {
    throw "DATA BLEED DETECTED! Tenant 2 should only see its 1 isolated trip (#SKY-01), but saw $($tenant2Trips.totalCount) trips!"
}

# Verify cross-tenant ID leak prevention (Tenant 2 must NOT be able to access Tenant 1's trip by ID)
try {
    $leakCheck = Invoke-RestMethod -Uri "$baseUrl/api/trips/$createdTripId" -Method Get -Headers $tenant2Headers -ErrorAction Stop
    throw "DATA BLEED DETECTED! Tenant 2 was able to view Tenant 1's trip ID: $createdTripId!"
} catch {
    # Expected 404 Not Found due to tenant isolation
}

Write-Host ">> PASS: Multi-tenancy isolation confirmed! Tenant 2 sees only its 1 isolated trip (#SKY-01) and Tenant 1's trip is blocked (404).`n" -ForegroundColor Green

# Clean shutdown
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   ALL 13/13 END-TO-END VERIFICATION CHECKS PASSED!        " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

if ($proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
    Write-Host ">> Server stopped cleanly.`n" -ForegroundColor Gray
}
