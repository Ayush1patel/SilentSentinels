/**
 * MCP Shared State and Helper Functions
 * Contains state management, Twilio integration, and utility functions
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import twilio from "twilio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== TWILIO CLIENT =====
let twilioClient = null;
let twilioInitialized = false;

export function getTwilioClient() {
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

// ===== WHATSAPP HELPER =====
export async function sendWhatsAppMessage(to, message) {
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

// ===== STATE MANAGEMENT =====

// Current safety status
export let safetyStatus = {
    level: "safe", // safe, warning, critical, emergency
    riskScore: 0,  // 0-100
    lastUpdate: new Date().toISOString(),
    activeThreats: [],
    recentDetections: []
};

// Emergency logs storage
const LOGS_FILE = path.join(__dirname, "..", "emergency_logs.json");
export let emergencyLogs = [];

// Load existing logs
try {
    if (fs.existsSync(LOGS_FILE)) {
        emergencyLogs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    }
} catch (e) {
    console.warn("Could not load emergency logs:", e.message);
}

// Latest alert for MCP resource
export let latestAlert = {
    emoji: "waiting",
    status: "Initializing...",
    timestamp: new Date().toISOString(),
    details: "No alerts detected yet."
};

// ===== STATE UPDATERS =====

export function updateSafetyStatus(newStatus) {
    safetyStatus = { ...safetyStatus, ...newStatus };
}

export function updateLatestAlert(alertData) {
    latestAlert = {
        emoji: alertData.emergency ? "EMERGENCY" : "OK",
        status: alertData.emergency ? "EMERGENCY" : "MONITORING",
        timestamp: new Date().toISOString(),
        details: alertData.reason || "Routine monitoring active."
    };

    if (alertData.emergency) {
        safetyStatus.level = "critical";
        safetyStatus.riskScore = Math.max(safetyStatus.riskScore, 70);
    }
    safetyStatus.lastUpdate = new Date().toISOString();
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

export function addEmergencyLog(logEntry) {
    emergencyLogs.push(logEntry);
    saveEmergencyLogs();
}

export function saveEmergencyLogs() {
    try {
        fs.writeFileSync(LOGS_FILE, JSON.stringify(emergencyLogs, null, 2));
    } catch (e) {
        console.error("Failed to save emergency logs:", e.message);
    }
}

export function getEmergencyLogs(limit = 50) {
    return emergencyLogs.slice(-limit);
}

export function getSafetyStatusSummary() {
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

// ===== SEVERITY HELPERS =====
export const severityEmojis = {
    low: "Info",
    medium: "Warning",
    high: "ALERT",
    critical: "EMERGENCY"
};
