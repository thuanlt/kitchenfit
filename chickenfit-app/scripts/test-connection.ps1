# Test Supabase Connection with PowerShell

Write-Host "🔌 Testing Supabase Connection with PowerShell..." -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env.local
$envPath = Join-Path $PSScriptRoot "..\.env.local"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env.local file not found at: $envPath" -ForegroundColor Red
    exit 1
}

# Parse .env.local file
$envVars = @{}
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $envVars[$matches[1]] = $matches[2]
    }
}

$supabaseUrl = $envVars['NEXT_PUBLIC_SUPABASE_URL']
$anonKey = $envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (-not $supabaseUrl) {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_URL is not set" -ForegroundColor Red
    exit 1
}

Write-Host "📍 Testing connectivity to: $supabaseUrl" -ForegroundColor Yellow
Write-Host ""

# Test 1: Basic connectivity
Write-Host "Test 1: Basic HTTP connectivity..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri $supabaseUrl -Method Head -UseBasicParsing -TimeoutSec 30
    Write-Host "✅ HTTP Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: REST API connectivity
Write-Host "Test 2: REST API connectivity..." -ForegroundColor Green
if ($anonKey) {
    try {
        $headers = @{
            'apikey' = $anonKey
            'Authorization' = "Bearer $anonKey"
            'Content-Type' = 'application/json'
        }
        
        $apiUrl = "$supabaseUrl/rest/v1/recipes?limit=1"
        $response = Invoke-RestMethod -Uri $apiUrl -Method Get -Headers $headers -TimeoutSec 30
        
        Write-Host "✅ REST API is accessible!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ REST API failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set" -ForegroundColor Red
}

Write-Host ""

# Test 3: Auth service
Write-Host "Test 3: Auth service connectivity..." -ForegroundColor Green
if ($anonKey) {
    try {
        $headers = @{
            'apikey' = $anonKey
            'Authorization' = "Bearer $anonKey"
        }
        
        $authUrl = "$supabaseUrl/auth/v1/user"
        $response = Invoke-RestMethod -Uri $authUrl -Method Get -Headers $headers -TimeoutSec 30
        
        Write-Host "✅ Auth service is accessible!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  Auth service response: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($_.Exception.Response) {
            Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Connection tests completed!" -ForegroundColor Cyan