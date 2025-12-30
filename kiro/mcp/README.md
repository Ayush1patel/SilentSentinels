# 🔌 MCP Integrations

> Model Context Protocol tools powering Silent Sentinel's emergency response

---

## MCP Architecture

Silent Sentinel uses a **modular MCP architecture** with tools organized in `server/mcp/`:

```
server/mcp/
├── index.js                           # Registry & initialization
├── state.js                           # Shared state management
├── send_whatsapp_alert.js             # Twilio WhatsApp integration
├── trigger_emergency_protocol.js      # Full emergency sequence
├── log_emergency_event.js             # Audit trail
├── get_user_safety_status.js          # User response tracking
└── escalate_to_emergency_services.js  # Last resort escalation
```

---

## Available MCP Tools

### 📱 send_whatsapp_alert

**Purpose:** Send emergency alerts via WhatsApp using Twilio

```javascript
// Triggered automatically on emergency
await sendEmergencyAlert({
  message: "🚨 GUNSHOT DETECTED!",
  severity: "critical",
  soundType: "gunshot",
  reason: "Custom model 95% confidence"
});
```

**API Endpoint:** `POST /api/send-alert`

---

### 🚨 trigger_emergency_protocol

**Purpose:** Orchestrate full emergency response sequence

**Actions:**
1. Log the emergency event
2. Update safety status to CRITICAL
3. Send WhatsApp alert to contacts
4. Prepare escalation if user unresponsive

---

### 📝 log_emergency_event

**Purpose:** Record all emergency events for audit trail

**Data Captured:**
- Timestamp
- Sound detected
- Confidence level
- Pattern analysis
- User response
- Claude AI verdict

**API Endpoint:** `GET /api/emergency-logs`

---

### 🛡️ get_user_safety_status

**Purpose:** Track current safety level and user acknowledgment

**Returns:**
```json
{
  "riskLevel": "critical",
  "lastAlert": "2025-12-30T12:00:00Z",
  "userAcknowledged": false,
  "emergencyInProgress": true
}
```

**API Endpoint:** `GET /api/safety-status`

---

### 🆘 escalate_to_emergency_services

**Purpose:** Contact emergency services when user is unresponsive

**Trigger Conditions:**
- User hasn't responded to alert
- Emergency confirmed by AI
- Configurable timeout exceeded

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/safety-status` | GET | Current safety status |
| `/api/emergency-logs` | GET | View logged events |
| `/api/tools` | GET | List available MCP tools |
| `/api/send-alert` | POST | Send WhatsApp alert |
| `/api/reset-status` | POST | Reset safety status |
| `/api/execute-tool` | POST | Test/execute tools |

---

## Integration Flow

```
Detection Engine
       │
       ▼
┌─────────────────┐
│ Emergency       │
│ Detected        │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│ Claude AI       │──→ Verdict: EMERGENCY
│ Verification    │
└───────┬─────────┘
        │
        ▼
┌─────────────────────────────────────┐
│           MCP ORCHESTRATION         │
├─────────────────────────────────────┤
│ 1. log_emergency_event              │
│ 2. trigger_emergency_protocol       │
│ 3. send_whatsapp_alert → Twilio     │
│ 4. get_user_safety_status → Monitor │
│ 5. [if timeout] escalate_to_emergency_services │
└─────────────────────────────────────┘
```

---

## Twilio Integration

WhatsApp alerts are sent via Twilio's API:

```javascript
// Environment variables required
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
EMERGENCY_CONTACT_NUMBER=whatsapp:+1234567890
```

---

<p align="center">
  <sub>MCP architecture designed with Kiro IDE</sub>
</p>
