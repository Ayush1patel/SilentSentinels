/**
 * MCP Tools Index
 * Registers all MCP tools with the server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// Import all tools
import * as sendWhatsAppAlert from "./send_whatsapp_alert.js";
import * as triggerEmergencyProtocol from "./trigger_emergency_protocol.js";
import * as logEmergencyEvent from "./log_emergency_event.js";
import * as getUserSafetyStatus from "./get_user_safety_status.js";
import * as escalateToEmergencyServices from "./escalate_to_emergency_services.js";

// Import state
import {
    safetyStatus,
    latestAlert,
    updateLatestAlert,
    resetSafetyStatus as resetStatus,
    getEmergencyLogs as getLogs,
    sendWhatsAppMessage,
    getTwilioClient,
    severityEmojis,
    addEmergencyLog
} from "./state.js";

// Initialize MCP Server
const mcpServer = new McpServer({
    name: "SilentSentinel",
    version: "1.0.0",
});

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

// ===== REGISTER ALL TOOLS =====

const tools = [
    sendWhatsAppAlert,
    triggerEmergencyProtocol,
    logEmergencyEvent,
    getUserSafetyStatus,
    escalateToEmergencyServices
];

// Register each tool with the MCP server
tools.forEach(tool => {
    mcpServer.tool(
        tool.name,
        tool.description,
        tool.schema,
        tool.handler
    );
});

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

// ===== EXPORTED FUNCTIONS FOR API ROUTES =====

export function updateAlert(alertData) {
    updateLatestAlert(alertData);
}

export function getSafetyStatus() {
    return safetyStatus;
}

export function getEmergencyLogs(limit = 50) {
    return getLogs(limit);
}

export function resetSafetyStatus() {
    return resetStatus();
}

export function getAvailableTools() {
    return tools.map(tool => ({
        name: tool.name,
        description: tool.description
    }));
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

    addEmergencyLog(alertLog);

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
