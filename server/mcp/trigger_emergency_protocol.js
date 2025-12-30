/**
 * MCP Tool: Trigger Emergency Protocol
 * Activate full emergency response for specific threat types
 */

import { z } from "zod";
import {
    safetyStatus,
    updateSafetyStatus,
    latestAlert,
    addEmergencyLog
} from "./state.js";

export const name = "trigger_emergency_protocol";
export const description = "Activate full emergency response for specific threat types (weapon/fire/intrusion/medical/disaster)";

export const schema = {
    threatType: z.enum(["weapon", "fire", "intrusion", "medical", "disaster", "unknown"]).describe("Type of emergency threat"),
    confidence: z.number().min(0).max(100).describe("Detection confidence percentage"),
    soundLabel: z.string().describe("The sound that triggered the emergency"),
    autoActions: z.array(z.string()).optional().describe("Automatic actions to take")
};

export async function handler({ threatType, confidence, soundLabel, autoActions }) {
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
    updateSafetyStatus({
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
    });

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

    addEmergencyLog(emergencyLog);

    // Update latest alert (modifying the exported object)
    Object.assign(latestAlert, {
        emoji: "EMERGENCY",
        status: `${threatType.toUpperCase()} EMERGENCY`,
        timestamp,
        details: protocol.instructions
    });

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
