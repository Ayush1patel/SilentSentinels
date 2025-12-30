# Silent Sentinel - Setup & Startup Guide

Emergency sound detection system for deaf, hard-of-hearing, and elderly users.

## System Features

- **Real-time Sound Detection**: YAMNet + Custom Gunshot Model
- **Claude AI Verification**: Confirms emergencies with high accuracy
- **MCP Emergency Tools**: 5 integrated emergency response tools
- **Cross-platform**: Works on Mac, Linux, and Windows

---

## Prerequisites

### Required
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### Optional (for development)
- Git (for cloning/updating)
- Your `.env` file with `ANTHROPIC_API_KEY`

---

## Installation & Startup

### Option 1: Using start.sh (Mac/Linux/Git Bash)

```bash
# Make the script executable (first time only)
chmod +x start.sh

# Run the startup script
./start.sh
```

The script will:
1. Navigate to the `server` folder
2. Install dependencies (if needed)
3. Start the server on port 3000
4. Automatically open your browser to `http://localhost:3000`

---

### Option 2: Manual Startup (Any Platform)

#### Step 1: Install Dependencies
```bash
cd server
npm install
```

#### Step 2: Start the Server
```bash
node server.js
```

#### Step 3: Open in Browser
Visit `http://localhost:3000` in your web browser

---

## Configuration

### 1. Create `.env` file

Create a file at `server/.env`:

```env
# Required - Get from https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-your-api-key-here

# Optional
PORT=3000

# Emergency Contacts for WhatsApp Alerts (comma-separated)
# Format: E.164 format (+[country_code][phone_number])
# Examples: +14155552671,+447911123456,+919876543210
EMERGENCY_CONTACTS=+1234567890,+0987654321
```

### Emergency Contacts Setup

The `send_whatsapp_alert` MCP tool uses contacts from the `EMERGENCY_CONTACTS` environment variable.

**Format:** Comma-separated phone numbers in E.164 format
```
EMERGENCY_CONTACTS=+1-555-0100,+1-555-0101,+44-20-7946-0958
```

**Examples by Country:**
- 🇺🇸 USA: `+1-555-0100`
- 🇬🇧 UK: `+44-20-7946-0958`
- 🇮🇳 India: `+91-11-2671-9001`
- 🇨🇦 Canada: `+1-416-555-0123`
- 🇦🇺 Australia: `+61-2-5550-0100`

**Security Note:**
- ⚠️ Never commit `.env` to git
- Never share your API key or emergency contacts
- Use `.gitignore` to exclude `.env`
- Rotate API keys periodically

---

## API Endpoints

Once running, these endpoints are available:

### Safety Status
```bash
curl http://localhost:3000/api/safety-status
```

### Emergency Logs
```bash
curl http://localhost:3000/api/emergency-logs?limit=50
```

### Available Tools
```bash
curl http://localhost:3000/api/tools
```

### Reset Status
```bash
curl -X POST http://localhost:3000/api/reset-status
```

---

## MCP Emergency Tools

The system includes 5 autonomous emergency response tools:

| Tool | Purpose |
|------|---------|
| `send_whatsapp_alert` | Send emergency WhatsApp notifications |
| `trigger_emergency_protocol` | Activate emergency responses (weapon/fire/intrusion/medical/disaster) |
| `log_emergency_event` | Persist events for analysis and evidence |
| `get_user_safety_status` | Check current safety level and risk score |
| `escalate_to_emergency_services` | Format 911-ready reports with accessibility info |

All tools are triggered automatically by Claude when emergencies are detected.

---

## Sound Detection

### Immediate Triggers (Single Detection)

| Sound Type | Confidence | Trigger |
|-----------|-----------|---------|
| Glass breaking | 30%+ | EMERGENCY |
| Gunshot | 2+ labels OR 15%+ | EMERGENCY |
| Fire alarm | 25%+ | EMERGENCY |
| Screams | 35%+ | EMERGENCY |

### Detection Flow

1. **YAMNet** classifies sound
2. **Local Detection Logic** checks immediate threats
3. **Claude AI** verifies emergency (analyzes patterns & context)
4. **MCP Tools** activate response (if emergency confirmed)

---

## Troubleshooting

### Port Already in Use
```bash
# Change port in server/server.js or use:
PORT=3001 node server.js
```

### Dependencies Won't Install
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Browser Won't Open Automatically
- Manually open `http://localhost:3000`
- Check console for any error messages

### Sound Detection Not Working
1. Allow microphone access in browser
2. Check browser console for errors (F12)
3. Ensure YAMNet model loads (check console)

### Claude API Errors
1. Check `.env` file has correct API key
2. Verify API key has sufficient quota
3. Check rate limits: `429` errors mean too many requests

---

## Project Structure

```
.
├── server/
│   ├── server.js          # Express app + API routes
│   ├── mcp.js            # MCP emergency tools
│   ├── package.json      # Dependencies
│   └── .env              # Your API key (create this)
├── client/
│   ├── index.html        # Main UI
│   ├── app.js            # App initialization
│   └── js/
│       ├── detection.js  # YAMNet + sound detection
│       ├── api.js        # API communication
│       └── ui.js         # UI updates
└── start.sh              # Startup script
```

---

## Development Notes

### Detection Logic (detection.js)
- **Lines 275-348**: Emergency sound detection with immediate triggers
- Glass, gunshots, fire alarms, screams checked first
- Then custom model gunshot detection
- Then pattern-based detection

### Claude Verification (server.js)
- **Lines 49-73**: Safety-first prompt for Claude
- Treats all gun-related/glass/alarm sounds as HIGH-RISK
- False positives acceptable, false negatives NOT acceptable

### MCP Tools (mcp.js)
- **Lines 79-440**: 5 emergency response tools
- Each tool updates safety status in real-time
- All events logged to `emergency_logs.json`

---

## Safety Guidelines

1. **False Alarms are OK** - Better safe than sorry
2. **Test Regularly** - Ensure mic & detection working
3. **Update Contacts** - Keep emergency numbers current
4. **Check Logs** - Review `emergency_logs.json` periodically
5. **Stay Aware** - System is a safety aid, not a replacement for vigilance

---

## Support

For issues or questions:
1. Check the browser console (F12) for errors
2. Check server logs for API errors
3. Verify `.env` configuration
4. Ensure Node.js/npm are up to date

---

## License & Attribution

Silent Sentinel - Emergency Detection System for Deaf & Hard-of-Hearing Users

**Built with:**
- YAMNet (Google MediaPipe)
- Claude AI (Anthropic)
- Model Context Protocol (Anthropic)
