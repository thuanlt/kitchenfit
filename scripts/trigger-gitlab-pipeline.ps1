# GitLab Pipeline Trigger Script for PowerShell
#
# Usage:
#   .\scripts\trigger-gitlab-pipeline.ps1
#   .\scripts\trigger-gitlab-pipeline.ps1 -Env prod
#   .\scripts\trigger-gitlab-pipeline.ps1 -Branch develop -Suite api
#
# Prerequisites:
#   - PowerShell 5.1 or later
#   - .env file with required variables

param(
    [string]$Branch = "master",
    [ValidateSet("stg", "prod", "jp")]
    [string]$Env = "stg",
    [ValidateSet("smoke", "regression", "api")]
    [string]$Suite,
    [hashtable]$Variables = @{},
    [switch]$UseTriggerToken,
    [switch]$Wait,
    [switch]$DryRun,
    [switch]$Help
)

# Load environment variables from .env file
function Load-EnvFile {
    $envFile = ".env"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                # Remove quotes if present
                if ($value -match '^"(.*)"$') {
                    $value = $matches[1]
                } elseif ($value -match "^'(.*)'$") {
                    $value = $matches[1]
                }
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }
}

# Print help message
function Show-Help {
    Write-Host @"

GitLab Pipeline Trigger Script (PowerShell)

Usage:
  .\scripts\trigger-gitlab-pipeline.ps1 [options]

Options:
  -Branch <branch>        Branch to run pipeline on (default: master)
  -Env <environment>       Environment: stg, prod, jp (default: stg)
  -Suite <suite>          Test suite: smoke, regression, api
  -Variables <hashtable>  Custom variables (e.g., @{"BASE_URL"="https://custom.url"})
  -UseTriggerToken        Use trigger token instead of private token
  -Wait                   Wait for pipeline to complete
  -DryRun                 Show what would be triggered without actually triggering
  -Help                   Show this help message

Examples:
  # Trigger regression tests on staging
  .\scripts\trigger-gitlab-pipeline.ps1 -Env stg -Suite regression

  # Trigger API tests on production
  .\scripts\trigger-gitlab-pipeline.ps1 -Env prod -Suite api -Branch master

  # Trigger with custom variables
  .\scripts\trigger-gitlab-pipeline.ps1 -Variables @{"BASE_URL"="https://custom.url"}

  # Wait for pipeline to complete
  .\scripts\trigger-gitlab-pipeline.ps1 -Env prod -Wait

  # Dry run to see what would be triggered
  .\scripts\trigger-gitlab-pipeline.ps1 -Env prod -DryRun

Environment Variables:
  GITLAB_URL              GitLab instance URL (default: https://gitlab.com)
  GITLAB_PROJECT_ID       Project ID or path (e.g., namespace/project)
  GITLAB_PRIVATE_TOKEN    Personal access token (api scope)
  GITLAB_TRIGGER_TOKEN    Pipeline trigger token

"@
}

# Validate configuration
function Test-Configuration {
    $errors = @()

    if (-not $env:GITLAB_PROJECT_ID) {
        $errors += "GITLAB_PROJECT_ID is required"
    }

    if ($UseTriggerToken) {
        if (-not $env:GITLAB_TRIGGER_TOKEN) {
            $errors += "GITLAB_TRIGGER_TOKEN is required when using -UseTriggerToken"
        }
    } else {
        if (-not $env:GITLAB_PRIVATE_TOKEN) {
            $errors += "GITLAB_PRIVATE_TOKEN is required"
        }
    }

    if ($errors.Count -gt 0) {
        Write-Host "Configuration errors:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "  - $error" -ForegroundColor Red
        }
        Write-Host "`nPlease set the required environment variables in .env file" -ForegroundColor Yellow
        exit 1
    }
}

# Trigger pipeline using private token
function Invoke-PipelineWithPrivateToken {
    param(
        [string]$Branch,
        [string]$Env,
        [string]$Suite,
        [hashtable]$Variables,
        [switch]$DryRun
    )

    $gitlabUrl = $env:GITLAB_URL ?? "https://gitlab.com"
    $projectId = $env:GITLAB_PROJECT_ID
    $privateToken = $env:GITLAB_PRIVATE_TOKEN

    $encodedProjectId = [System.Web.HttpUtility]::UrlEncode($projectId)
    $url = "$gitlabUrl/api/v4/projects/$encodedProjectId/pipeline"

    $bodyVariables = @{
        "APP_ENV" = $Env
    }
    foreach ($key in $Variables.Keys) {
        $bodyVariables[$key] = $Variables[$key]
    }

    if ($Suite) {
        $bodyVariables["TEST_SUITE"] = $Suite
    }

    $body = @{
        "ref" = $Branch
        "variables" = $bodyVariables
    } | ConvertTo-Json -Depth 10

    Write-Host "`n=== Pipeline Trigger Info ===" -ForegroundColor Cyan
    Write-Host "URL: $url"
    Write-Host "Branch: $Branch"
    Write-Host "Environment: $Env"
    if ($Suite) {
        Write-Host "Suite: $Suite"
    }
    Write-Host "Variables: $($bodyVariables | ConvertTo-Json -Compress)"

    if ($DryRun) {
        Write-Host "`n[DRY RUN] Pipeline would be triggered with the above configuration." -ForegroundColor Yellow
        return $null
    }

    try {
        Write-Host "`nTriggering pipeline..." -ForegroundColor Green

        $headers = @{
            "PRIVATE-TOKEN" = $privateToken
            "Content-Type" = "application/json"
        }

        $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -Headers $headers

        Write-Host "`n✅ Pipeline triggered successfully!" -ForegroundColor Green
        Write-Host "Pipeline ID: $($response.id)"
        Write-Host "Web URL: $($response.web_url)"
        Write-Host "Status: $($response.status)"
        Write-Host "Created at: $($response.created_at)"

        return $response
    }
    catch {
        Write-Host "`n❌ Failed to trigger pipeline:" -ForegroundColor Red
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

# Trigger pipeline using trigger token
function Invoke-PipelineWithTriggerToken {
    param(
        [string]$Branch,
        [string]$Env,
        [string]$Suite,
        [hashtable]$Variables,
        [switch]$DryRun
    )

    $gitlabUrl = $env:GITLAB_URL ?? "https://gitlab.com"
    $projectId = $env:GITLAB_PROJECT_ID
    $triggerToken = $env:GITLAB_TRIGGER_TOKEN

    $encodedProjectId = [System.Web.HttpUtility]::UrlEncode($projectId)
    $url = "$gitlabUrl/api/v4/projects/$encodedProjectId/trigger/pipeline"

    $body = @{
        "token" = $triggerToken
        "ref" = $Branch
    }

    # Add variables
    $body["variables[APP_ENV]"] = $Env
    foreach ($key in $Variables.Keys) {
        $body["variables[$key]"] = $Variables[$key]
    }

    if ($Suite) {
        $body["variables[TEST_SUITE]"] = $Suite
    }

    Write-Host "`n=== Pipeline Trigger Info ===" -ForegroundColor Cyan
    Write-Host "URL: $url"
    Write-Host "Branch: $Branch"
    Write-Host "Environment: $Env"
    if ($Suite) {
        Write-Host "Suite: $Suite"
    }
    Write-Host "Variables: $($body | Out-String)"

    if ($DryRun) {
        Write-Host "`n[DRY RUN] Pipeline would be triggered with the above configuration." -ForegroundColor Yellow
        return $null
    }

    try {
        Write-Host "`nTriggering pipeline..." -ForegroundColor Green

        $response = Invoke-RestMethod -Uri $url -Method Post -Body $body

        Write-Host "`n✅ Pipeline triggered successfully!" -ForegroundColor Green
        Write-Host "Pipeline ID: $($response.id)"
        Write-Host "Web URL: $($response.web_url)"
        Write-Host "Status: $($response.status)"
        Write-Host "Created at: $($response.created_at)"

        return $response
    }
    catch {
        Write-Host "`n❌ Failed to trigger pipeline:" -ForegroundColor Red
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

# Wait for pipeline to complete
function Wait-PipelineCompletion {
    param(
        [int]$PipelineId
    )

    $gitlabUrl = $env:GITLAB_URL ?? "https://gitlab.com"
    $projectId = $env:GITLAB_PROJECT_ID
    $privateToken = $env:GITLAB_PRIVATE_TOKEN

    $encodedProjectId = [System.Web.HttpUtility]::UrlEncode($projectId)
    $url = "$gitlabUrl/api/v4/projects/$encodedProjectId/pipelines/$PipelineId"

    Write-Host "`nWaiting for pipeline $PipelineId to complete..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop waiting (pipeline will continue running)" -ForegroundColor Yellow

    $pollInterval = 10  # seconds
    $status = "pending"

    while ($status -in @("pending", "running")) {
        try {
            $headers = @{
                "PRIVATE-TOKEN" = $privateToken
            }

            $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
            $status = $response.status

            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Write-Host "[$timestamp] Status: $status"

            if ($status -eq "success") {
                Write-Host "`n✅ Pipeline completed successfully!" -ForegroundColor Green
                return $response
            }
            elseif ($status -in @("failed", "canceled", "skipped")) {
                Write-Host "`n❌ Pipeline $status!" -ForegroundColor Red
                Write-Host "View details: $($response.web_url)" -ForegroundColor Yellow
                return $response
            }

            Start-Sleep -Seconds $pollInterval
        }
        catch {
            Write-Host "Error polling pipeline status: $($_.Exception.Message)" -ForegroundColor Red
            Start-Sleep -Seconds $pollInterval
        }
    }
}

# Main function
function Main {
    # Show help if requested
    if ($Help) {
        Show-Help
        exit 0
    }

    # Load environment variables
    Load-EnvFile

    Write-Host "=" * 40 -ForegroundColor Cyan
    Write-Host "  GitLab Pipeline Trigger" -ForegroundColor Cyan
    Write-Host "=" * 40 -ForegroundColor Cyan

    # Validate configuration
    Test-Configuration

    try {
        # Trigger pipeline
        if ($UseTriggerToken) {
            $result = Invoke-PipelineWithTriggerToken `
                -Branch $Branch `
                -Env $Env `
                -Suite $Suite `
                -Variables $Variables `
                -DryRun:$DryRun
        }
        else {
            $result = Invoke-PipelineWithPrivateToken `
                -Branch $Branch `
                -Env $Env `
                -Suite $Suite `
                -Variables $Variables `
                -DryRun:$DryRun
        }

        # Wait for completion if requested
        if ($result -and -not $DryRun -and $Wait) {
            Wait-PipelineCompletion -PipelineId $result.id
        }

        if ($result -and -not $DryRun) {
            Write-Host "`n" + "=" * 40 -ForegroundColor Green
            Write-Host "Pipeline triggered successfully!" -ForegroundColor Green
            Write-Host "=" * 40 -ForegroundColor Green
        }
    }
    catch {
        Write-Host "`nFatal error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Run main function
Main
