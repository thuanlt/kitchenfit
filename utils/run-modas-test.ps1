# ══════════════════════════════════════════════════
#  FPT AI Model Daily Test
#  Chạy JMeter → Parse kết quả → Gửi lên Checkly
#  Schedule: Task Scheduler chạy hàng ngày
# ══════════════════════════════════════════════════

# ── CONFIG ─────────────────────────────────────────
$JMETER_HOME    = "C:\Users\ThuanLT11\Documents\Thuan\jmeter\apache-jmeter-5.6.3\bin\jmeter.bat"
$JMX_FILE       = "C:\Users\ThuanLT11\Documents\Thuan\jmeter\modas.jmx"  # OK
$REPORT_DIR     = "C:\Users\ThuanLT11\Documents\Thuan\jmeter-reports"
$RESULT_CSV     = "$REPORT_DIR\result-$(Get-Date -Format 'yyyy-MM-dd').csv"
$LOG_FILE       = "$REPORT_DIR\run-$(Get-Date -Format 'yyyy-MM-dd').log"

$CHECKLY_PING   = "https://ping.checklyhq.com/9fa10154-3f8f-4c22-a817-ea82344390e9"
$CHECKLY_API    = "https://api.checklyhq.com/v1"
$CHECKLY_KEY    = "cu_f136970b18e34ef1bb8d497a2dd70bb1"
$CHECKLY_ACCT   = "6f519222-f81d-43ab-bb93-18a75cf8bef1"

$PROXY_HOST     = "10.36.252.45"
$PROXY_PORT     = "8080"

# ── SETUP ───────────────────────────────────────────
if (!(Test-Path $REPORT_DIR)) { New-Item -ItemType Directory -Path $REPORT_DIR | Out-Null }

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts  $msg" | Tee-Object -FilePath $LOG_FILE -Append
}

function SendProxy($url, $method = "GET", $body = $null, $headers = @{}) {
    $proxy = "http://$PROXY_HOST`:$PROXY_PORT"
    $iwrParams = @{
        Uri             = $url
        Method          = $method
        Proxy           = $proxy
        UseBasicParsing = $true
        TimeoutSec      = 30
    }
    if ($headers.Count -gt 0) { $iwrParams.Headers = $headers }
    if ($body) {
        $iwrParams.Body        = $body
        $iwrParams.ContentType = "application/json"
    }
    $resp = Invoke-WebRequest @iwrParams
    return $resp.Content
}

# ── BƯỚC 1: Chạy JMeter ────────────────────────────
Log "=== BẮT ĐẦU FPT AI MODEL DAILY TEST ==="
Log "JMX: $JMX_FILE"
Log "Output: $RESULT_CSV"

# Remove old report
if (Test-Path $RESULT_CSV) { Remove-Item $RESULT_CSV -Force }

$jmeterArgs = @(
    "-n",                          # Non-GUI mode
    "-t", $JMX_FILE,              # Test file
    "-l", $RESULT_CSV,            # Result log
    "-Jthreads=1",                # 1 thread
    "-Jrampup=1",                 
    "-Jiterations=1"              
)

Log "Chạy JMeter..."
$startTime = Get-Date
try {
    $process = Start-Process -FilePath $JMETER_HOME `
        -ArgumentList $jmeterArgs `
        -Wait -PassThru -NoNewWindow
    $exitCode = $process.ExitCode
    Log "JMeter exit code: $exitCode"
} catch {
    Log "LỖI chạy JMeter: $_"
    $exitCode = 1
}
$endTime   = Get-Date
$duration  = [math]::Round(($endTime - $startTime).TotalSeconds, 1)
Log "Thời gian chạy: ${duration}s"

# ── BƯỚC 2: Parse kết quả CSV ──────────────────────
$totalTests   = 0
$passedTests  = 0
$failedTests  = 0
$totalTime    = 0
$results      = @()

if (Test-Path $RESULT_CSV) {
    $csvData = Import-Csv $RESULT_CSV
    foreach ($row in $csvData) {
        $totalTests++
        $elapsed = [int]$row.elapsed
        $totalTime += $elapsed
        $success = $row.success -eq "true"

        if ($success) { $passedTests++ } else { $failedTests++ }

        $results += [PSCustomObject]@{
            name        = $row.label
            status      = if ($success) { "PASSING" } else { "FAILING" }
            responseTime = $elapsed
            timestamp   = $row.timeStamp
        }
    }
    $avgResponseTime = if ($totalTests -gt 0) { [math]::Round($totalTime / $totalTests) } else { 0 }
    Log "Tổng tests: $totalTests | Pass: $passedTests | Fail: $failedTests | Avg: ${avgResponseTime}ms"
} else {
    Log "CẢNH BÁO: Không tìm thấy file kết quả CSV!"
    $failedTests = 1
}

# ── BƯỚC 3: Quyết định Pass/Fail ───────────────────
$overallPass = ($exitCode -eq 0) -and ($failedTests -eq 0) -and ($totalTests -gt 0)
$status = if ($overallPass) { "PASSING" } else { "FAILING" }
Log "Kết quả tổng: $status"

# ── BƯỚC 4: Gửi Heartbeat lên Checkly ─────────────
Log "Gửi heartbeat lên Checkly..."
try {
    if ($overallPass) {
        # Pass → ping URL để Checkly biết OK
        SendProxy -url $CHECKLY_PING -method "GET" | Out-Null
        Log "✅ Heartbeat PASS gửi thành công"
    } else {
        # Fail → không ping → Checkly tự báo alert sau grace period
        Log "❌ Heartbeat FAIL — không ping Checkly (sẽ tự alert)"
    }
} catch {
    Log "LỖI gửi heartbeat: $_"
}

# ── BƯỚC 5: Tạo Check Result trên Checkly API ──────
Log "Gửi kết quả chi tiết lên Checkly API..."
try {
    $checkHeaders = @{
        "Authorization"    = "Bearer $CHECKLY_KEY"
        "X-Checkly-Account" = $CHECKLY_ACCT
    }

    # Tìm check ID từ Checkly (tìm check tên "FPT AI Model Daily Test")
    $checksJson = SendProxy -url "$CHECKLY_API/checks" -method "GET" -headers $checkHeaders
    $checks = $checksJson | ConvertFrom-Json
    $targetCheck = $checks | Where-Object { $_.name -like "*FPT AI*" -or $_.name -like "*modas*" } | Select-Object -First 1

    if ($targetCheck) {
        $checkId = $targetCheck.id
        $resultBody = @{
            hasFailures    = -not $overallPass
            hasErrors      = ($exitCode -ne 0)
            isDegraded     = ($failedTests -gt 0 -and $passedTests -gt 0)
            overMaxResponseTime = $false
            runLocation    = "local-windows"
            startedAt      = $startTime.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            stoppedAt      = $endTime.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            responseTime   = if ($totalTests -gt 0) { $avgResponseTime } else { 0 }
            checkRunId     = [System.Guid]::NewGuid().ToString()
        } | ConvertTo-Json

        SendProxy -url "$CHECKLY_API/check-results/$checkId" -method "POST" -body $resultBody -headers $checkHeaders | Out-Null
        Log "✅ Kết quả chi tiết gửi lên Checkly thành công (Check ID: $checkId)"
    } else {
        Log "⚠️  Không tìm thấy check trên Checkly — chỉ gửi heartbeat"
    }
} catch {
    Log "LỖI gửi kết quả Checkly API: $_"
}

# ── BƯỚC 6: Lưu summary JSON ───────────────────────
$summaryFile = "$REPORT_DIR\summary-$(Get-Date -Format 'yyyy-MM-dd').json"
$summary = @{
    date         = (Get-Date -Format "yyyy-MM-dd")
    status       = $status
    totalTests   = $totalTests
    passed       = $passedTests
    failed       = $failedTests
    avgResponseTime = if ($totalTests -gt 0) { $avgResponseTime } else { 0 }
    durationSec  = $duration
    results      = $results
} | ConvertTo-Json -Depth 5

$summary | Out-File -FilePath $summaryFile -Encoding UTF8
Log "Summary lưu tại: $summaryFile"
Log "=== KẾT THÚC ==="

# ── RETURN EXIT CODE ────────────────────────────────
exit $(if ($overallPass) { 0 } else { 1 })
