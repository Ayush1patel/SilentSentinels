/**
 * Voice Command Module - User Emergency Trigger
 * Listens for specific voice commands to trigger emergency alerts
 * Works independently from sound detection
 */

// Voice command phrases (case-insensitive matching)
const EMERGENCY_PHRASES = [
    'ss help',              // Primary - short and quick
    'silent sentinel help', // Full name
    'help me',              // Common distress
    'emergency',            // Direct emergency call
    'call for help',        // Alternative
    'i need help',          // Alternative
    'please help',          // Alternative
    'help help',            // Repeated help
    'mayday'                // Universal distress
];

// State
let recognition = null;
let isListening = false;
let onVoiceEmergencyCallback = null;
let onVoiceStatusCallback = null;
let restartTimeout = null;

/**
 * Check if browser supports speech recognition
 */
function isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Initialize speech recognition
 */
function init() {
    if (!isSupported()) {
        console.warn('Voice commands not supported in this browser');
        return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    // Configuration
    recognition.continuous = true;      // Keep listening
    recognition.interimResults = true;  // Get results as user speaks
    recognition.lang = 'en-US';         // English
    recognition.maxAlternatives = 3;    // Get multiple interpretations

    // Event handlers
    recognition.onstart = () => {
        isListening = true;
        console.log('🎤 Voice command listening started');
        if (onVoiceStatusCallback) {
            onVoiceStatusCallback({ status: 'listening', message: 'Voice commands active' });
        }
    };

    recognition.onend = () => {
        isListening = false;
        console.log('🎤 Voice command listening ended');

        // Auto-restart if not manually stopped
        if (recognition && !recognition._manualStop) {
            restartTimeout = setTimeout(() => {
                if (recognition && !recognition._manualStop) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log('🎤 Restart failed, will retry...');
                    }
                }
            }, 100);
        }
    };

    recognition.onerror = (event) => {
        console.log('🎤 Voice recognition error:', event.error);

        // Don't report "no-speech" as an error - it's normal
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
            if (onVoiceStatusCallback) {
                onVoiceStatusCallback({ status: 'error', message: event.error });
            }
        }
    };

    recognition.onresult = (event) => {
        // Check all results (both interim and final)
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];

            // Check all alternatives
            for (let j = 0; j < result.length; j++) {
                const transcript = result[j].transcript.toLowerCase().trim();
                const confidence = result[j].confidence;

                // Check if any emergency phrase is detected
                const matchedPhrase = EMERGENCY_PHRASES.find(phrase =>
                    transcript.includes(phrase)
                );

                if (matchedPhrase) {
                    console.log(`🆘 VOICE COMMAND DETECTED: "${transcript}" (matched: "${matchedPhrase}", confidence: ${(confidence * 100).toFixed(0)}%)`);

                    // Trigger emergency callback
                    if (onVoiceEmergencyCallback) {
                        onVoiceEmergencyCallback({
                            type: 'VOICE_COMMAND',
                            phrase: matchedPhrase,
                            transcript: transcript,
                            confidence: confidence,
                            timestamp: new Date().toISOString()
                        });
                    }

                    // Stop listening briefly to prevent duplicate triggers
                    recognition._manualStop = true;
                    recognition.stop();

                    // Resume after 5 seconds
                    setTimeout(() => {
                        recognition._manualStop = false;
                        try {
                            recognition.start();
                        } catch (e) {
                            console.log('🎤 Could not restart voice recognition');
                        }
                    }, 5000);

                    return; // Don't process more results
                }
            }
        }
    };

    console.log('✅ Voice command module initialized');
    return true;
}

/**
 * Start listening for voice commands
 */
function start() {
    if (!recognition) {
        if (!init()) {
            return false;
        }
    }

    try {
        recognition._manualStop = false;
        recognition.start();
        return true;
    } catch (e) {
        console.error('Failed to start voice recognition:', e);
        return false;
    }
}

/**
 * Stop listening for voice commands
 */
function stop() {
    if (recognition) {
        recognition._manualStop = true;
        recognition.stop();
    }
    if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
    }
    isListening = false;
}

/**
 * Register callback for voice emergency detection
 */
function onVoiceEmergency(callback) {
    onVoiceEmergencyCallback = callback;
}

/**
 * Register callback for status updates
 */
function onStatus(callback) {
    onVoiceStatusCallback = callback;
}

/**
 * Check if currently listening
 */
function getIsListening() {
    return isListening;
}

// Export the module
export const VoiceCommand = {
    isSupported,
    init,
    start,
    stop,
    onVoiceEmergency,
    onStatus,
    isListening: getIsListening
};
