/**
 * MCP Tool: Get User Safety Status
 * Check current safety status, risk level, and recent detection history
 */

import { z } from "zod";
import {
    safetyStatus,
    getSafetyStatusSummary
} from "./state.js";

export const name = "get_user_safety_status";
export const description = "Check current safety status, risk level, and recent detection history";

export const schema = {
    includeHistory: z.boolean().optional().describe("Include recent detection history"),
    historyLimit: z.number().optional().describe("Number of history items to include")
};

export async function handler({ includeHistory = true, historyLimit = 20 }) {
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
