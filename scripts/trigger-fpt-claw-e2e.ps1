"# Script to trigger FPT CLAW E2E test pipeline
# Usage: .\trigger-fpt-claw-e2e.ps1

param(
    [string]$GitLabUrl = $env:GITLAB_URL,
    [string]$ProjectId = $env:GITLAB_PROJECT_ID,
    [string]$PrivateToken = $env:GITLAB_PRIVATE_TOKEN,
    [string]$Ref = $env:GITLAB_REF
)

# Default values
if (-not $GitLabUrl) { $GitLabUrl = "gitlab.fci.vn" }
if (-not $ProjectId) { $ProjectId = "ncp-product/automation-testing/ncp_cloud/ai-factory/modas" }
if (-not $Ref) { $Ref = "master" }

# Validate token
if (-not $PrivateToken) {
    Write-Host "❌ Error: GITLAB_PRIVATE_TOKEN environment variable is required" -ForegroundColor Red
    Write-Host "Usage: `$env:GITLAB_PRIVATE_TOKEN='xxx'; .\trigger-fpt-claw-e2e.ps1" -ForegroundColor Yellow
    exit 1
}

# Encode project ID
$EncodedProjectId = [System.Web.HttpUtility]::UrlEncode($ProjectId)

# Prepare request body
$RequestBody = @{
    ref = $Ref
    variables = @(
        @{ key = "APP_ENV"; value = "stg"; variable_type = "env_var" },
        @{ key = "FPT_CLAW_URL"; value = "https://stg-claw.fptcloud.net"; variable_type = "env_var" }
    )
} | ConvertTo-Json -Depth 10

Write-Host "🚀 Triggering FPT CLAW E2E Test Pipeline..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📍 GitLab URL: $GitLabUrl" -ForegroundColor White
Write-Host "📦 Project ID: $ProjectId" -ForegroundColor White
Write-Host "🌿 Branch: $Ref" -ForegroundColor White
Write-Host "🌐 Target URL: https://stg-claw.fptcloud.net" -ForegroundColor White
Write-Host "🔧 Environment: stg" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Prepare headers
$Headers = @{
    "Content-Type" = "application/json"
    "PRIVATE-TOKEN" = $PrivateToken
}

# Make API request
try {
    $Url = "https://$GitLabUrl/api/v4/projects/$EncodedProjectId/pipeline"
    $Response = Invoke-RestMethod -Uri $Url -Method Post -Body $RequestBody -Headers $Headers
    
    Write-Host "✅ Pipeline triggered successfully!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "🔢 Pipeline ID: $($Response.id)" -ForegroundColor White
    Write-Host "🔗 Pipeline URL: $($Response.web_url)" -ForegroundColor Cyan
    Write-Host "📊 Status: $($Response.status)" -ForegroundColor White
    Write-Host "👤 Created by: $($Response.user.username)" -ForegroundColor White
    Write-Host "🕐 Created at: $($Response.created_at)" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "💡 Tip: Use the URL above to track pipeline progress" -ForegroundColor Yellow
    
    # Open pipeline URL in browser
    Write-Host "`n🌐 Opening pipeline URL in browser..." -ForegroundColor Cyan
    Start-Process $Response.web_url
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Add helpful tips
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Open the pipeline URL to track progress" -ForegroundColor White
Write-Host "   2. Check the fpt-claw-e2e-stg job for test execution" -ForegroundColor White
Write-Host "   3. Download artifacts to view test reports" -ForegroundColor White
Write-Host "   4. Review test results and fix any failures" -ForegroundColor White
Write-Host "`n⏱️  Estimated duration: ~30-45 minutes" -ForegroundColor Yellow
Write-Host "📧 You will receive notifications when the pipeline completes" -ForegroundColor Yellow
"