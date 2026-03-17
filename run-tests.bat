@echo off
:: ============================================================
:: FPT Marketplace — Full Test Suite Runner
:: Chạy tuần tự: api-inference → login → playground → create-api-key
:: ============================================================

SET PROJECT_DIR=c:\Users\ThuanLT11\Documents\Thuan\MCP
SET LOG_DIR=%PROJECT_DIR%\logs
SET NPX="C:\Program Files\nodejs\npx.cmd"

:: Thêm Node.js vào PATH để scheduler tìm thấy
SET PATH=C:\Program Files\nodejs;%PATH%
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do SET TIMESTAMP=%%i
SET LOG_FILE=%LOG_DIR%\test-run-%TIMESTAMP%.log

:: Tạo thư mục logs nếu chưa có
md "%LOG_DIR%" 2>nul

cd /d "%PROJECT_DIR%"

echo ============================================================ >> "%LOG_FILE%"
echo  FPT Marketplace Test Suite                                  >> "%LOG_FILE%"
echo  Started: %DATE% %TIME%                                      >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

echo [%TIME%] ===== STARTING TEST SUITE =====
echo [%TIME%] ===== STARTING TEST SUITE ===== >> "%LOG_FILE%"

:: ═════════════════════════════════════════════════════════════
:: OPTION: Run Full Test Suite (Sequential Mode)
:: Uncomment the section below to run login → playground → api-key
:: This runs all 3 tests sequentially in a single session
:: ═════════════════════════════════════════════════════════════
REM GOTO FULL_TESTSUITE

:: ═════════════════════════════════════════════════════════════
:: DEFAULT: Run Individual Tests
:: ═════════════════════════════════════════════════════════════

:: ─────────────────────────────────────────────
:: 1. API Inference Tests (parallel workers=3)
:: ─────────────────────────────────────────────
echo.
echo [%TIME%] [1/4] Running API Inference Tests...
echo [%TIME%] [1/4] Running API Inference Tests... >> "%LOG_FILE%"

%NPX% playwright test tests/api-inference.spec.ts --workers=3 --timeout=60000 --reporter=list >> "%LOG_FILE%" 2>&1
SET API_RESULT=%ERRORLEVEL%

if %API_RESULT% EQU 0 (
    echo [%TIME%] [1/4] API Inference: PASSED ✅
    echo [%TIME%] [1/4] API Inference: PASSED >> "%LOG_FILE%"
) else (
    echo [%TIME%] [1/4] API Inference: FAILED ❌ (exit code: %API_RESULT%)
    echo [%TIME%] [1/4] API Inference: FAILED (exit code: %API_RESULT%) >> "%LOG_FILE%"
)

:: ─────────────────────────────────────────────
:: 2. Login Test
:: ─────────────────────────────────────────────
echo.
echo [%TIME%] [2/4] Running Login Test...
echo [%TIME%] [2/4] Running Login Test... >> "%LOG_FILE%"

%NPX% playwright test tests/login.spec.ts --workers=1 --timeout=60000 --reporter=list >> "%LOG_FILE%" 2>&1
SET LOGIN_RESULT=%ERRORLEVEL%

if %LOGIN_RESULT% EQU 0 (
    echo [%TIME%] [2/4] Login: PASSED ✅
    echo [%TIME%] [2/4] Login: PASSED >> "%LOG_FILE%"
) else (
    echo [%TIME%] [2/4] Login: FAILED ❌ (exit code: %LOGIN_RESULT%)
    echo [%TIME%] [2/4] Login: FAILED (exit code: %LOGIN_RESULT%) >> "%LOG_FILE%"
)

:: ─────────────────────────────────────────────
:: 3. Playground Chat Test
:: ─────────────────────────────────────────────
echo.
echo [%TIME%] [3/4] Running Playground Chat Test...
echo [%TIME%] [3/4] Running Playground Chat Test... >> "%LOG_FILE%"

%NPX% playwright test tests/playground-chat.spec.ts --workers=1 --timeout=90000 --reporter=list >> "%LOG_FILE%" 2>&1
SET PLAYGROUND_RESULT=%ERRORLEVEL%

if %PLAYGROUND_RESULT% EQU 0 (
    echo [%TIME%] [3/4] Playground: PASSED ✅
    echo [%TIME%] [3/4] Playground: PASSED >> "%LOG_FILE%"
) else (
    echo [%TIME%] [3/4] Playground: FAILED ❌ (exit code: %PLAYGROUND_RESULT%)
    echo [%TIME%] [3/4] Playground: FAILED (exit code: %PLAYGROUND_RESULT%) >> "%LOG_FILE%"
)

:: ─────────────────────────────────────────────
:: 4. Create API Key Test
:: ─────────────────────────────────────────────
echo.
echo [%TIME%] [4/4] Running Create API Key Test...
echo [%TIME%] [4/4] Running Create API Key Test... >> "%LOG_FILE%"

%NPX% playwright test tests/create-api-key.spec.ts --workers=1 --timeout=60000 --reporter=list >> "%LOG_FILE%" 2>&1
SET APIKEY_RESULT=%ERRORLEVEL%

if %APIKEY_RESULT% EQU 0 (
    echo [%TIME%] [4/4] Create API Key: PASSED ✅
    echo [%TIME%] [4/4] Create API Key: PASSED >> "%LOG_FILE%"
) else (
    echo [%TIME%] [4/4] Create API Key: FAILED ❌ (exit code: %APIKEY_RESULT%)
    echo [%TIME%] [4/4] Create API Key: FAILED (exit code: %APIKEY_RESULT%) >> "%LOG_FILE%"
)

:: ─────────────────────────────────────────────
:: Summary
:: ─────────────────────────────────────────────
echo.
echo ============================================================
echo  SUMMARY — %DATE% %TIME%
echo ============================================================
echo  [1/4] API Inference : %API_RESULT%
echo  [2/4] Login         : %LOGIN_RESULT%
echo  [3/4] Playground    : %PLAYGROUND_RESULT%
echo  [4/4] Create API Key: %APIKEY_RESULT%
echo ============================================================
echo  Log saved to: %LOG_FILE%
echo ============================================================

echo. >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"
echo  SUMMARY                                                     >> "%LOG_FILE%"
echo  [1/4] API Inference : %API_RESULT%                         >> "%LOG_FILE%"
echo  [2/4] Login         : %LOGIN_RESULT%                       >> "%LOG_FILE%"
echo  [3/4] Playground    : %PLAYGROUND_RESULT%                  >> "%LOG_FILE%"
echo  [4/4] Create API Key: %APIKEY_RESULT%                      >> "%LOG_FILE%"
echo  Finished: %DATE% %TIME%                                     >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

:: Exit 0 nếu tất cả pass, 1 nếu có test fail
SET /A TOTAL=%API_RESULT%+%LOGIN_RESULT%+%PLAYGROUND_RESULT%+%APIKEY_RESULT%
exit /b %TOTAL%

:: ═════════════════════════════════════════════════════════════
:: SECTION: FULL TEST SUITE (Sequential Mode)
:: To run this instead, uncomment "GOTO FULL_TESTSUITE" above
:: ═════════════════════════════════════════════════════════════
:FULL_TESTSUITE

echo.
echo ============================================================
echo ✨ FULL TEST SUITE (Sequential: Login → Playground → API Key)
echo ============================================================
echo.

echo [%TIME%] Running Full Test Suite sequentially...
echo [%TIME%] Running Full Test Suite sequentially... >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

%NPX% playwright test tests/full-testsuite.spec.ts --headed --timeout=120000 --reporter=html --reporter=list >> "%LOG_FILE%" 2>&1
SET FULLSUITE_RESULT=%ERRORLEVEL%

echo.
if %FULLSUITE_RESULT% EQU 0 (
    echo ============================================================
    echo ✅ FULL TEST SUITE PASSED
    echo ============================================================
    echo [%TIME%] Test completed successfully
    echo [%TIME%] Test completed successfully >> "%LOG_FILE%"
) else (
    echo ============================================================
    echo ❌ FULL TEST SUITE FAILED (exit code: %FULLSUITE_RESULT%)
    echo ============================================================
    echo [%TIME%] Test failed - check logs
    echo [%TIME%] Test failed - exit code: %FULLSUITE_RESULT% >> "%LOG_FILE%"
)

echo.
echo 📊 HTML Report: %PROJECT_DIR%\playwright-report\index.html
echo.

echo [%TIME%] Test finished >> "%LOG_FILE%"
echo ============================================================ >> "%LOG_FILE%"

exit /b %FULLSUITE_RESULT%
