/**
 * UI Module - Frontend Layer
 * Handles all DOM manipulation, UI updates, and user interactions
 * Your teammate can modify this file to change the UI without touching detection logic
 */

export const UI = {
    // DOM Element References
    elements: {
        startBtn: document.getElementById("startBtn"),
        stopBtn: document.getElementById("stopBtn"),
        statusText: document.getElementById("status"),
        soundLabel: document.getElementById("soundLabel"),
        confidenceText: document.getElementById("confidence"),
        audioLevelBar: document.getElementById("audioLevelBar"),
        rmsValue: document.getElementById("rmsValue"),
        detectionLog: document.getElementById("detectionLog"),
        alertBox: document.getElementById("alertBox"),
        claudeVerdict: document.getElementById("claudeVerdict"),
        claudeReason: document.getElementById("claudeReason"),
        claudeRecommendation: document.getElementById("claudeRecommendation"),
        claudeCard: document.getElementById("claudeCard"),
        debugMode: document.getElementById("debugMode"),
        emergencyControls: document.getElementById("emergencyControls"),
        resumeNowBtn: document.getElementById("resumeNowBtn"),
        resumeLaterBtn: document.getElementById("resumeLaterBtn")
    },

    /**
     * Update status text and color
     */
    updateStatus(message, color = "#4cc9f0") {
        this.elements.statusText.innerText = message;
        this.elements.statusText.style.color = color;
    },

    /**
     * Update detected sound label and confidence
     */
    updateSound(label, confidence) {
        this.elements.soundLabel.innerText = label;
        this.elements.confidenceText.innerText = `${(confidence * 100).toFixed(1)}% confidence`;
        this.elements.soundLabel.style.color = "#fff";
    },

    /**
     * Update audio level bar
     */
    updateAudioLevel(rms) {
        this.elements.rmsValue.textContent = rms.toFixed(4);
        this.elements.audioLevelBar.style.width = `${Math.min(rms * 500, 100)}%`;
    },

    /**
     * Add entry to detection log
     */
    addToLog(label, score, isCritical, gunshotProbability = 0) {
        try {
            const time = new Date().toLocaleTimeString();
            const entry = document.createElement('div');

            const isGunshotDetected = gunshotProbability >= 0.90;
            const shouldHighlight = isCritical || isGunshotDetected;

            entry.className = `log-entry ${shouldHighlight ? 'critical' : ''}`;
            entry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-label">${label}</span>
        <span class="log-score">${(score * 100).toFixed(1)}%</span>
        <span class="log-gunshot" style="color: ${isGunshotDetected ? '#ff4444' : '#888'}; margin-left: 8px;">
          🎯 ${(gunshotProbability * 100).toFixed(1)}%
        </span>
      `;

            if (this.elements.detectionLog) {
                this.elements.detectionLog.insertBefore(entry, this.elements.detectionLog.firstChild);

                // Keep only last 15 entries
                while (this.elements.detectionLog.children.length > 15) {
                    this.elements.detectionLog.removeChild(this.elements.detectionLog.lastChild);
                }
            }
        } catch (error) {
            console.error('addToLog error:', error);
        }
    },

    /**
     * Show alert box with message
     */
    showAlert(message) {
        this.elements.alertBox.classList.remove('hidden');
        this.elements.alertBox.innerHTML = message;
    },

    /**
     * Hide alert box
     */
    hideAlert() {
        this.elements.alertBox.classList.add('hidden');
    },

    /**
     * Show emergency control buttons
     */
    showEmergencyControls() {
        if (this.elements.emergencyControls) {
            this.elements.emergencyControls.classList.remove("hidden");
            this.elements.emergencyControls.style.display = "block";
        }
    },

    /**
     * Hide emergency control buttons
     */
    hideEmergencyControls() {
        if (this.elements.emergencyControls) {
            this.elements.emergencyControls.classList.add("hidden");
        }
    },

    /**
     * Update Claude verdict display
     */
    updateClaudeVerdict(verdict, reason = "", recommendation = "") {
        this.elements.claudeVerdict.innerText = verdict;
        this.elements.claudeReason.innerText = reason;
        if (this.elements.claudeRecommendation) {
            this.elements.claudeRecommendation.innerText = recommendation;
        }
    },

    /**
     * Set Claude verdict to analyzing state
     */
    setClaudeAnalyzing() {
        this.elements.claudeVerdict.innerText = "🔍 Analyzing risk...";
        this.elements.claudeVerdict.className = "analyzing";
        this.elements.claudeReason.innerText = "";
        if (this.elements.claudeRecommendation) {
            this.elements.claudeRecommendation.innerText = "";
        }
    },

    /**
     * Set Claude verdict class
     */
    setClaudeVerdictClass(className) {
        this.elements.claudeVerdict.className = className;
    },

    /**
     * Reset UI to idle state
     */
    resetToIdle() {
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.startBtn.textContent = "Start Monitoring";
        this.elements.startBtn.classList.remove('active');
        this.updateStatus("Status: Idle");
        this.elements.soundLabel.innerText = "—";
        this.elements.confidenceText.innerText = "—";
        this.elements.audioLevelBar.style.width = "0%";
        this.elements.rmsValue.textContent = "0.0000";
        this.elements.claudeVerdict.innerText = "Waiting for detection...";
        this.elements.claudeVerdict.className = "";
        this.elements.claudeReason.innerText = "";
        this.hideEmergencyControls();
    },

    /**
     * Set UI to monitoring state
     */
    setMonitoring() {
        this.elements.startBtn.disabled = true;
        this.elements.stopBtn.disabled = false;
        this.elements.startBtn.textContent = "Monitoring Active";
        this.updateStatus("Status: Listening", "#4cc9f0");
    },

    /**
     * Set UI to emergency state
     */
    setEmergency() {
        this.elements.startBtn.disabled = true;
        this.elements.stopBtn.disabled = true;
        this.elements.startBtn.textContent = "Monitoring Paused (Emergency)";
        this.updateStatus("Status: EMERGENCY - Monitoring Paused", "#ff4d4d");
        this.showEmergencyControls();
    },

    /**
     * Set UI to paused state
     */
    setPaused(hours) {
        this.updateStatus(`Status: Paused for ${hours} hours after emergency`, "#ffb703");
    },

    /**
     * Set UI to initializing state
     */
    setInitializing() {
        this.elements.startBtn.disabled = true;
        this.updateStatus("Status: Initializing...");
    },

    /**
     * Set UI to error state
     */
    setError(message) {
        this.elements.statusText.innerHTML = `<span style="color: #ff4d4d;">❌ Error: ${message}</span>`;
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.startBtn.textContent = "Start Monitoring";
    },

    /**
     * Register callback for start button click
     */
    onStartClick(callback) {
        this.elements.startBtn.addEventListener('click', callback);
    },

    /**
     * Register callback for stop button click
     */
    onStopClick(callback) {
        this.elements.stopBtn.addEventListener('click', callback);
    },

    /**
     * Register callback for resume now button click
     */
    onResumeNowClick(callback) {
        if (this.elements.resumeNowBtn) {
            this.elements.resumeNowBtn.addEventListener('click', callback);
        }
    },

    /**
     * Register callback for resume later button click
     */
    onResumeLaterClick(callback) {
        if (this.elements.resumeLaterBtn) {
            this.elements.resumeLaterBtn.addEventListener('click', callback);
        }
    },

    /**
     * Check if debug mode is enabled
     */
    isDebugMode() {
        return this.elements.debugMode?.checked || false;
    }
};
