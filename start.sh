#!/bin/bash

# Cross-platform startup script for Silent Sentinel
# Works on macOS, Linux, and Windows (Git Bash/WSL)

echo "🚀 Starting Silent Sentinel Emergency Detection System..."
echo ""

# Navigate to server directory
cd server || exit 1

# Check/Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Dependencies ready"
echo "🔧 Starting Node.js Server on Port 3000..."
echo "🌐 Opening browser in 3 seconds..."
echo ""

# Detect OS and open browser accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    (sleep 3 && open "http://localhost:3000") &
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    (sleep 3 && xdg-open "http://localhost:3000" 2>/dev/null || echo "Please open http://localhost:3000 in your browser") &
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash)
    (sleep 3 && start "http://localhost:3000") &
else
    # Fallback for unknown OS
    echo "Please open http://localhost:3000 in your browser"
fi

echo "📡 MCP Emergency Tools Active"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Tools Available:"
echo "  1. send_whatsapp_alert"
echo "  2. trigger_emergency_protocol"
echo "  3. log_emergency_event"
echo "  4. get_user_safety_status"
echo "  5. escalate_to_emergency_services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Server
node server.js
