/**
 * MCP Tool: Send WhatsApp Alert
 * Send emergency WhatsApp notifications with severity levels to predefined contacts
 */

import { z } from "zod";
import {
    sendWhatsAppMessage,
    addEmergencyLog,
    getTwilioClient,
    severityEmojis
} from "./state.js";

export const name = "send_whatsapp_alert";
export const description = "Send emergency WhatsApp notifications with severity levels to predefined contacts";

export const schema = {
    message: z.string().describe("The alert message to send"),
    severity: z.enum(["low", "medium", "high", "critical"]).describe("Severity level of the alert"),
    soundType: z.string().optional().describe("Type of sound detected (e.g., gunshot, glass_break)"),
    location: z.string().optional().describe("User's location if available"),
    contacts: z.array(z.string()).optional().describe("Phone numbers to alert (uses defaults if not provided)")
};

export async function handler({ message, severity, soundType, location, contacts }) {
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

    addEmergencyLog(alertLog);

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
                twilioConfigured: !!getTwilioClient()
            }, null, 2)
        }]
    };
}
