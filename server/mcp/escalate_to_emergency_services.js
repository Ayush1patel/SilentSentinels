/**
 * MCP Tool: Escalate to Emergency Services
 * Format 911-ready reports with accessibility info for deaf users
 */

import { z } from "zod";
import {
    safetyStatus,
    updateSafetyStatus,
    addEmergencyLog
} from "./state.js";

export const name = "escalate_to_emergency_services";
export const description = "Format 911-ready reports with accessibility info for deaf users";

export const schema = {
    emergencyType: z.enum(["police", "fire", "medical", "all"]).describe("Which emergency service to contact"),
    threatDescription: z.string().describe("Description of the emergency"),
    soundsDetected: z.array(z.string()).describe("List of sounds that triggered this"),
    userLocation: z.string().optional().describe("User's address or location"),
    accessibilityNeeds: z.string().optional().describe("Special accessibility requirements")
};

export async function handler({ emergencyType, threatDescription, soundsDetected, userLocation, accessibilityNeeds }) {
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

    addEmergencyLog(escalationLog);

    // Update safety status
    updateSafetyStatus({
        level: "emergency",
        riskScore: 100,
        lastUpdate: timestamp
    });

    console.log(`[MCP] EMERGENCY ESCALATION: ${emergencyType} - ${threatDescription}`);

    return {
        content: [{
            type: "text",
            text: JSON.stringify(report, null, 2)
        }]
    };
}
