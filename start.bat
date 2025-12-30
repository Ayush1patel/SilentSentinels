@echo off
REM Silent Sentinel Startup Script for Windows
REM Works in Command Prompt or PowerShell

echo.
echo 🚀 Starting Silent Sentinel Emergency Detection System...
echo.

REM Navigate to server directory
cd server
if errorlevel 1 (
    echo ❌ Error: Could not navigate to server directory
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Error: npm install failed
        pause
        exit /b 1
    )
    echo.
)

echo ✅ Dependencies ready
echo 🔧 Starting Node.js Server on Port 3000...
echo 🌐 Opening browser in 3 seconds...
echo.

REM Open browser in 3 seconds
timeout /t 3 /nobreak
start http://localhost:3000

echo 📡 MCP Emergency Tools Active
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Tools Available:
echo   1. send_whatsapp_alert
echo   2. trigger_emergency_protocol
echo   3. log_emergency_event
echo   4. get_user_safety_status
echo   5. escalate_to_emergency_services
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Start Server
node server.js

pause
