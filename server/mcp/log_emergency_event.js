/**
 * MCP Tool: Log Emergency Event
 * Persist emergency events to file for pattern analysis, evidence, and review
 */

import { z } from "zod";
import {
    safetyStatus,
    updateSafetyStatus,
    addEmergencyLog
} from "./state.js";

export const name = "log_emergency_event";
export const description = "Persist emergency events to file for pattern analysis, evidence, and review";

export const schema = {
    eventType: z.string().describe("Type of event (detection, alert, action, resolution)"),
    soundLabel: z.string().describe("Sound that was detected"),
    confidence: z.number().describe("Detection confidence (0-1)"),
    isEmergency: z.boolean().describe("Whether this was classified as emergency"),
    claudeAnalysis: z.string().optional().describe("Claude's analysis/reasoning"),
    metadata: z.record(z.any()).optional().describe("Additional metadata")
};

export async function handler({ eventType, soundLabel, confidence, isEmergency, claudeAnalysis, metadata }) {
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

    addEmergencyLog(logEntry);

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
    const newRiskScore = Math.min(recentEmergencies * 10, 100);
    const newLevel = newRiskScore >= 70 ? "critical" :
                     newRiskScore >= 40 ? "warning" : "safe";

    updateSafetyStatus({
        riskScore: newRiskScore,
        level: newLevel,
        lastUpdate: timestamp
    });

    console.log(`[MCP] Event logged: ${eventType} - ${soundLabel} (emergency: ${isEmergency})`);

    return {
        content: [{
            type: "text",
            text: JSON.stringify({
                success: true,
                logId: logEntry.id,
                totalLogs: safetyStatus.recentDetections.length,
                currentRiskScore: safetyStatus.riskScore,
                safetyLevel: safetyStatus.level
            }, null, 2)
        }]
    };
}
