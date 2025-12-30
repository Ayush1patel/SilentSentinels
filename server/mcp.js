/**
 * MCP Module - Re-exports from modular structure
 * All tools are now organized in the mcp/ folder
 */

export {
    initMCP,
    updateAlert,
    getSafetyStatus,
    getEmergencyLogs,
    resetSafetyStatus,
    getAvailableTools,
    sendEmergencyAlert
} from "./mcp/index.js";
