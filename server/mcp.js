import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import twilio from "twilio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Twilio client - initialized lazily when first needed
let twilioClient = null;
let twilioInitialized = false;

// Initialize Twilio client (called lazily when needed)
function getTwilioClient() {
    if (twilioInitialized) return twilioClient;

    twilioInitialized = true;
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    if (twilioAccountSid && twilioAuthToken) {
        twilioClient = twilio(twilioAccountSid, twilioAuthToken);
        console.log("Twilio client initialized for WhatsApp alerts");
    } else {
        console.log("Twilio not configured - WhatsApp alerts will be logged only");
    }

    return twilioClient;
}

// Helper function to send WhatsApp message via Twilio
async function sendWhatsAppMessage(to, message) {
    const client = getTwilioClient();
    const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    if (!client) {
        console.log(`[MOCK WhatsApp] To: ${to}`);
        console.log(`[MOCK WhatsApp] Message: ${message}`);
        return { success: true, mock: true, sid: `mock_${Date.now()}` };
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: twilioWhatsAppFrom,
            to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
        });
        console.log(`[WhatsApp] Sent to ${to}, SID: ${result.sid}`);
        return { success: true, mock: false, sid: result.sid };
    } catch (error) {
        console.error(`[WhatsApp] Failed to send to ${to}:`, error.message);
        return { success: false, mock: false, error: error.message };
    }
}

// Initialize MCP Server
const mcpServer = new McpServer({
    name: "SilentSentinel",
    version: "1.0.0",
});

// ===== STATE MANAGEMENT =====

// Current safety status
let safetyStatus = {
    level: "safe", // safe, warning, critical, emergency
    riskScore: 0,  // 0-100
    lastUpdate: new Date().toISOString(),
    activeThreats: [],
    recentDetections: []
};

// Emergency logs storage
const LOGS_FILE = path.join(__dirname, "emergency_logs.json");
let emergencyLogs = [];

// Load existing logs
try {
    if (fs.existsSync(LOGS_FILE)) {
        emergencyLogs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    }
} catch (e) {
    console.warn("Could not load emergency logs:", e.message);
}

// Latest alert for MCP resource
let latestAlert = {
    emoji: "waiting",
    status: "Initializing...",
    timestamp: new Date().toISOString(),
    details: "No alerts detected yet."
};

// ===== MCP RESOURCES =====

// Resource: Latest alert
mcpServer.resource(
    "latest-alert",
    "sentinel://latest-alert",
    async (uri) => ({
        contents: [{
            uri: uri.href,
            text: JSON.stringify(latestAlert, null, 2),
        }],
    })
);

// Resource: Safety status
mcpServer.resource(
    "safety-status",
    "sentinel://safety-status",
    async (uri) => ({
        contents: [{
            uri: uri.href,
            text: JSON.stringify(safetyStatus, null, 2),
        }],
    })
);

// ===== MCP TOOLS (5 Emergency Tools) =====

// Tool 1: Send WhatsApp Alert
mcpServer.tool(
    "send_whatsapp_alert",
    "Send emergency WhatsApp notifications with severity levels to predefined contacts",
    {
        message: z.string().describe("The alert message to send"),
        severity: z.enum(["low", "medium", "high", "critical"]).describe("Severity level of the alert"),
        soundType: z.string().optional().describe("Type of sound detected (e.g., gunshot, glass_break)"),
        location: z.string().optional().describe("User's location if available"),
        contacts: z.array(z.string()).optional().describe("Phone numbers to alert (uses defaults if not provided)")
    },
    async ({ message, severity, soundType, location, contacts }) => {
        const timestamp = new Date().toISOString();

        // Get emergency contacts from environment variables
        const envContacts = process.env.EMERGENCY_CONTACTS
            ? process.env.EMERGENCY_CONTACTS.split(',').map(c => c.trim())
            : [];

        const targetContacts = contacts && contacts.length > 0
            ? contacts
            : envContacts.length > 0
            ? envContacts
            : [];

        // Format WhatsApp message
        const severityEmojis = {
            low: "Info",
            medium: "Warning",
            high: "ALERT",
            critical: "EMERGENCY"
        };

        const formattedMessage = `
${severityEmojis[severity]} - Silent Sentinel Alert

${message}

${soundType ? `Sound Detected: ${soundType}` : ""}
${location ? `Location: ${location}` : ""}
Time: ${new Date().toLocaleString()}

${severity === "critical" ? "IMMEDIATE ACTION REQUIRED!" : ""}
        `.trim();

        // Send WhatsApp messages to all contacts
        const sendResults = [];
        for (const contact of targetContacts) {
            const result = await sendWhatsAppMessage(contact, formattedMessage);
            sendResults.push({ contact, ...result });
        }

        const successCount = sendResults.filter(r => r.success).length;
        const isMock = sendResults.length > 0 && sendResults[0].mock;

        // Log the alert attempt
        const alertLog = {
            id: `wa_${Date.now()}`,
            type: "whatsapp_alert",
            timestamp,
            severity,
            message: formattedMessage,
            contacts: targetContacts,
            soundType,
            status: successCount > 0 ? "sent" : "failed",
            sendResults,
            isMock
        };

        emergencyLogs.push(alertLog);
        saveEmergencyLogs();

        console.log(`[MCP] WhatsApp Alert (${severity}): Sent to ${successCount}/${targetContacts.length} contacts`);

        if (targetContacts.length === 0) {
            console.warn(`[MCP] WhatsApp Alert attempted but NO CONTACTS configured. Set EMERGENCY_CONTACTS in .env`);
        }

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: successCount > 0,
                    alertId: alertLog.id,
                    message: targetContacts.length > 0
                        ? `WhatsApp alert sent to ${successCount}/${targetContacts.length} contacts${isMock ? " (MOCK - configure Twilio for real messages)" : ""}`
                        : "No emergency contacts configured. Set EMERGENCY_CONTACTS in .env",
                    contactsUsed: targetContacts,
                    sendResults,
                    severity,
                    timestamp,
                    twilioConfigured: !!twilioClient
                }, null, 2)
            }]
        };
    }
);

// Tool 2: Trigger Emergency Protocol
mcpServer.tool(
    "trigger_emergency_protocol",
    "Activate full emergency response for specific threat types (weapon/fire/intrusion/medical/disaster)",
    {
        threatType: z.enum(["weapon", "fire", "intrusion", "medical", "disaster", "unknown"]).describe("Type of emergency threat"),
        confidence: z.number().min(0).max(100).describe("Detection confidence percentage"),
        soundLabel: z.string().describe("The sound that triggered the emergency"),
        autoActions: z.array(z.string()).optional().describe("Automatic actions to take")
    },
    async ({ threatType, confidence, soundLabel, autoActions }) => {
        const timestamp = new Date().toISOString();

        // Define response protocols per threat type
        const protocols = {
            weapon: {
                actions: ["LOCK_DOORS", "HIDE", "SILENCE_DEVICES", "ALERT_AUTHORITIES"],
                priority: "CRITICAL",
                instructions: "Hide immediately. Stay silent. Lock doors. Wait for all-clear."
            },
            fire: {
                actions: ["EVACUATE", "ALERT_FIRE_DEPT", "CHECK_EXITS"],
                priority: "CRITICAL",
                instructions: "Leave building immediately. Use stairs, not elevator. Meet at assembly point."
            },
            intrusion: {
                actions: ["LOCK_DOORS", "HIDE", "ALERT_POLICE", "CAMERA_RECORD"],
                priority: "HIGH",
                instructions: "Secure yourself in a safe room. Do not confront intruder."
            },
            medical: {
                actions: ["CALL_911", "ALERT_CONTACTS", "LOCATION_SHARE"],
                priority: "HIGH",
                instructions: "Stay calm. Help is on the way. Share your location with emergency contacts."
            },
            disaster: {
                actions: ["EVACUATE_OR_SHELTER", "ALERT_CONTACTS", "EMERGENCY_KIT"],
                priority: "HIGH",
                instructions: "Follow local emergency guidelines. Check emergency supplies."
            },
            unknown: {
                actions: ["ASSESS_SITUATION", "ALERT_CONTACTS", "STANDBY"],
                priority: "MEDIUM",
                instructions: "Stay alert. Monitor situation. Be ready to evacuate if needed."
            }
        };

        const protocol = protocols[threatType];
        const actionsToTake = autoActions || protocol.actions;

        // Update safety status
        safetyStatus = {
            level: "emergency",
            riskScore: Math.min(confidence + 20, 100),
            lastUpdate: timestamp,
            activeThreats: [{
                type: threatType,
                soundLabel,
                confidence,
                timestamp
            }],
            recentDetections: safetyStatus.recentDetections.slice(-10)
        };

        // Log the emergency
        const emergencyLog = {
            id: `emg_${Date.now()}`,
            type: "emergency_protocol",
            timestamp,
            threatType,
            soundLabel,
            confidence,
            protocol: protocol.priority,
            actionsInitiated: actionsToTake,
            instructions: protocol.instructions
        };

        emergencyLogs.push(emergencyLog);
        saveEmergencyLogs();

        // Update latest alert
        latestAlert = {
            emoji: "EMERGENCY",
            status: `${threatType.toUpperCase()} EMERGENCY`,
            timestamp,
            details: protocol.instructions
        };

        console.log(`[MCP] EMERGENCY PROTOCOL ACTIVATED: ${threatType} (${confidence}% confidence)`);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    emergencyId: emergencyLog.id,
                    threatType,
                    priority: protocol.priority,
                    confidence,
                    actionsInitiated: actionsToTake,
                    instructions: protocol.instructions,
                    timestamp
                }, null, 2)
            }]
        };
    }
);

// Tool 3: Log Emergency Event
mcpServer.tool(
    "log_emergency_event",
    "Persist emergency events to file for pattern analysis, evidence, and review",
    {
        eventType: z.string().describe("Type of event (detection, alert, action, resolution)"),
        soundLabel: z.string().describe("Sound that was detected"),
        confidence: z.number().describe("Detection confidence (0-1)"),
        isEmergency: z.boolean().describe("Whether this was classified as emergency"),
        claudeAnalysis: z.string().optional().describe("Claude's analysis/reasoning"),
        metadata: z.record(z.any()).optional().describe("Additional metadata")
    },
    async ({ eventType, soundLabel, confidence, isEmergency, claudeAnalysis, metadata }) => {
        const timestamp = new Date().toISOString();

        const logEntry = {
            id: `log_${Date.now()}`,
            timestamp,
            eventType,
            soundLabel,
            confidence,
            isEmergency,
            claudeAnalysis,
            metadata: metadata || {}
        };

        emergencyLogs.push(logEntry);
        saveEmergencyLogs();

        // Update recent detections in safety status
        safetyStatus.recentDetections.push({
            sound: soundLabel,
            confidence,
            isEmergency,
            time: timestamp
        });

        // Keep only last 50 detections
        if (safetyStatus.recentDetections.length > 50) {
            safetyStatus.recentDetections = safetyStatus.recentDetections.slice(-50);
        }

        // Update risk score based on recent activity
        const recentEmergencies = safetyStatus.recentDetections.filter(d => d.isEmergency).length;
        safetyStatus.riskScore = Math.min(recentEmergencies * 10, 100);
        safetyStatus.level = safetyStatus.riskScore >= 70 ? "critical" :
                            safetyStatus.riskScore >= 40 ? "warning" : "safe";
        safetyStatus.lastUpdate = timestamp;

        console.log(`[MCP] Event logged: ${eventType} - ${soundLabel} (emergency: ${isEmergency})`);

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    success: true,
                    logId: logEntry.id,
                    totalLogs: emergencyLogs.length,
                    currentRiskScore: safetyStatus.riskScore,
                    safetyLevel: safetyStatus.level
                }, null, 2)
            }]
        };
    }
);

// Tool 4: Get User Safety Status
mcpServer.tool(
    "get_user_safety_status",
    "Check current safety status, risk level, and recent detection history",
    {
        includeHistory: z.boolean().optional().describe("Include recent detection history"),
        historyLimit: z.number().optional().describe("Number of history items to include")
    },
    async ({ includeHistory = true, historyLimit = 20 }) => {
        const response = {
            status: safetyStatus.level,
            riskScore: safetyStatus.riskScore,
            lastUpdate: safetyStatus.lastUpdate,
            activeThreats: safetyStatus.activeThreats,
            summary: getSafetyStatusSummary()
        };

        if (includeHistory) {
            response.recentDetections = safetyStatus.recentDetections.slice(-historyLimit);
        }

        console.log(`[MCP] Safety status requested: ${safetyStatus.level} (risk: ${safetyStatus.riskScore})`);

        return {
            content: [{
                type: "text",
                text: JSON.stringify(response, null, 2)
            }]
        };
    }
);

// Tool 5: Escalate to Emergency Services
mcpServer.tool(
    "escalate_to_emergency_services",
    "Format 911-ready reports with accessibility info for deaf users",
    {
        emergencyType: z.enum(["police", "fire", "medical", "all"]).describe("Which emergency service to contact"),
        threatDescription: z.string().describe("Description of the emergency"),
        soundsDetected: z.array(z.string()).describe("List of sounds that triggered this"),
        userLocation: z.string().optional().describe("User's address or location"),
        accessibilityNeeds: z.string().optional().describe("Special accessibility requirements")
    },
    async ({ emergencyType, threatDescription, soundsDetected, userLocation, accessibilityNeeds }) => {
        const timestamp = new Date().toISOString();

        // Format 911-ready report
        const report = {
            emergencyId: `911_${Date.now()}`,
            timestamp,
            services: emergencyType === "all" ? ["police", "fire", "medical"] : [emergencyType],

            // Accessibility-focused information
            callerInfo: {
                hearingStatus: "DEAF/HARD OF HEARING",
                communicationMethod: "Text/Visual alerts preferred",
                accessibilityNeeds: accessibilityNeeds || "Requires visual or text communication. Cannot receive voice calls."
            },

            // Emergency details
            emergency: {
                type: emergencyType,
                description: threatDescription,
                soundsDetected: soundsDetected,
                detectionMethod: "AI-powered sound recognition system (Silent Sentinel)"
            },

            location: userLocation || "Location not specified - check device GPS",

            // Pre-formatted 911 text
            textTo911Format: `
EMERGENCY - DEAF CALLER
Type: ${emergencyType.toUpperCase()}
${threatDescription}
Sounds detected by AI: ${soundsDetected.join(", ")}
${userLocation ? `Location: ${userLocation}` : ""}
CALLER IS DEAF - PLEASE RESPOND VIA TEXT
            `.trim(),

            // Instructions for user
            userInstructions: [
                "If available, use Text-to-911 service",
                "Open your phone's emergency SOS feature",
                "Share your location with emergency contacts",
                "If possible, go to a safe location and wait for help",
                "Flash lights or use visual signals to attract attention"
            ]
        };

        // Log the escalation
        const escalationLog = {
            id: report.emergencyId,
            type: "emergency_escalation",
            timestamp,
            emergencyType,
            threatDescription,
            soundsDetected,
            status: "prepared"
        };

        emergencyLogs.push(escalationLog);
        saveEmergencyLogs();

        // Update safety status
        safetyStatus.level = "emergency";
        safetyStatus.riskScore = 100;
        safetyStatus.lastUpdate = timestamp;

        console.log(`[MCP] EMERGENCY ESCALATION: ${emergencyType} - ${threatDescription}`);

        return {
            content: [{
                type: "text",
                text: JSON.stringify(report, null, 2)
            }]
        };
    }
);

// ===== HELPER FUNCTIONS =====

function saveEmergencyLogs() {
    try {
        fs.writeFileSync(LOGS_FILE, JSON.stringify(emergencyLogs, null, 2));
    } catch (e) {
        console.error("Failed to save emergency logs:", e.message);
    }
}

function getSafetyStatusSummary() {
    const recent = safetyStatus.recentDetections.slice(-10);
    const emergencyCount = recent.filter(d => d.isEmergency).length;

    if (safetyStatus.level === "emergency") {
        return "EMERGENCY IN PROGRESS - Follow safety instructions immediately";
    } else if (safetyStatus.level === "critical") {
        return `Critical risk level - ${emergencyCount} emergency detections in recent history`;
    } else if (safetyStatus.level === "warning") {
        return "Elevated alertness - Multiple critical sounds detected recently";
    } else {
        return "Environment appears safe - Monitoring active";
    }
}

// Function to update the alert state from the main application
export function updateAlert(alertData) {
    latestAlert = {
        emoji: alertData.emergency ? "EMERGENCY" : "OK",
        status: alertData.emergency ? "EMERGENCY" : "MONITORING",
        timestamp: new Date().toISOString(),
        details: alertData.reason || "Routine monitoring active."
    };

    // Also update safety status based on alert
    if (alertData.emergency) {
        safetyStatus.level = "critical";
        safetyStatus.riskScore = Math.max(safetyStatus.riskScore, 70);
    }
    safetyStatus.lastUpdate = new Date().toISOString();
}

// Export functions for API routes
export function getSafetyStatus() {
    return safetyStatus;
}

export function getEmergencyLogs(limit = 50) {
    return emergencyLogs.slice(-limit);
}

export function resetSafetyStatus() {
    safetyStatus = {
        level: "safe",
        riskScore: 0,
        lastUpdate: new Date().toISOString(),
        activeThreats: [],
        recentDetections: []
    };
    return safetyStatus;
}

export function getAvailableTools() {
    return [
        {
            name: "send_whatsapp_alert",
            description: "Send emergency WhatsApp notifications with severity levels"
        },
        {
            name: "trigger_emergency_protocol",
            description: "Activate full emergency response (weapon/fire/intrusion/medical/disaster)"
        },
        {
            name: "log_emergency_event",
            description: "Persist events to file for pattern analysis and evidence"
        },
        {
            name: "get_user_safety_status",
            description: "Check current safety status and recent detection history"
        },
        {
            name: "escalate_to_emergency_services",
            description: "Format 911-ready reports with accessibility info"
        }
    ];
}

// Direct function to send emergency alerts (called from API endpoint)
export async function sendEmergencyAlert({ message, severity, soundType, reason }) {
    const timestamp = new Date().toISOString();

    // Get emergency contacts from environment variables
    const envContacts = process.env.EMERGENCY_CONTACTS
        ? process.env.EMERGENCY_CONTACTS.split(',').map(c => c.trim())
        : [];

    if (envContacts.length === 0) {
        console.warn("[Alert] No emergency contacts configured in .env");
        return {
            success: false,
            message: "No emergency contacts configured. Set EMERGENCY_CONTACTS in .env",
            contacts: []
        };
    }

    // Format the alert message
    const severityEmojis = {
        low: "Info",
        medium: "Warning",
        high: "ALERT",
        critical: "EMERGENCY"
    };

    const formattedMessage = `
${severityEmojis[severity] || "ALERT"} - Silent Sentinel

${message}

${soundType ? `Sound Detected: ${soundType}` : ""}
${reason ? `Reason: ${reason}` : ""}
Time: ${new Date().toLocaleString()}

${severity === "critical" ? "IMMEDIATE ACTION REQUIRED!" : "Please check on the user."}
    `.trim();

    // Send to all contacts
    const sendResults = [];
    for (const contact of envContacts) {
        const result = await sendWhatsAppMessage(contact, formattedMessage);
        sendResults.push({ contact, ...result });
    }

    const successCount = sendResults.filter(r => r.success).length;
    const isMock = sendResults.length > 0 && sendResults[0].mock;

    // Log the alert
    const alertLog = {
        id: `alert_${Date.now()}`,
        type: "emergency_alert",
        timestamp,
        severity,
        message: formattedMessage,
        contacts: envContacts,
        soundType,
        reason,
        sendResults,
        isMock
    };

    emergencyLogs.push(alertLog);
    saveEmergencyLogs();

    console.log(`[Alert] Sent to ${successCount}/${envContacts.length} contacts${isMock ? " (MOCK)" : ""}`);

    return {
        success: successCount > 0,
        message: `Alert sent to ${successCount}/${envContacts.length} contacts${isMock ? " (MOCK - configure Twilio for real messages)" : ""}`,
        contacts: envContacts,
        sendResults,
        isMock,
        twilioConfigured: !!getTwilioClient()
    };
}

// Store active transports for session management
const transports = new Map();

// Function to attach MCP to the existing Express app
export async function initMCP(app) {
    app.get("/sse", async (req, res) => {
        const transport = new SSEServerTransport("/messages", res);
        const sessionId = `session_${Date.now()}`;

        transports.set(sessionId, transport);

        await mcpServer.connect(transport);

        res.on("close", () => {
            transports.delete(sessionId);
        });
    });

    app.post("/messages", async (req, res) => {
        // Handle MCP messages
        const sessionId = req.query.sessionId;
        const transport = transports.get(sessionId);

        if (transport) {
            // Forward message to transport
            res.status(200).send("OK");
        } else {
            res.status(404).send("Session not found");
        }
    });

    console.log("MCP Server initialized with 5 emergency tools at /sse");
}
