import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Anthropic } from "@anthropic-ai/sdk";
import path from "path";
import { fileURLToPath } from "url";
import {
  initMCP,
  updateAlert,
  getSafetyStatus,
  getEmergencyLogs,
  resetSafetyStatus,
  getAvailableTools,
  sendEmergencyAlert
} from "./mcp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());



// Serve static files from the client folder
app.use(express.static(path.join(__dirname, "../client")));

const apiKey = process.env.ANTHROPIC_API_KEY;
console.log("DEBUG: Loaded API Key:", apiKey ? `${apiKey.slice(0, 5)}...${apiKey.slice(-4)}` : "UNDEFINED");
console.log("DEBUG: .env file location:", path.join(process.cwd(), '.env'));

const anthropic = new Anthropic({
  apiKey: apiKey,
});

if (!apiKey) {
  console.warn("⚠️  WARNING: ANTHROPIC_API_KEY is missing in .env file.");
  console.warn("⚠️  AI verification will fail. Please edit server/.env");
}



app.post("/verify-sound", async (req, res) => {
  try {
    const { label, confidence, timestamp, history, userContext, patternAnalysis, top10Categories, isGunshot } = req.body;

    const systemPrompt = `You are an emergency sound verification AI for deaf, hard-of-hearing, and elderly users.

MISSION: MAXIMIZE USER SAFETY. Missing a real emergency is far worse than a false alarm.

IMMEDIATE EMERGENCY TRIGGERS (single detection is enough):

1. GUNSHOTS: If isGunshot=true OR "gunshot/machine gun/gunfire" in top10 → EMERGENCY
2. GLASS BREAKING: If "glass/shatter/smash" at 25%+ confidence → EMERGENCY (break-in)
3. EMERGENCY SIRENS: If "police/ambulance/siren/fire alarm" at 25%+ → EMERGENCY
4. SCREAMS: If "scream/shriek/yell" at 35%+ confidence → EMERGENCY

PATTERN TRIGGERS (check patternReason field):
- "GLASS_BREAK" → EMERGENCY (potential break-in)
- "POLICE_SIREN" → EMERGENCY (police nearby - danger or help needed)
- "AMBULANCE_SIREN" → EMERGENCY (medical emergency nearby)
- "FIRE_ALARM" → EMERGENCY (fire detected)
- "EMERGENCY_SIREN" → EMERGENCY (general emergency)
- "DISTRESS" → EMERGENCY (someone in distress)

CRITICAL RULES:
- Police/ambulance sirens at HIGH confidence (50%+) = DEFINITE EMERGENCY
- These sounds happen ONCE in real emergencies - respond immediately
- False positives are acceptable, false negatives are NOT

Output ONLY valid JSON:
{"emergency": boolean, "reason": "brief explanation", "recommendation": "specific action for deaf user"}`;

    // Build rich context for Claude
    const historyWithConf = history ? history.map(h => ({
      sound: h.label,
      conf: (h.score * 100).toFixed(0) + '%',
      critical: h.isCritical
    })) : [];

    const userMessage = JSON.stringify({
      currentSound: label,
      confidence: (confidence * 100).toFixed(1) + '%',
      isGunshot: isGunshot || false,
      pattern: patternAnalysis || { criticalCount: 0, highConfidenceCount: 0 },
      top10: top10Categories || [],
      recentHistory: historyWithConf.slice(-10),
      context: userContext
    });

    console.log("📤 Sending to Claude:", userMessage);

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 256,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const text = message.content[0].text;
    console.log("📥 Claude response:", text);

    // Clean up markdown formatting if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Attempt to extract JSON if there's still extra text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : cleanText;

    const parsed = JSON.parse(jsonStr);

    updateAlert(parsed);

    res.json(parsed);
  } catch (err) {
    console.error("Claude error:", err);

    // Handle rate limit errors specifically
    if (err.status === 429) {
      const retryAfter = err.headers?.['retry-after'] || err.headers?.['anthropic-ratelimit-input-tokens-reset'] || '60';
      return res.status(429).json({
        emergency: false,
        reason: "Rate limit exceeded. Please wait.",
        recommendation: "System will retry automatically"
      });
    }

    // Fallback safe response for other errors
    res.status(500).json({
      emergency: false,
      reason: "Verification couldn't complete",
      recommendation: "Check manually"
    });
  }
});

// ===== MCP API ENDPOINTS =====

// GET /api/safety-status - Current safety status & risk level
app.get("/api/safety-status", (req, res) => {
  const status = getSafetyStatus();
  res.json(status);
});

// GET /api/emergency-logs - View logged emergency events
app.get("/api/emergency-logs", (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = getEmergencyLogs(limit);
  res.json({ logs, total: logs.length });
});

// GET /api/tools - List available MCP tools
app.get("/api/tools", (req, res) => {
  const tools = getAvailableTools();
  res.json({ tools, count: tools.length });
});

// POST /api/execute-tool - Manually test/execute MCP tools
app.post("/api/execute-tool", async (req, res) => {
  const { tool, params } = req.body;

  if (!tool) {
    return res.status(400).json({ error: "Tool name required" });
  }

  // This endpoint allows testing tools via REST API
  // In production, tools are called by Claude through MCP
  const availableTools = getAvailableTools();
  const toolExists = availableTools.find(t => t.name === tool);

  if (!toolExists) {
    return res.status(404).json({
      error: `Tool '${tool}' not found`,
      available: availableTools.map(t => t.name)
    });
  }

  res.json({
    message: `Tool '${tool}' is available`,
    description: toolExists.description,
    params: params || {},
    note: "Tools are executed by Claude through MCP protocol. Use /sse for MCP connection."
  });
});

// POST /api/reset-status - Reset safety status
app.post("/api/reset-status", (req, res) => {
  const status = resetSafetyStatus();
  res.json({ message: "Safety status reset", status });
});

// POST /api/send-alert - Send emergency alert to contacts
app.post("/api/send-alert", async (req, res) => {
  const { message, severity, soundType, reason } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const result = await sendEmergencyAlert({
      message,
      severity: severity || "critical",
      soundType,
      reason
    });
    res.json(result);
  } catch (err) {
    console.error("Alert send error:", err);
    res.status(500).json({ error: "Failed to send alert", details: err.message });
  }
});

// Start server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
  console.log(`👉 Open http://localhost:${PORT} to view the app`);
  console.log("📡 API Endpoints:");
  console.log("   GET  /api/safety-status  - Current safety status");
  console.log("   GET  /api/emergency-logs - View emergency logs");
  console.log("   GET  /api/tools          - List MCP tools");
  console.log("   POST /api/send-alert     - Send WhatsApp alert to contacts");
  console.log("   POST /api/reset-status   - Reset safety status");
  initMCP(app);
});
