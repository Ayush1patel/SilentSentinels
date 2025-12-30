/**
 * Detection Module - Backend Layer
 * Uses Friend's better YAMNet logic + Custom Gunshot Model
 */

import {
    AudioClassifier,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.0";

// ===== CONSTANTS =====

// Impulsive sounds (trigger immediately)
const IMPULSIVE_SOUNDS = [
    "gunshot", "shot", "gunfire", "machine gun", "fusillade",
    "artillery", "cap gun", "firearm", "rifle", "pistol",
    "glass", "shatter", "break",
    "explosion", "firecracker", "balloon pop",
    "bang", "pop", "blast", "boom", "thud", "slam", "crash"
];

// Gun detection moved to inline definitions in _classifyAudio()
// to avoid false positives from generic words like 'bang', 'burst', 'pop'

// Per-sound thresholds (friend's better config)
const THRESHOLDS = {
    'gun': 0.05,
    'shot': 0.05,
    'firearm': 0.05,
    'glass': 0.35,
    'shatter': 0.35,
    'break': 0.30,
    'alarm': 0.1,
    'siren': 0.1,
    'clap': 0.25,
    'applause': 0.25,
    'knock': 0.3,
    'default': 0.1
};

// Critical sounds list
const CRITICAL_SOUNDS = [
    'glass', 'break', 'shatter', 'smash', 'crash', 'crunch',
    'fire alarm', 'smoke detector', 'siren', 'emergency', 'alarm', 'bell', 'buzzer',
    'scream', 'shout', 'yell', 'cry', 'shriek',
    'car horn', 'doorbell', 'door knock', 'knock', 'telephone',
    'gunshot', 'shot', 'gunfire', 'machine gun', 'fusillade',
    'artillery', 'cap gun', 'firearm', 'rifle', 'pistol',
    'explosion', 'blast', 'bang', 'boom', 'pop', 'thud', 'slam', 'hit', 'punch',
    'fire', 'crackle', 'sizzle',
    'dog bark', 'bark', 'growl', 'howl',
    'whistle', 'horn', 'honk', 'beep', 'squeak', 'squeal',
    'clap', 'clapping', 'applause', 'hands'
];

// Ignored sounds
const IGNORED_SOUNDS = [
    "silence", "noise", "music", "speech", "child speech",
    "animal", "bird", "inside", "outside", "static", "cacophony"
];

// Timing constants
const TRIGGER_COOLDOWN = 10000; // 10 seconds (friend's setting)
const BUFFER_SIZE = 16000; // 1 second at 16kHz
const RUN_INTERVAL = 4000; // Run every ~250ms
const IMPULSE_RMS_THRESHOLD = 0.05;

// ===== STATE =====
let classifier = null;
let customGunshotModel = null;
let audioContext = null;
let stream = null;
let processor = null;
let isClassifying = false;
let isEmergencyShutdown = false;
let currentSessionId = 0;
let lastTriggerTime = 0;
let history = [];
let debugMode = false;

// Callbacks
let onDetectionCallback = null;
let onTriggerCallback = null;
let onErrorCallback = null;

// ===== HELPERS =====
function isCriticalSound(label) {
    const lower = label.toLowerCase();
    return CRITICAL_SOUNDS.some(critical => lower.includes(critical));
}

function isImpulsiveSound(label) {
    const lower = label.toLowerCase();
    return IMPULSIVE_SOUNDS.some(s => lower.includes(s));
}

function isIgnoredSound(label) {
    const lower = label.toLowerCase();
    return IGNORED_SOUNDS.some(x => lower.includes(x));
}

function getSensitivity(label) {
    const lower = label.toLowerCase();
    const key = Object.keys(THRESHOLDS).find(k => lower.includes(k));
    return key ? THRESHOLDS[key] : THRESHOLDS.default;
}

// ===== DETECTION MODULE =====
export const Detection = {
    /**
     * Initialize models
     */
    async init() {
        console.log("🟢 Initializing Detection Engine (Friend's Logic + Custom Model)");

        // Load YAMNet
        const audioTasks = await FilesetResolver.forAudioTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.0/wasm"
        );
        classifier = await AudioClassifier.createFromOptions(audioTasks, {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite"
            }
        });
        console.log("✅ YAMNet loaded");

        // Load Custom Gunshot Model
        try {
            console.log("📦 Loading custom gunshot classifier...");
            customGunshotModel = tf.sequential({
                layers: [
                    tf.layers.dense({ inputShape: [521], units: 512, activation: 'relu', name: 'dense' }),
                    tf.layers.dropout({ rate: 0.4, name: 'dropout' }),
                    tf.layers.dense({ units: 256, activation: 'relu', name: 'dense_1' }),
                    tf.layers.dense({ units: 1, activation: 'sigmoid', name: 'dense_2' })
                ]
            });

            const weightsUrl = 'tfjs_model/group1-shard1of1.bin';
            const response = await fetch(weightsUrl);
            const weightsData = await response.arrayBuffer();

            const weightSpecs = [
                { name: 'sequential/dense/kernel', shape: [521, 512], dtype: 'float32' },
                { name: 'sequential/dense/bias', shape: [512], dtype: 'float32' },
                { name: 'sequential/dense_1/kernel', shape: [512, 256], dtype: 'float32' },
                { name: 'sequential/dense_1/bias', shape: [256], dtype: 'float32' },
                { name: 'sequential/dense_2/kernel', shape: [256, 1], dtype: 'float32' },
                { name: 'sequential/dense_2/bias', shape: [1], dtype: 'float32' }
            ];

            const weightData = tf.io.decodeWeights(weightsData, weightSpecs);
            customGunshotModel.setWeights([
                weightData['sequential/dense/kernel'],
                weightData['sequential/dense/bias'],
                weightData['sequential/dense_1/kernel'],
                weightData['sequential/dense_1/bias'],
                weightData['sequential/dense_2/kernel'],
                weightData['sequential/dense_2/bias']
            ]);
            console.log("✅ Custom gunshot model loaded (98.6% accuracy)");
        } catch (e) {
            console.warn("⚠ Custom model not available:", e.message);
        }
    },

    /**
     * Start monitoring (Friend's sliding buffer logic)
     */
    async start() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        await audioContext.resume();

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);

        // Friend's smaller buffer for more frequent updates
        processor = audioContext.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(audioContext.destination);

        isEmergencyShutdown = false;

        // Friend's sliding buffer
        const slidingBuffer = new Float32Array(BUFFER_SIZE);
        let samplesSinceLastRun = 0;

        processor.onaudioprocess = (e) => {
            if (isEmergencyShutdown) return;

            const input = e.inputBuffer.getChannelData(0);
            const inputLength = input.length;

            // 1. Shift & Append (Friend's circular buffer)
            if (inputLength >= BUFFER_SIZE) {
                slidingBuffer.set(input.slice(inputLength - BUFFER_SIZE));
            } else {
                slidingBuffer.copyWithin(0, inputLength);
                slidingBuffer.set(input, BUFFER_SIZE - inputLength);
            }

            // 2. RMS of current input
            let sumSq = 0;
            for (let i = 0; i < inputLength; i++) sumSq += input[i] * input[i];
            const currentRMS = Math.sqrt(sumSq / inputLength);

            // Notify UI of audio level
            if (onDetectionCallback) {
                onDetectionCallback({ type: 'audioLevel', rms: currentRMS });
            }

            // 3. Trigger Decision (Friend's logic)
            samplesSinceLastRun += inputLength;
            const isImpulse = currentRMS > IMPULSE_RMS_THRESHOLD;
            const isTime = samplesSinceLastRun >= RUN_INTERVAL;

            if (!isClassifying && (isImpulse || isTime)) {
                isClassifying = true;
                samplesSinceLastRun = 0;

                const processBuffer = new Float32Array(slidingBuffer);
                this._classifyAudio(processBuffer, currentRMS);
            }
        };
    },

    /**
     * Internal: Classify audio (Friend's logic + Custom Model)
     */
    async _classifyAudio(processBuffer, currentRMS) {
        try {
            // Friend's normalization
            const finalBuffer = new Float32Array(BUFFER_SIZE);
            let maxVal = 0;
            for (let i = 0; i < BUFFER_SIZE; i++) {
                if (Math.abs(processBuffer[i]) > maxVal) maxVal = Math.abs(processBuffer[i]);
            }

            if (maxVal > 0.0001) {
                if (maxVal > 0.1) {
                    const scaler = 0.9 / maxVal;
                    for (let i = 0; i < BUFFER_SIZE; i++) finalBuffer[i] = processBuffer[i] * scaler;
                } else {
                    let rmsFull = 0;
                    for (let i = 0; i < BUFFER_SIZE; i++) rmsFull += processBuffer[i] * processBuffer[i];
                    rmsFull = Math.sqrt(rmsFull / BUFFER_SIZE);
                    const scaler = Math.min(0.1 / (rmsFull + 1e-6), 10.0);
                    for (let i = 0; i < BUFFER_SIZE; i++) {
                        finalBuffer[i] = Math.max(-1, Math.min(1, processBuffer[i] * scaler));
                    }
                }
            }

            const results = classifier.classify(finalBuffer);

            if (!results || results.length === 0 || !results[0].classifications) {
                isClassifying = false;
                return;
            }

            const categories = results[0].classifications[0].categories;
            const now = Date.now();
            const inCooldown = (now - lastTriggerTime) < TRIGGER_COOLDOWN;

            // ===== ENHANCED EMERGENCY DETECTION LOGIC =====
            // Balanced approach: Avoid false positives while catching real emergencies

            // ============================================================
            // A. LIFE SAFETY - HIGHEST PRIORITY
            // Smoke/Fire alarms AND Police/Ambulance sirens - BYPASS COOLDOWN at high confidence!
            // ============================================================

            const LIFE_SAFETY_LABELS = ['smoke detector', 'smoke alarm', 'fire alarm'];
            const EMERGENCY_VEHICLE_LABELS = ['police car', 'ambulance', 'emergency vehicle', 'fire engine', 'fire truck'];
            // Note: 'siren' is checked separately to avoid matching 'smoke alarm'

            // FIRST: Check for Smoke/Fire alarm - HIGHEST PRIORITY for life safety!
            const smokeFireMatch = categories.slice(0, 10).find(cat => {
                const lowerName = cat.categoryName.toLowerCase();
                return LIFE_SAFETY_LABELS.some(k => lowerName.includes(k)) && cat.score > 0.15;
            });

            // Smoke/Fire alarms at 40%+ BYPASS COOLDOWN - life safety!
            if (smokeFireMatch && (smokeFireMatch.score > 0.40 || !inCooldown)) {
                const label = smokeFireMatch.categoryName.toLowerCase();
                let emergencyType = label.includes('smoke') ? 'SMOKE_ALARM' : 'FIRE_ALARM';
                console.log(`🔥 ${emergencyType} DETECTED IMMEDIATELY: ${smokeFireMatch.categoryName} (${(smokeFireMatch.score * 100).toFixed(0)}%) [cooldown bypassed: ${smokeFireMatch.score > 0.40}]`);
                this._triggerEvent(smokeFireMatch, false, categories, emergencyType);
                isClassifying = false;
                return;
            }

            // SECOND: Check for Police/Ambulance/Emergency vehicle sirens
            const sirenMatch = categories.slice(0, 10).find(cat => {
                const lowerName = cat.categoryName.toLowerCase();
                // Match emergency vehicles OR 'siren' keyword (but not 'smoke alarm' which contains 'alarm')
                const isEmergencyVehicle = EMERGENCY_VEHICLE_LABELS.some(k => lowerName.includes(k));
                const isSiren = lowerName.includes('siren') && !lowerName.includes('smoke') && !lowerName.includes('fire alarm');
                return (isEmergencyVehicle || isSiren) && cat.score > 0.15;
            });

            // HIGH CONFIDENCE SIRENS (40%+) BYPASS COOLDOWN
            if (sirenMatch && (sirenMatch.score > 0.40 || !inCooldown)) {
                const label = sirenMatch.categoryName.toLowerCase();
                let emergencyType = 'EMERGENCY_SIREN';
                if (label.includes('police')) emergencyType = 'POLICE_SIREN';
                else if (label.includes('ambulance')) emergencyType = 'AMBULANCE_SIREN';
                else if (label.includes('fire engine') || label.includes('fire truck')) emergencyType = 'FIRE_TRUCK_SIREN';
                else if (label.includes('siren')) emergencyType = 'SIREN';

                console.log(`🚨 ${emergencyType} DETECTED IMMEDIATELY: ${sirenMatch.categoryName} (${(sirenMatch.score * 100).toFixed(0)}%) [cooldown bypassed: ${sirenMatch.score > 0.40}]`);
                this._triggerEvent(sirenMatch, false, categories, emergencyType);
                isClassifying = false;
                return;
            }

            // Beep/bleep pattern WITH smoke detector in top 10
            const topLabel = categories[0].categoryName.toLowerCase();
            const isBeepTop = topLabel.includes('beep') || topLabel.includes('bleep');
            const smokeInTop10 = categories.slice(0, 10).find(cat =>
                LIFE_SAFETY_LABELS.some(k => cat.categoryName.toLowerCase().includes(k))
            );

            if (isBeepTop && smokeInTop10 && smokeInTop10.score > 0.10 && categories[0].score > 0.30 && !inCooldown) {
                console.log(`🔥 SMOKE ALARM (Beep pattern): Beep(${(categories[0].score * 100).toFixed(0)}%) + ${smokeInTop10.categoryName}(${(smokeInTop10.score * 100).toFixed(0)}%)`);
                this._triggerEvent(smokeInTop10, false, categories, 'SMOKE_ALARM_BEEP_PATTERN');
                isClassifying = false;
                return;
            }

            // ============================================================
            // B. GLASS BREAKING DETECTION (break-in detection)
            // ULTRA STRICT - Require BOTH "Glass" AND "Shatter/Breaking" to be present
            // This prevents false positives from ambient sounds that YAMNet misclassifies

            // Labels that indicate BREAKING action (not just glass material)
            const BREAKING_LABELS = ['shatter', 'breaking', 'smash', 'crash'];
            // Label for glass material
            const GLASS_LABEL = 'glass';

            // Find exact "Glass" label in top 10
            const glassInTop10 = categories.slice(0, 10).find(cat =>
                cat.categoryName.toLowerCase() === GLASS_LABEL
            );

            // Find any breaking-action label in top 10
            const breakingInTop10 = categories.slice(0, 10).filter(cat =>
                BREAKING_LABELS.some(k => cat.categoryName.toLowerCase().includes(k))
            );

            // Get the best breaking indicator
            const bestBreaking = breakingInTop10.length > 0
                ? breakingInTop10.reduce((max, c) => c.score > max.score ? c : max, breakingInTop10[0])
                : null;

            // ULTRA STRICT RULE: Must have BOTH Glass AND a breaking indicator
            // Glass alone (even at 100%) is NOT enough - could be glass clinking, glass music, etc.
            // Breaking alone (even at 100%) is NOT enough - could be breaking wood, etc.
            // ONLY Glass + Breaking together = glass breaking emergency
            const isGlassBreaking = glassInTop10 && bestBreaking &&
                glassInTop10.score > 0.20 &&  // Glass at 20%+
                bestBreaking.score > 0.15;     // Breaking/Shatter at 15%+

            if (isGlassBreaking && !inCooldown) {
                const labels = `Glass(${(glassInTop10.score * 100).toFixed(0)}%) + ${bestBreaking.categoryName}(${(bestBreaking.score * 100).toFixed(0)}%)`;
                console.log(`🪟 GLASS BREAK DETECTED: ${labels}`);
                this._triggerEvent(glassInTop10, false, categories, 'GLASS_BREAK');
                isClassifying = false;
                return;
            }

            // B. GUNSHOT DETECTION - Balanced sensitivity
            // Need minimum confidence to avoid false positives from noise
            const GUN_SPECIFIC_LABELS = [
                'gunshot', 'gunfire', 'machine gun', 'firearm',
                'rifle', 'pistol', 'artillery', 'fusillade', 'cap gun'
            ];

            // Supporting labels that often accompany gunshots
            const GUN_SUPPORTING_LABELS = ['explosion', 'blast'];

            // Search in top 10 for gun labels
            const gunSpecificInTop10 = categories.slice(0, 10).filter(cat =>
                GUN_SPECIFIC_LABELS.some(k => cat.categoryName.toLowerCase().includes(k))
            );

            const gunSupportingInTop10 = categories.slice(0, 10).filter(cat =>
                GUN_SUPPORTING_LABELS.some(k => cat.categoryName.toLowerCase().includes(k)) &&
                cat.score > 0.05
            );

            // RULE 1: Gun-specific label at 3%+ in TOP 10 = EMERGENCY
            // Must be in top 10 AND have at least 3% confidence
            const meaningfulGun = gunSpecificInTop10.find(c => c.score > 0.03);
            if (meaningfulGun && !inCooldown) {
                console.log(`🔫 GUNSHOT DETECTED: ${meaningfulGun.categoryName} (${(meaningfulGun.score * 100).toFixed(1)}%)`);
                this._triggerEvent(meaningfulGun, true, categories);
                isClassifying = false;
                return;
            }

            // RULE 2: 2+ gun-specific labels in top 10 (any confidence) = EMERGENCY
            if (gunSpecificInTop10.length >= 2 && !inCooldown) {
                const labels = gunSpecificInTop10.map(c => `${c.categoryName}(${(c.score * 100).toFixed(1)}%)`).join(', ');
                console.log(`🔫 MULTI-LABEL GUNSHOT: ${labels}`);
                this._triggerEvent(gunSpecificInTop10[0], true, categories);
                isClassifying = false;
                return;
            }

            // RULE 3: Gun label + explosion/blast = EMERGENCY
            if (gunSpecificInTop10.length >= 1 && gunSupportingInTop10.length >= 1 && !inCooldown) {
                const allLabels = [...gunSpecificInTop10, ...gunSupportingInTop10];
                const labels = allLabels.map(c => `${c.categoryName}(${(c.score * 100).toFixed(1)}%)`).join(', ');
                console.log(`🔫 GUN + EXPLOSION: ${labels}`);
                this._triggerEvent(gunSpecificInTop10[0], true, categories);
                isClassifying = false;
                return;
            }

            // RULE 4: Deep scan - gun label at 2%+ in top 15
            const gunTrace = categories.slice(0, 15).find(cat =>
                GUN_SPECIFIC_LABELS.some(k => cat.categoryName.toLowerCase().includes(k)) &&
                cat.score > 0.02
            );

            if (gunTrace && !inCooldown) {
                console.log(`💥 GUNSHOT TRACE: ${gunTrace.categoryName} (${(gunTrace.score * 100).toFixed(1)}%)`);
                this._triggerEvent(gunTrace, true, categories, 'GUNSHOT_TRACE');
                isClassifying = false;
                return;
            }

            // D. SCREAM/DISTRESS DETECTION - Single detection at 35%+
            const DISTRESS_LABELS = ['scream', 'screaming', 'shout', 'yell', 'shriek', 'cry'];
            const distressInTop10 = categories.slice(0, 10).find(cat =>
                DISTRESS_LABELS.some(k => cat.categoryName.toLowerCase().includes(k)) && cat.score > 0.35
            );
            if (distressInTop10 && !inCooldown) {
                console.log(`😱 DISTRESS DETECTED: ${distressInTop10.categoryName} (${(distressInTop10.score * 100).toFixed(0)}%)`);
                this._triggerEvent(distressInTop10, false, categories, 'DISTRESS');
                isClassifying = false;
                return;
            }

            // B. CUSTOM MODEL CHECK (with validation against false positives)
            if (customGunshotModel) {
                const scores = categories.map(c => c.score);
                if (scores.length === 521) {
                    const inputTensor = tf.tensor2d([scores]);
                    const prediction = customGunshotModel.predict(inputTensor);
                    const gunshotProb = (await prediction.data())[0];
                    inputTensor.dispose();
                    prediction.dispose();

                    if (debugMode) {
                        console.log(`🎯 Custom Model: ${(gunshotProb * 100).toFixed(1)}% gunshot`);
                    }

                    // Notify UI
                    if (onDetectionCallback) {
                        onDetectionCallback({
                            type: 'sound',
                            label: categories[0].categoryName,
                            confidence: categories[0].score,
                            isCritical: isCriticalSound(categories[0].categoryName),
                            gunshotProbability: gunshotProb
                        });
                    }

                    // VALIDATION: Only trust custom model if YAMNet also sees something impulsive
                    // This prevents false positives from random sounds
                    const IMPULSIVE_KEYWORDS = ['gun', 'shot', 'bang', 'pop', 'explosion', 'blast', 'crack', 'thud', 'slam', 'impact', 'punch', 'hit', 'clap', 'snap', 'burst', 'drum', 'percussion'];
                    const hasImpulsiveTrace = categories.slice(0, 20).some(cat =>
                        IMPULSIVE_KEYWORDS.some(k => cat.categoryName.toLowerCase().includes(k))
                    );

                    // Custom model gunshot detection: >75% AND YAMNet sees something impulsive
                    if (gunshotProb > 0.75 && hasImpulsiveTrace && !inCooldown) {
                        console.log(`🔫 CUSTOM MODEL GUNSHOT: ${(gunshotProb * 100).toFixed(1)}% + YAMNet confirms impulsive sound`);
                        this._triggerEvent({ categoryName: 'Gunshot (Custom)', score: gunshotProb }, true, categories);
                        isClassifying = false;
                        return;
                    } else if (gunshotProb > 0.75 && !hasImpulsiveTrace) {
                        console.log(`⚠️ Custom model says ${(gunshotProb * 100).toFixed(1)}% gunshot but YAMNet shows no impulsive sounds - IGNORING`);
                    }
                }
            }

            // C. STANDARD FILTERING (Friend's logic)
            const top = categories[0];

            // Ignore non-critical low-priority sounds
            if (isIgnoredSound(top.categoryName) && !isCriticalSound(top.categoryName)) {
                isClassifying = false;
                return;
            }

            // Notify UI
            if (onDetectionCallback && !customGunshotModel) {
                onDetectionCallback({
                    type: 'sound',
                    label: top.categoryName,
                    confidence: top.score,
                    isCritical: isCriticalSound(top.categoryName),
                    gunshotProbability: 0
                });
            }

            // D. CRITICAL SOUNDS with configurable thresholds
            const threshold = getSensitivity(top.categoryName);

            if (isCriticalSound(top.categoryName) && top.score > threshold && !inCooldown) {
                if (debugMode) console.log(`🚨 Critical: ${top.categoryName} (${(top.score * 100).toFixed(1)}%) > ${(threshold * 100).toFixed(0)}%`);
                this._triggerEvent(top, false, categories);
            }

            // Update history (keep 20 for pattern detection)
            // Also track if distress sounds are in top 10 (even if not the top label)
            const DISTRESS_KEYWORDS = ['scream', 'screaming', 'shout', 'yell', 'shriek', 'cry', 'wail'];
            const distressInTop10ForHistory = categories.slice(0, 10).find(cat =>
                DISTRESS_KEYWORDS.some(k => cat.categoryName.toLowerCase().includes(k))
            );

            history.push({
                label: top.categoryName,
                score: top.score,
                isCritical: isCriticalSound(top.categoryName),
                time: new Date().toLocaleTimeString(),
                // Track distress even when it's not the top label
                hasDistress: !!distressInTop10ForHistory,
                distressLabel: distressInTop10ForHistory ? distressInTop10ForHistory.categoryName : null,
                distressScore: distressInTop10ForHistory ? distressInTop10ForHistory.score : 0
            });
            if (history.length > 20) history.shift();

            // E. PATTERN DETECTION

            // Count total critical sounds in window
            const criticalInWindow = history.filter(h => h.isCritical).length;
            const highConfidenceInWindow = history.filter(h => h.isCritical && h.score > 0.5).length;

            // Count CONSECUTIVE critical sounds (from end of history)
            let consecutiveCritical = 0;
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].isCritical) {
                    consecutiveCritical++;
                } else {
                    break; // Stop counting when we hit a non-critical sound
                }
            }

            // DISTRESS/SCREAM PATTERN DETECTION
            // Check for repeated screaming/distress sounds in recent history (even at low confidence)
            const DISTRESS_PATTERN_LABELS = ['scream', 'screaming', 'shout', 'yell', 'shriek', 'cry', 'wail'];
            const recentHistory = history.slice(-10); // Last 10 detections

            // Count distress sounds in history - check BOTH top label AND hasDistress flag
            // This catches screaming even when it's not the #1 detection (e.g., Squeal #1, Screaming #3)
            const distressInHistory = recentHistory.filter(h =>
                h.hasDistress || DISTRESS_PATTERN_LABELS.some(k => h.label.toLowerCase().includes(k))
            ).length;

            // Also check if distress is in current top 10 categories
            const distressInCurrentTop10 = categories.slice(0, 10).find(cat =>
                DISTRESS_PATTERN_LABELS.some(k => cat.categoryName.toLowerCase().includes(k))
            );

            // RULE: 3+ detections with distress sounds in last 10 = likely real distress
            if (distressInHistory >= 3 && !inCooldown) {
                const distressLabel = distressInCurrentTop10 ? distressInCurrentTop10.categoryName : 'Screaming (pattern)';
                const distressScore = distressInCurrentTop10 ? distressInCurrentTop10.score : 0.1;
                console.log(`😱 DISTRESS PATTERN: ${distressInHistory}/10 recent detections contain screaming/distress sounds`);
                this._triggerEvent({ categoryName: distressLabel, score: distressScore }, false, categories, `DISTRESS_PATTERN_${distressInHistory}`);
                isClassifying = false;
                return;
            }

            // RULE: 2+ distress sounds AND distress currently in top 5 = trigger
            const distressInCurrentTop5 = categories.slice(0, 5).find(cat =>
                DISTRESS_PATTERN_LABELS.some(k => cat.categoryName.toLowerCase().includes(k))
            );
            if (distressInHistory >= 2 && distressInCurrentTop5 && !inCooldown) {
                console.log(`😱 DISTRESS DETECTED: ${distressInCurrentTop5.categoryName} (${(distressInCurrentTop5.score * 100).toFixed(0)}%) + ${distressInHistory} recent occurrences`);
                this._triggerEvent(distressInCurrentTop5, false, categories, `DISTRESS_REPEATED`);
                isClassifying = false;
                return;
            }

            // PATH 4: 5 CONSECUTIVE critical sounds = likely real emergency
            if (consecutiveCritical >= 5 && !inCooldown) {
                console.log(`🔥 PATTERN: ${consecutiveCritical} CONSECUTIVE critical sounds!`);
                this._triggerEvent(top, false, categories, `CONSECUTIVE_${consecutiveCritical}_CRITICAL`);
            }
            // PATH 5: 8+ critical in window = let Claude analyze (not automatic emergency)
            else if (criticalInWindow >= 8 && !inCooldown) {
                console.log(`🔍 PATTERN: ${criticalInWindow}/20 critical sounds in window - Claude will analyze`);
                this._triggerEvent(top, false, categories, `WINDOW_${criticalInWindow}_CRITICAL`);
            }

            isClassifying = false;

        } catch (err) {
            console.error("❌ Classification error:", err);
            if (onErrorCallback) onErrorCallback(err);
            isClassifying = false;
        }
    },

    /**
     * Internal: Trigger event - sends rich context to Claude
     */
    _triggerEvent(item, isGunshot, categories, patternReason = null) {
        lastTriggerTime = Date.now();

        // Count critical sounds in history
        const criticalCount = history.filter(h => h.isCritical).length;
        const highConfCount = history.filter(h => h.isCritical && h.score > 0.5).length;

        // Get top 10 categories for context
        const top10Categories = categories.slice(0, 10).map(c => ({
            label: c.categoryName,
            confidence: (c.score * 100).toFixed(1) + '%'
        }));

        const detectionData = {
            label: item.categoryName,
            confidence: item.score,
            timestamp: new Date().toISOString(),

            // Send last 20 detections for pattern analysis
            history: history.slice(-20),

            // Pattern analysis summary
            patternAnalysis: {
                totalInWindow: history.length,
                criticalCount: criticalCount,
                highConfidenceCount: highConfCount,
                patternReason: patternReason
            },

            // Top 10 YAMNet categories for this detection
            top10Categories: top10Categories,

            isGunshot,
            userContext: isGunshot
                ? "GUNSHOT DETECTED! Take immediate action."
                : `Critical sound detected. ${criticalCount} critical sounds in last 20 detections. ${highConfCount} with high confidence (>50%).`
        };

        console.log(`📤 Sending to Claude:`, {
            label: detectionData.label,
            confidence: (detectionData.confidence * 100).toFixed(1) + '%',
            criticalInWindow: criticalCount,
            highConfInWindow: highConfCount,
            historyLength: history.length
        });

        if (onTriggerCallback) {
            onTriggerCallback(detectionData);
        }
    },

    /**
     * Stop monitoring
     */
    stop() {
        isClassifying = false;
        if (processor) { processor.disconnect(); processor = null; }
        if (audioContext) { audioContext.close(); audioContext = null; }
        if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    },

    /**
     * Shutdown for emergency - clears history for fresh start
     */
    shutdownForEmergency() {
        console.log("🛑 Emergency shutdown - clearing history");
        history = []; // FRESH START - clear history after emergency
        isEmergencyShutdown = true;
        this.stop();
    },

    /**
     * Resume after false alarm - clears history for fresh start
     */
    resumeAfterFalseAlarm() {
        console.log("✅ Resuming - clearing history for fresh start");
        history = []; // FRESH START - clear history on resume
        currentSessionId++;
        isEmergencyShutdown = false;
    },

    /**
     * Pause after emergency
     */
    pauseAfterEmergency(hours = 3) {
        currentSessionId++;
        isEmergencyShutdown = true;
        this.stop();
    },

    getCurrentSession() { return currentSessionId; },
    getHistory() { return history; },
    isMonitoring() { return !isEmergencyShutdown && audioContext !== null; },
    setDebugMode(enabled) { debugMode = enabled; },
    onDetection(cb) { onDetectionCallback = cb; },
    onTrigger(cb) { onTriggerCallback = cb; },
    onError(cb) { onErrorCallback = cb; }
};
