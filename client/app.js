/**
 * Silent Sentinel - ULTIMATE EDITION
 * Main Entry Point with all premium features
 */

import { UI } from './js/ui.js';
import { Detection } from './js/detection.js';
import { API } from './js/api.js';

console.log("🟢 Silent Sentinel v5.0 - ULTIMATE MASTERPIECE");

// ===== STATE =====
let initialized = false;
let stats = {
  detections: 0,
  critical: 0,
  emergencies: 0,
  startTime: Date.now()
};

// ===== LIVE CLOCK =====
function updateClock() {
  const now = new Date();
  const clock = document.getElementById('liveClock');
  if (clock) {
    clock.textContent = now.toLocaleTimeString();
  }
}
setInterval(updateClock, 1000);
updateClock();

// ===== STATS UPDATER =====
function updateStats() {
  document.getElementById('statDetections').textContent = stats.detections;
  document.getElementById('statCritical').textContent = stats.critical;
  document.getElementById('statEmergencies').textContent = stats.emergencies;

  const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  document.getElementById('statUptime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}
setInterval(updateStats, 1000);

// ===== SPECTRUM VISUALIZER =====
function updateSpectrum(rms) {
  const bars = document.querySelectorAll('.spectrum-bar');
  bars.forEach((bar, i) => {
    const height = Math.max(10, Math.min(70, rms * 800 * (1 + Math.random() * 0.5)));
    bar.style.height = height + 'px';
    bar.style.opacity = Math.min(1, rms * 10 + 0.3);
  });
}

// ===== SOUND EFFECTS =====
const SoundFX = {
  enabled: true,
  ctx: null,

  getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.ctx;
  },

  beep(freq = 440, duration = 100, vol = 0.3) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.value = vol;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) { }
  },

  click() { this.beep(800, 50, 0.2); },
  success() { this.beep(523, 100, 0.3); setTimeout(() => this.beep(659, 100, 0.3), 100); },
  warning() { this.beep(440, 200, 0.4); },
  emergency() {
    this.beep(880, 150, 0.5);
    setTimeout(() => this.beep(660, 150, 0.5), 200);
    setTimeout(() => this.beep(880, 150, 0.5), 400);
  },
  start() { this.beep(440, 80, 0.3); setTimeout(() => this.beep(660, 80, 0.3), 100); setTimeout(() => this.beep(880, 80, 0.3), 200); },
  stop() { this.beep(880, 80, 0.3); setTimeout(() => this.beep(660, 80, 0.3), 100); setTimeout(() => this.beep(440, 80, 0.3), 200); }
};

// ===== THEME MANAGER =====
const ThemeManager = {
  init() {
    const saved = localStorage.getItem('theme') || 'dark';
    this.set(saved);
  },

  set(theme) {
    document.body.classList.toggle('light-theme', theme === 'light');
    const icon = document.querySelector('.theme-icon');
    if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
  },

  toggle() {
    const isLight = document.body.classList.contains('light-theme');
    this.set(isLight ? 'dark' : 'light');
    SoundFX.click();
  }
};

// ===== NOTIFICATIONS =====
const Notifications = {
  enabled: true,

  async request() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  },

  show(title, body) {
    if (!this.enabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification(title, { body, tag: 'silent-sentinel' }); } catch (e) { }
  }
};

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;

  switch (e.key.toLowerCase()) {
    case 's': document.getElementById('startBtn')?.click(); break;
    case 'x': document.getElementById('stopBtn')?.click(); break;
    case 't': ThemeManager.toggle(); break;
    case 'd': document.getElementById('debugMode')?.click(); break;
    case 'f':
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
      break;
    case '?':
      alert(`⌨️ Keyboard Shortcuts:\n\nS - Start\nX - Stop\nT - Theme\nD - Debug\nF - Fullscreen`);
      break;
  }
});

// ===== INITIALIZE =====
ThemeManager.init();
Notifications.request();

// ===== UI EVENT HANDLERS =====

// Theme Toggle
document.getElementById('themeToggle')?.addEventListener('click', () => ThemeManager.toggle());

// Sound Effects Toggle
document.getElementById('soundEffects')?.addEventListener('change', (e) => {
  SoundFX.enabled = e.target.checked;
  if (SoundFX.enabled) SoundFX.click();
});

// Notifications Toggle
document.getElementById('notifications')?.addEventListener('change', (e) => {
  Notifications.enabled = e.target.checked;
  if (Notifications.enabled) Notifications.request();
});

// Debug Mode Toggle
document.getElementById('debugMode')?.addEventListener('change', (e) => {
  Detection.setDebugMode(e.target.checked);
  SoundFX.click();
});

// Clear Log Button
document.getElementById('clearLogBtn')?.addEventListener('click', () => {
  document.getElementById('detectionLog').innerHTML = '';
  SoundFX.click();
});

// Start Button
UI.onStartClick(async () => {
  try {
    SoundFX.start();
    UI.setInitializing();

    // Activate status indicator
    document.getElementById('statusIndicator')?.classList.add('active');

    if (!initialized) {
      await Detection.init();
      initialized = true;
    }

    await Detection.start();
    UI.setMonitoring();
    UI.hideEmergencyControls();

    // Reset stats
    stats = { detections: 0, critical: 0, emergencies: 0, startTime: Date.now() };

    Notifications.show('Silent Sentinel', 'Monitoring started! 🎧');

  } catch (err) {
    console.error("❌ Setup error:", err);
    UI.setError(err.message);
    SoundFX.warning();
  }
});

// Stop Button
UI.onStopClick(() => {
  SoundFX.stop();
  Detection.stop();
  UI.resetToIdle();

  document.getElementById('statusIndicator')?.classList.remove('active');

  // Reset spectrum
  document.querySelectorAll('.spectrum-bar').forEach(bar => {
    bar.style.height = '10px';
  });

  Notifications.show('Silent Sentinel', 'Monitoring stopped');
});

// Resume Now Button
UI.onResumeNowClick(() => {
  SoundFX.success();
  UI.hideEmergencyControls();
  Detection.resumeAfterFalseAlarm();
  UI.hideAlert();
  UI.updateClaudeVerdict("Waiting for detection...");
  UI.setClaudeVerdictClass("");
  UI.resetToIdle();
  document.getElementById('startBtn')?.click();
});

// Resume Later Button
UI.onResumeLaterClick(() => {
  SoundFX.warning();
  UI.hideEmergencyControls();
  Detection.pauseAfterEmergency(3);
  UI.setPaused(3);
  UI.resetToIdle();
  Notifications.show('Silent Sentinel', 'Paused for 3 hours');
});

// ===== DETECTION CALLBACKS =====

Detection.onDetection((data) => {
  if (data.type === 'audioLevel') {
    UI.updateAudioLevel(data.rms);
    updateSpectrum(data.rms);
  } else if (data.type === 'sound') {
    UI.updateSound(data.label, data.confidence);
    UI.addToLog(data.label, data.confidence, data.isCritical, data.gunshotProbability);

    // Update gunshot indicator
    const gunshotProb = document.getElementById('gunshotProb');
    if (gunshotProb) {
      gunshotProb.textContent = (data.gunshotProbability * 100).toFixed(0) + '%';
    }

    stats.detections++;
    if (data.isCritical) {
      stats.critical++;
      SoundFX.beep(600, 50, 0.15);
    }
  }
});

Detection.onTrigger(async (data) => {
  const sessionId = Detection.getCurrentSession();
  stats.apiCalls = (stats.apiCalls || 0) + 1;

  UI.setClaudeAnalyzing();

  // Update verdict icon
  const verdictIcon = document.getElementById('verdictIcon');
  if (verdictIcon) verdictIcon.textContent = '🔍';

  SoundFX.beep(440, 100, 0.2);

  const result = await API.sendToServer(data, sessionId);

  if (!result || sessionId !== Detection.getCurrentSession()) return;

  if (result.rateLimited) {
    UI.updateClaudeVerdict("⏳ Rate Limited", `Wait ${result.retryAfter}s`);
    return;
  }

  if (result.error) {
    UI.updateClaudeVerdict("Error", result.message);
    return;
  }

  if (result.emergency) {
    stats.emergencies++;
    SoundFX.emergency();

    if (verdictIcon) verdictIcon.textContent = '🚨';
    UI.updateClaudeVerdict("🚨 EMERGENCY", result.reason || "", result.recommendation || "");
    UI.setClaudeVerdictClass("verdict-emergency");

    UI.showAlert(`<strong>🚨 EMERGENCY</strong><br>${result.reason}<br><small>📱 Sending alert to contacts...</small>`);

    if ("vibrate" in navigator) navigator.vibrate([500, 200, 500, 200, 500]);

    Notifications.show('🚨 EMERGENCY', result.reason);

    // Send WhatsApp alert to emergency contacts
    API.sendEmergencyAlert({
      message: `Emergency detected! ${result.reason || "Critical sound detected."}`,
      severity: "critical",
      soundType: data.label,
      reason: result.reason
    }).then(alertResult => {
      console.log("📱 WhatsApp alert result:", alertResult);
      if (alertResult.success) {
        UI.showAlert(`<strong>🚨 EMERGENCY</strong><br>${result.reason}<br><small>📱 Alert sent to ${alertResult.contacts?.length || 0} contact(s)</small>`);
      } else {
        UI.showAlert(`<strong>🚨 EMERGENCY</strong><br>${result.reason}<br><small>⚠️ ${alertResult.message || "Could not send alert"}</small>`);
      }
    });

    Detection.shutdownForEmergency();
    UI.setEmergency();

  } else {
    if (verdictIcon) verdictIcon.textContent = '✅';
    SoundFX.success();
    UI.updateClaudeVerdict("✅ All Clear", result.reason || "", result.recommendation || "");
    UI.setClaudeVerdictClass("verdict-safe");
    UI.hideAlert();
  }
});

Detection.onError((err) => {
  console.error("Detection error:", err);
  UI.setError(err.message);
  SoundFX.warning();
});

console.log("🎨 Ultimate UI loaded! Press ? for shortcuts");
