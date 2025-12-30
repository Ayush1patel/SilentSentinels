/**
 * API Module - Backend Layer
 * Handles all communication with the Claude API server
 */

let isRateLimited = false;
let rateLimitResetTime = 0;

export const API = {
    /**
     * Send emergency alert to configured contacts
     * @param {Object} alertData - Alert data
     * @returns {Promise<Object>} Alert result
     */
    async sendEmergencyAlert(alertData) {
        try {
            const response = await fetch("/api/send-alert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(alertData)
            });

            const result = await response.json();
            console.log("[API] Emergency alert result:", result);
            return result;
        } catch (err) {
            console.error("[API] Failed to send emergency alert:", err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Send sound data to server for Claude analysis
     * @param {Object} soundData - Detection data to send
     * @param {number} sessionId - Current session ID for validation
     * @returns {Promise<Object|null>} Claude's response or null if skipped
     */
    async sendToServer(soundData, sessionId) {
        // Check if we're rate limited
        if (isRateLimited && Date.now() < rateLimitResetTime) {
            const waitSeconds = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
            console.log(`⏳ Rate limited. Waiting ${waitSeconds} seconds...`);
            return null;
        }
        isRateLimited = false;

        try {
            const response = await fetch("/verify-sound", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(soundData)
            });

            if (!response.ok) {
                if (response.status === 429) {
                    // Rate limited - extract retry-after header
                    const retryAfter = response.headers.get('retry-after') || '60';
                    rateLimitResetTime = Date.now() + (parseInt(retryAfter) * 1000);
                    isRateLimited = true;
                    console.warn("Rate limited. Will retry after:", new Date(rateLimitResetTime));
                    return {
                        rateLimited: true,
                        retryAfter: parseInt(retryAfter)
                    };
                }
                throw new Error("Server error");
            }

            const result = await response.json();
            return result;

        } catch (err) {
            console.error("Server call failed:", err);
            return {
                error: true,
                message: err.message
            };
        }
    },

    /**
     * Check if currently rate limited
     */
    isRateLimited() {
        return isRateLimited && Date.now() < rateLimitResetTime;
    },

    /**
     * Get rate limit reset time
     */
    getRateLimitResetTime() {
        return rateLimitResetTime;
    }
};
