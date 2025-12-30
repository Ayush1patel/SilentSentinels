/**
 * Silent Sentinel - ULTIMATE EDITION
 * Main Entry Point with all premium features
 */

import { UI } from './js/ui.js';
import { Detection } from './js/detection.js';
import { API } from './js/api.js';
import { VoiceCommand } from './js/voiceCommand.js';

console.log("🟢 Silent Sentinel v5.0 - ULTIMATE MASTERPIECE");
console.log("🎤 Voice commands enabled: Say 'SS Help', 'Help me', or 'Emergency'");

// ===== STATE =====
let initialized = false;
let emergencyAlertSent = false; // Flag to prevent duplicate alerts
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
  themes: ['dark', 'light', 'cyberpunk', 'ocean', 'forest', 'sunset', 'midnight'],
  currentTheme: 'dark',

  init() {
    const saved = localStorage.getItem('theme') || 'dark';
    this.set(saved);
    this.initThemeSelector();
  },

  set(theme) {
    // Remove all theme classes
    this.themes.forEach(t => {
      document.body.classList.remove(`${t}-theme`);
    });

    // Add new theme class (except for dark which is default)
    if (theme !== 'dark') {
      document.body.classList.add(`${theme}-theme`);
    }

    this.currentTheme = theme;
    localStorage.setItem('theme', theme);

    // Update theme selector UI
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === theme);
    });
  },

  initThemeSelector() {
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.addEventListener('click', () => {
        this.set(opt.dataset.theme);
        SoundFX.click();
      });
    });
  },

  toggle() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.set(this.themes[nextIndex]);
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

// ===== INTERNATIONALIZATION (i18n) =====
const I18n = {
  currentLang: 'en',
  translations: {
    en: {
      menu: 'Menu',
      home: 'Home',
      dashboard: 'Dashboard',
      settings: 'Settings',
      soundEffects: 'Sound Effects',
      notifications: 'Notifications',
      debugMode: 'Debug Mode',
      theme: 'Theme',
      themeDark: 'Dark',
      themeLight: 'Light',
      themeCyberpunk: 'Cyberpunk',
      themeOcean: 'Ocean',
      themeForest: 'Forest',
      themeSunset: 'Sunset',
      themeMidnight: 'Midnight',
      language: 'Language',
      subtitle: 'AI-Powered Emergency Detection System',
      currentDetection: '🎯 Current Detection',
      waitingAudio: 'Waiting for audio...',
      liveSpectrum: '📊 Live Audio Spectrum',
      detectionHistory: '📋 Detection History',
      aiVerdict: '🤖 AI Safety Verdict',
      waitingDetection: 'Waiting for detection...',
      controlPanel: '⚙️ Control Panel',
      statusIdle: 'Status: Idle',
      startMonitoring: 'Start Monitoring',
      stop: 'Stop',
      start: 'Start',
      emergencyRequired: '⚠️ Emergency Response Required',
      resumeNow: '✅ Resume Now (False Alarm)',
      pauseHours: '⏸️ Pause for 3 Hours (Real Emergency)',
      sessionStats: '📈 Session Statistics',
      detections: 'Detections',
      critical: 'Critical',
      emergencies: 'Emergencies',
      uptime: 'Uptime',
      audioLevel: '🎙️ Audio Level',
      help: 'Help',
      totalDetections: 'Total Detections',
      criticalEvents: 'Critical Events',
      emergenciesTriggered: 'Emergencies Triggered',
      safeEvents: 'Safe Events',
      detectionTimeline: '📈 Detection Timeline',
      soundDistribution: '🔊 Sound Type Distribution',
      confidenceLevels: '📊 Confidence Levels',
      hourlyActivity: '🕐 Hourly Activity',
      recentDetections: '📋 Recent Detections',
      time: 'Time',
      soundType: 'Sound Type',
      confidence: 'Confidence',
      status: 'Status'
    },
    hi: {
      menu: 'मेनू',
      home: 'होम',
      dashboard: 'डैशबोर्ड',
      settings: 'सेटिंग्स',
      soundEffects: 'ध्वनि प्रभाव',
      notifications: 'सूचनाएं',
      debugMode: 'डीबग मोड',
      theme: 'थीम',
      themeDark: 'डार्क',
      themeLight: 'लाइट',
      themeCyberpunk: 'साइबरपंक',
      themeOcean: 'महासागर',
      themeForest: 'जंगल',
      themeSunset: 'सूर्यास्त',
      themeMidnight: 'मध्यरात्रि',
      language: 'भाषा',
      subtitle: 'AI-संचालित आपातकालीन पहचान प्रणाली',
      currentDetection: '🎯 वर्तमान पहचान',
      waitingAudio: 'ऑडियो की प्रतीक्षा...',
      liveSpectrum: '📊 लाइव ऑडियो स्पेक्ट्रम',
      detectionHistory: '📋 पहचान इतिहास',
      aiVerdict: '🤖 AI सुरक्षा निर्णय',
      waitingDetection: 'पहचान की प्रतीक्षा...',
      controlPanel: '⚙️ नियंत्रण कक्ष',
      statusIdle: 'स्थिति: निष्क्रिय',
      startMonitoring: 'निगरानी शुरू करें',
      stop: 'रोकें',
      start: 'शुरू',
      emergencyRequired: '⚠️ आपातकालीन प्रतिक्रिया आवश्यक',
      resumeNow: '✅ अभी फिर से शुरू करें (गलत अलार्म)',
      pauseHours: '⏸️ 3 घंटे के लिए रोकें (वास्तविक आपातकाल)',
      sessionStats: '📈 सत्र सांख्यिकी',
      detections: 'पहचान',
      critical: 'गंभीर',
      emergencies: 'आपातकाल',
      uptime: 'अपटाइम',
      audioLevel: '🎙️ ऑडियो स्तर',
      help: 'मदद',
      totalDetections: 'कुल पहचान',
      criticalEvents: 'गंभीर घटनाएं',
      emergenciesTriggered: 'आपातकाल ट्रिगर',
      safeEvents: 'सुरक्षित घटनाएं',
      detectionTimeline: '📈 पहचान समयरेखा',
      soundDistribution: '🔊 ध्वनि प्रकार वितरण',
      confidenceLevels: '📊 विश्वास स्तर',
      hourlyActivity: '🕐 प्रति घंटा गतिविधि',
      recentDetections: '📋 हाल की पहचान',
      time: 'समय',
      soundType: 'ध्वनि प्रकार',
      confidence: 'विश्वास',
      status: 'स्थिति'
    },
    bn: {
      menu: 'মেনু',
      home: 'হোম',
      dashboard: 'ড্যাশবোর্ড',
      settings: 'সেটিংস',
      soundEffects: 'শব্দ প্রভাব',
      notifications: 'বিজ্ঞপ্তি',
      debugMode: 'ডিবাগ মোড',
      theme: 'থিম',
      themeDark: 'ডার্ক',
      themeLight: 'লাইট',
      themeCyberpunk: 'সাইবারপাঙ্ক',
      themeOcean: 'সমুদ্র',
      themeForest: 'বন',
      themeSunset: 'সূর্যাস্ত',
      themeMidnight: 'মধ্যরাত',
      language: 'ভাষা',
      subtitle: 'AI-চালিত জরুরি শনাক্তকরণ সিস্টেম',
      currentDetection: '🎯 বর্তমান শনাক্তকরণ',
      waitingAudio: 'অডিওর জন্য অপেক্ষা করছে...',
      liveSpectrum: '📊 লাইভ অডিও স্পেকট্রাম',
      detectionHistory: '📋 শনাক্তকরণ ইতিহাস',
      aiVerdict: '🤖 AI নিরাপত্তা রায়',
      waitingDetection: 'শনাক্তকরণের জন্য অপেক্ষা করছে...',
      controlPanel: '⚙️ কন্ট্রোল প্যানেল',
      statusIdle: 'স্থিতি: নিষ্ক্রিয়',
      startMonitoring: 'মনিটরিং শুরু করুন',
      stop: 'থামুন',
      start: 'শুরু',
      emergencyRequired: '⚠️ জরুরি প্রতিক্রিয়া প্রয়োজন',
      resumeNow: '✅ এখনই পুনরায় শুরু করুন (ভুল অ্যালার্ম)',
      pauseHours: '⏸️ 3 ঘন্টার জন্য বিরতি (প্রকৃত জরুরি)',
      sessionStats: '📈 সেশন পরিসংখ্যান',
      detections: 'শনাক্তকরণ',
      critical: 'গুরুতর',
      emergencies: 'জরুরি অবস্থা',
      uptime: 'আপটাইম',
      audioLevel: '🎙️ অডিও স্তর',
      help: 'সাহায্য',
      totalDetections: 'মোট শনাক্তকরণ',
      criticalEvents: 'গুরুতর ঘটনা',
      emergenciesTriggered: 'জরুরি অবস্থা ট্রিগার',
      safeEvents: 'নিরাপদ ঘটনা',
      detectionTimeline: '📈 শনাক্তকরণ টাইমলাইন',
      soundDistribution: '🔊 শব্দ প্রকার বিতরণ',
      confidenceLevels: '📊 আত্মবিশ্বাসের মাত্রা',
      hourlyActivity: '🕐 প্রতি ঘন্টায় কার্যকলাপ',
      recentDetections: '📋 সাম্প্রতিক শনাক্তকরণ',
      time: 'সময়',
      soundType: 'শব্দের ধরন',
      confidence: 'আত্মবিশ্বাস',
      status: 'স্থিতি'
    },
    mr: {
      menu: 'मेनू',
      home: 'होम',
      dashboard: 'डॅशबोर्ड',
      settings: 'सेटिंग्ज',
      soundEffects: 'ध्वनी प्रभाव',
      notifications: 'सूचना',
      debugMode: 'डीबग मोड',
      theme: 'थीम',
      themeDark: 'डार्क',
      themeLight: 'लाइट',
      themeCyberpunk: 'सायबरपंक',
      themeOcean: 'महासागर',
      themeForest: 'जंगल',
      themeSunset: 'सूर्यास्त',
      themeMidnight: 'मध्यरात्र',
      language: 'भाषा',
      subtitle: 'AI-संचालित आपत्कालीन शोध प्रणाली',
      currentDetection: '🎯 सध्याचे शोध',
      waitingAudio: 'ऑडिओची वाट पाहत आहे...',
      liveSpectrum: '📊 लाइव ऑडिओ स्पेक्ट्रम',
      detectionHistory: '📋 शोध इतिहास',
      aiVerdict: '🤖 AI सुरक्षा निर्णय',
      waitingDetection: 'शोधाची वाट पाहत आहे...',
      controlPanel: '⚙️ नियंत्रण पॅनेल',
      statusIdle: 'स्थिती: निष्क्रिय',
      startMonitoring: 'निरीक्षण सुरू करा',
      stop: 'थांबा',
      start: 'सुरू',
      emergencyRequired: '⚠️ आपत्कालीन प्रतिसाद आवश्यक',
      resumeNow: '✅ आता पुन्हा सुरू करा (खोटा अलार्म)',
      pauseHours: '⏸️ 3 तासांसाठी थांबा (खरी आपत्काल)',
      sessionStats: '📈 सत्र सांख्यिकी',
      detections: 'शोध',
      critical: 'गंभीर',
      emergencies: 'आपत्काल',
      uptime: 'अपटाइम',
      audioLevel: '🎙️ ऑडिओ पातळी',
      help: 'मदत',
      totalDetections: 'एकूण शोध',
      criticalEvents: 'गंभीर घटना',
      emergenciesTriggered: 'आपत्काल ट्रिगर',
      safeEvents: 'सुरक्षित घटना',
      detectionTimeline: '📈 शोध टाइमलाइन',
      soundDistribution: '🔊 ध्वनी प्रकार वितरण',
      confidenceLevels: '📊 आत्मविश्वास पातळी',
      hourlyActivity: '🕐 तासाभरातील क्रियाकलाप',
      recentDetections: '📋 अलीकडील शोध',
      time: 'वेळ',
      soundType: 'ध्वनी प्रकार',
      confidence: 'आत्मविश्वास',
      status: 'स्थिती'
    },
    ta: {
      menu: 'மெனு',
      home: 'முகப்பு',
      dashboard: 'டாஷ்போர்டு',
      settings: 'அமைப்புகள்',
      soundEffects: 'ஒலி விளைவுகள்',
      notifications: 'அறிவிப்புகள்',
      debugMode: 'பிழைத்திருத்த முறை',
      theme: 'தீம்',
      themeDark: 'இருண்ட',
      themeLight: 'ஒளி',
      themeCyberpunk: 'சைபர்பங்க்',
      themeOcean: 'கடல்',
      themeForest: 'காடு',
      themeSunset: 'சூரிய அஸ்தமனம்',
      themeMidnight: 'நள்ளிரவு',
      language: 'மொழி',
      subtitle: 'AI-இயக்கப்படும் அவசர கண்டறிதல் அமைப்பு',
      currentDetection: '🎯 தற்போதைய கண்டறிதல்',
      waitingAudio: 'ஆடியோவுக்காக காத்திருக்கிறது...',
      liveSpectrum: '📊 நேரடி ஆடியோ ஸ்பெக்ட்ரம்',
      detectionHistory: '📋 கண்டறிதல் வரலாறு',
      aiVerdict: '🤖 AI பாதுகாப்பு தீர்ப்பு',
      waitingDetection: 'கண்டறிதலுக்காக காத்திருக்கிறது...',
      controlPanel: '⚙️ கட்டுப்பாட்டு பலகை',
      statusIdle: 'நிலை: செயலற்ற',
      startMonitoring: 'கண்காணிப்பைத் தொடங்கு',
      stop: 'நிறுத்து',
      start: 'தொடங்கு',
      emergencyRequired: '⚠️ அவசர பதில் தேவை',
      resumeNow: '✅ இப்போது மீண்டும் தொடங்கு (தவறான எச்சரிக்கை)',
      pauseHours: '⏸️ 3 மணி நேரம் இடைநிறுத்தம் (உண்மையான அவசரம்)',
      sessionStats: '📈 அமர்வு புள்ளிவிவரங்கள்',
      detections: 'கண்டறிதல்கள்',
      critical: 'முக்கியமான',
      emergencies: 'அவசர நிலைகள்',
      uptime: 'இயங்கு நேரம்',
      audioLevel: '🎙️ ஆடியோ நிலை',
      help: 'உதவி',
      totalDetections: 'மொத்த கண்டறிதல்கள்',
      criticalEvents: 'முக்கிய நிகழ்வுகள்',
      emergenciesTriggered: 'அவசர நிலைகள் தூண்டப்பட்டன',
      safeEvents: 'பாதுகாப்பான நிகழ்வுகள்',
      detectionTimeline: '📈 கண்டறிதல் காலவரிசை',
      soundDistribution: '🔊 ஒலி வகை விநியோகம்',
      confidenceLevels: '📊 நம்பிக்கை நிலைகள்',
      hourlyActivity: '🕐 மணிநேர செயல்பாடு',
      recentDetections: '📋 சமீபத்திய கண்டறிதல்கள்',
      time: 'நேரம்',
      soundType: 'ஒலி வகை',
      confidence: 'நம்பிக்கை',
      status: 'நிலை'
    },
    kn: {
      menu: 'ಮೆನು',
      home: 'ಹೋಮ್',
      dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
      soundEffects: 'ಧ್ವನಿ ಪರಿಣಾಮಗಳು',
      notifications: 'ಅಧಿಸೂಚನೆಗಳು',
      debugMode: 'ಡೀಬಗ್ ಮೋಡ್',
      theme: 'ಥೀಮ್',
      themeDark: 'ಡಾರ್ಕ್',
      themeLight: 'ಲೈಟ್',
      themeCyberpunk: 'ಸೈಬರ್‌ಪಂಕ್',
      themeOcean: 'ಸಾಗರ',
      themeForest: 'ಅರಣ್ಯ',
      themeSunset: 'ಸೂರ್ಯಾಸ್ತ',
      themeMidnight: 'ಮಧ್ಯರಾತ್ರಿ',
      language: 'ಭಾಷೆ',
      subtitle: 'AI-ಚಾಲಿತ ತುರ್ತು ಪತ್ತೆ ವ್ಯವಸ್ಥೆ',
      currentDetection: '🎯 ಪ್ರಸ್ತುತ ಪತ್ತೆ',
      waitingAudio: 'ಆಡಿಯೋಗಾಗಿ ಕಾಯುತ್ತಿದೆ...',
      liveSpectrum: '📊 ಲೈವ್ ಆಡಿಯೋ ಸ್ಪೆಕ್ಟ್ರಮ್',
      detectionHistory: '📋 ಪತ್ತೆ ಇತಿಹಾಸ',
      aiVerdict: '🤖 AI ಸುರಕ್ಷತಾ ತೀರ್ಪು',
      waitingDetection: 'ಪತ್ತೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ...',
      controlPanel: '⚙️ ನಿಯಂತ್ರಣ ಫಲಕ',
      statusIdle: 'ಸ್ಥಿತಿ: ನಿಷ್ಕ್ರಿಯ',
      startMonitoring: 'ಮಾನಿಟರಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ',
      stop: 'ನಿಲ್ಲಿಸಿ',
      start: 'ಪ್ರಾರಂಭಿಸಿ',
      emergencyRequired: '⚠️ ತುರ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಅಗತ್ಯ',
      resumeNow: '✅ ಈಗ ಮುಂದುವರಿಸಿ (ತಪ್ಪು ಎಚ್ಚರಿಕೆ)',
      pauseHours: '⏸️ 3 ಗಂಟೆ ವಿರಾಮ (ನಿಜವಾದ ತುರ್ತು)',
      sessionStats: '📈 ಅಧಿವೇಶನ ಅಂಕಿಅಂಶಗಳು',
      detections: 'ಪತ್ತೆಗಳು',
      critical: 'ನಿರ್ಣಾಯಕ',
      emergencies: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಗಳು',
      uptime: 'ಅಪ್‌ಟೈಮ್',
      audioLevel: '🎙️ ಆಡಿಯೋ ಮಟ್ಟ',
      help: 'ಸಹಾಯ',
      totalDetections: 'ಒಟ್ಟು ಪತ್ತೆಗಳು',
      criticalEvents: 'ನಿರ್ಣಾಯಕ ಘಟನೆಗಳು',
      emergenciesTriggered: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಗಳು ಪ್ರಚೋದಿಸಲಾಗಿದೆ',
      safeEvents: 'ಸುರಕ್ಷಿತ ಘಟನೆಗಳು',
      detectionTimeline: '📈 ಪತ್ತೆ ಟೈಮ್‌ಲೈನ್',
      soundDistribution: '🔊 ಧ್ವನಿ ಪ್ರಕಾರ ವಿತರಣೆ',
      confidenceLevels: '📊 ವಿಶ್ವಾಸ ಮಟ್ಟಗಳು',
      hourlyActivity: '🕐 ಗಂಟೆಯ ಚಟುವಟಿಕೆ',
      recentDetections: '📋 ಇತ್ತೀಚಿನ ಪತ್ತೆಗಳು',
      time: 'ಸಮಯ',
      soundType: 'ಧ್ವನಿ ಪ್ರಕಾರ',
      confidence: 'ವಿಶ್ವಾಸ',
      status: 'ಸ್ಥಿತಿ'
    },
    gu: {
      menu: 'મેનુ',
      home: 'હોમ',
      dashboard: 'ડેશબોર્ડ',
      settings: 'સેટિંગ્સ',
      soundEffects: 'ધ્વનિ અસરો',
      notifications: 'સૂચનાઓ',
      debugMode: 'ડીબગ મોડ',
      theme: 'થીમ',
      themeDark: 'ડાર્ક',
      themeLight: 'લાઇટ',
      themeCyberpunk: 'સાયબરપંક',
      themeOcean: 'મહાસાગર',
      themeForest: 'જંગલ',
      themeSunset: 'સૂર્યાસ્ત',
      themeMidnight: 'મધ્યરાત્રિ',
      language: 'ભાષા',
      subtitle: 'AI-સંચાલિત કટોકટી શોધ સિસ્ટમ',
      currentDetection: '🎯 વર્તમાન શોધ',
      waitingAudio: 'ઓડિયોની રાહ જોઈ રહ્યા છીએ...',
      liveSpectrum: '📊 લાઇવ ઓડિયો સ્પેક્ટ્રમ',
      detectionHistory: '📋 શોધ ઇતિહાસ',
      aiVerdict: '🤖 AI સુરક્ષા ચુકાદો',
      waitingDetection: 'શોધની રાહ જોઈ રહ્યા છીએ...',
      controlPanel: '⚙️ નિયંત્રણ પેનલ',
      statusIdle: 'સ્થિતિ: નિષ્ક્રિય',
      startMonitoring: 'મોનિટરિંગ શરૂ કરો',
      stop: 'બંધ કરો',
      start: 'શરૂ કરો',
      emergencyRequired: '⚠️ કટોકટી પ્રતિસાદ જરૂરી',
      resumeNow: '✅ હવે ફરી શરૂ કરો (ખોટો એલાર્મ)',
      pauseHours: '⏸️ 3 કલાક માટે થોભો (વાસ્તવિક કટોકટી)',
      sessionStats: '📈 સત્ર આંકડા',
      detections: 'શોધ',
      critical: 'ગંભીર',
      emergencies: 'કટોકટી',
      uptime: 'અપટાઇમ',
      audioLevel: '🎙️ ઓડિયો સ્તર',
      help: 'મદદ',
      totalDetections: 'કુલ શોધ',
      criticalEvents: 'ગંભીર ઘટનાઓ',
      emergenciesTriggered: 'કટોકટી ટ્રિગર',
      safeEvents: 'સુરક્ષિત ઘટનાઓ',
      detectionTimeline: '📈 શોધ ટાઇમલાઇન',
      soundDistribution: '🔊 ધ્વનિ પ્રકાર વિતરણ',
      confidenceLevels: '📊 વિશ્વાસ સ્તરો',
      hourlyActivity: '🕐 કલાકદીઠ પ્રવૃત્તિ',
      recentDetections: '📋 તાજેતરની શોધ',
      time: 'સમય',
      soundType: 'ધ્વનિ પ્રકાર',
      confidence: 'વિશ્વાસ',
      status: 'સ્થિતિ'
    },
    as: {
      menu: 'মেনু',
      home: 'হোম',
      dashboard: 'ডেচবোৰ্ড',
      settings: 'ছেটিংছ',
      soundEffects: 'শব্দ প্ৰভাৱ',
      notifications: 'জাননী',
      debugMode: 'ডিবাগ মোড',
      theme: 'থীম',
      themeDark: 'ডাৰ্ক',
      themeLight: 'লাইট',
      themeCyberpunk: 'চাইবাৰপাংক',
      themeOcean: 'সাগৰ',
      themeForest: 'অৰণ্য',
      themeSunset: 'সূৰ্যাস্ত',
      themeMidnight: 'মাজনিশা',
      language: 'ভাষা',
      subtitle: 'AI-চালিত জৰুৰীকালীন চিনাক্তকৰণ ব্যৱস্থা',
      currentDetection: '🎯 বৰ্তমান চিনাক্তকৰণ',
      waitingAudio: 'অডিঅ\'ৰ বাবে অপেক্ষা কৰি আছে...',
      liveSpectrum: '📊 লাইভ অডিঅ\' স্পেক্ট্ৰাম',
      detectionHistory: '📋 চিনাক্তকৰণ ইতিহাস',
      aiVerdict: '🤖 AI সুৰক্ষা ৰায়',
      waitingDetection: 'চিনাক্তকৰণৰ বাবে অপেক্ষা কৰি আছে...',
      controlPanel: '⚙️ নিয়ন্ত্ৰণ পেনেল',
      statusIdle: 'অৱস্থা: নিষ্ক্ৰিয়',
      startMonitoring: 'নিৰীক্ষণ আৰম্ভ কৰক',
      stop: 'বন্ধ কৰক',
      start: 'আৰম্ভ কৰক',
      emergencyRequired: '⚠️ জৰুৰীকালীন প্ৰতিক্ৰিয়া প্ৰয়োজন',
      resumeNow: '✅ এতিয়াই পুনৰ আৰম্ভ কৰক (ভুল এলাৰ্ম)',
      pauseHours: '⏸️ 3 ঘণ্টাৰ বাবে বিৰতি (প্ৰকৃত জৰুৰী)',
      sessionStats: '📈 অধিৱেশন পৰিসংখ্যা',
      detections: 'চিনাক্তকৰণ',
      critical: 'গুৰুতৰ',
      emergencies: 'জৰুৰী অৱস্থা',
      uptime: 'আপটাইম',
      audioLevel: '🎙️ অডিঅ\' স্তৰ',
      help: 'সহায়',
      totalDetections: 'মুঠ চিনাক্তকৰণ',
      criticalEvents: 'গুৰুতৰ ঘটনা',
      emergenciesTriggered: 'জৰুৰী অৱস্থা ট্ৰিগাৰ',
      safeEvents: 'সুৰক্ষিত ঘটনা',
      detectionTimeline: '📈 চিনাক্তকৰণ টাইমলাইন',
      soundDistribution: '🔊 শব্দ প্ৰকাৰ বিতৰণ',
      confidenceLevels: '📊 আত্মবিশ্বাসৰ মাত্ৰা',
      hourlyActivity: '🕐 প্ৰতি ঘণ্টাত কাৰ্যকলাপ',
      recentDetections: '📋 শেহতীয়া চিনাক্তকৰণ',
      time: 'সময়',
      soundType: 'শব্দৰ প্ৰকাৰ',
      confidence: 'আত্মবিশ্বাস',
      status: 'অৱস্থা'
    }
  },

  init() {
    const saved = localStorage.getItem('language') || 'en';
    this.set(saved);
    this.initLanguageSelector();
  },

  set(lang) {
    if (!this.translations[lang]) lang = 'en';
    this.currentLang = lang;
    localStorage.setItem('language', lang);

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (this.translations[lang][key]) {
        el.textContent = this.translations[lang][key];
      }
    });

    // Update language selector UI
    document.querySelectorAll('.language-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === lang);
    });
  },

  initLanguageSelector() {
    document.querySelectorAll('.language-option').forEach(opt => {
      opt.addEventListener('click', () => {
        this.set(opt.dataset.lang);
        SoundFX.click();
      });
    });
  },

  t(key) {
    return this.translations[this.currentLang]?.[key] || this.translations.en[key] || key;
  }
};

// ===== SIDEBAR MANAGER =====
const SidebarManager = {
  sidebar: null,
  overlay: null,

  init() {
    this.sidebar = document.getElementById('sidebar');
    this.overlay = document.getElementById('sidebarOverlay');

    // Hamburger button
    document.getElementById('hamburgerBtn')?.addEventListener('click', () => this.open());

    // Close button
    document.getElementById('sidebarClose')?.addEventListener('click', () => this.close());

    // Overlay click
    this.overlay?.addEventListener('click', () => this.close());

    // Navigation items
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        this.switchView(view);
        document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        SoundFX.click();
      });
    });

    // Sync sidebar toggles with main toggles
    this.syncToggles();
  },

  open() {
    this.sidebar?.classList.add('open');
    this.overlay?.classList.add('visible');
    SoundFX.click();
  },

  close() {
    this.sidebar?.classList.remove('open');
    this.overlay?.classList.remove('visible');
  },

  switchView(view) {
    const mainView = document.getElementById('mainView');
    const dashboardView = document.getElementById('dashboardView');

    if (view === 'main') {
      mainView?.classList.remove('hidden');
      dashboardView?.classList.remove('active');
    } else if (view === 'dashboard') {
      mainView?.classList.add('hidden');
      dashboardView?.classList.add('active');
      DashboardCharts.init();
    }

    this.close();
  },

  syncToggles() {
    // Sound toggle
    const sidebarSound = document.getElementById('sidebarSoundEffects');
    const mainSound = document.getElementById('soundEffects');
    if (sidebarSound && mainSound) {
      sidebarSound.checked = mainSound.checked;
      sidebarSound.addEventListener('change', (e) => {
        mainSound.checked = e.target.checked;
        SoundFX.enabled = e.target.checked;
        if (SoundFX.enabled) SoundFX.click();
      });
    }

    // Notifications toggle
    const sidebarNotif = document.getElementById('sidebarNotifications');
    const mainNotif = document.getElementById('notifications');
    if (sidebarNotif && mainNotif) {
      sidebarNotif.checked = mainNotif.checked;
      sidebarNotif.addEventListener('change', (e) => {
        mainNotif.checked = e.target.checked;
        Notifications.enabled = e.target.checked;
        if (Notifications.enabled) Notifications.request();
      });
    }

    // Debug toggle
    const sidebarDebug = document.getElementById('sidebarDebugMode');
    const mainDebug = document.getElementById('debugMode');
    if (sidebarDebug && mainDebug) {
      sidebarDebug.checked = mainDebug.checked;
      sidebarDebug.addEventListener('change', (e) => {
        mainDebug.checked = e.target.checked;
        Detection.setDebugMode(e.target.checked);
        SoundFX.click();
      });
    }
  }
};

// ===== EMERGENCY MODE (Flash + Red Glow) =====
const EmergencyMode = {
  active: false,

  activate() {
    if (this.active) return;
    this.active = true;
    document.body.classList.add('emergency-mode');
  },

  deactivate() {
    this.active = false;
    document.body.classList.remove('emergency-mode');
  }
};

// ===== DASHBOARD CHARTS =====
const DashboardCharts = {
  initialized: false,
  charts: {},
  detectionData: [],

  init() {
    if (this.initialized) {
      this.updateCharts();
      return;
    }

    // Load saved data
    this.loadData();

    // Create charts
    this.createTimelineChart();
    this.createDistributionChart();
    this.createConfidenceChart();
    this.createHourlyChart();

    this.initialized = true;
    this.updateDashboardStats();
  },

  loadData() {
    try {
      const saved = localStorage.getItem('detectionHistory');
      if (saved) {
        this.detectionData = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load detection history:', e);
    }
  },

  saveData() {
    try {
      // Keep only last 100 entries
      if (this.detectionData.length > 100) {
        this.detectionData = this.detectionData.slice(-100);
      }
      localStorage.setItem('detectionHistory', JSON.stringify(this.detectionData));
    } catch (e) {
      console.error('Failed to save detection history:', e);
    }
  },

  addDetection(data) {
    this.detectionData.push({
      timestamp: Date.now(),
      label: data.label,
      confidence: data.confidence,
      isCritical: data.isCritical,
      gunshotProbability: data.gunshotProbability
    });
    this.saveData();
    this.updateDashboardStats();
    this.updateHistoryTable(data);

    if (this.initialized) {
      this.updateCharts();
    }
  },

  updateDashboardStats() {
    const total = this.detectionData.length;
    const critical = this.detectionData.filter(d => d.isCritical).length;
    const emergencies = stats.emergencies || 0;
    const safe = total - critical;

    document.getElementById('dashTotalDetections').textContent = total;
    document.getElementById('dashCriticalEvents').textContent = critical;
    document.getElementById('dashEmergencies').textContent = emergencies;
    document.getElementById('dashSafeEvents').textContent = safe;
  },

  updateHistoryTable(data) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    const row = document.createElement('tr');
    const time = new Date().toLocaleTimeString();
    const statusClass = data.isCritical ? 'critical' : 'safe';
    const statusText = data.isCritical ? 'Critical' : 'Safe';

    row.innerHTML = `
      <td>${time}</td>
      <td>${data.label}</td>
      <td>${(data.confidence * 100).toFixed(1)}%</td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td>—</td>
    `;

    tbody.insertBefore(row, tbody.firstChild);

    // Keep only last 20 rows
    while (tbody.children.length > 20) {
      tbody.removeChild(tbody.lastChild);
    }
  },

  createTimelineChart() {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;

    const last10 = this.detectionData.slice(-10);
    const labels = last10.map((_, i) => `#${i + 1}`);
    const data = last10.map(d => d.confidence * 100);

    this.charts.timeline = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Confidence %',
          data,
          borderColor: 'rgba(102, 126, 234, 1)',
          backgroundColor: 'rgba(102, 126, 234, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.1)' } },
          x: { grid: { color: 'rgba(255,255,255,0.1)' } }
        }
      }
    });
  },

  createDistributionChart() {
    const ctx = document.getElementById('distributionChart');
    if (!ctx) return;

    const soundCounts = {};
    this.detectionData.forEach(d => {
      soundCounts[d.label] = (soundCounts[d.label] || 0) + 1;
    });

    const sortedSounds = Object.entries(soundCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.charts.distribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: sortedSounds.map(s => s[0]),
        datasets: [{
          data: sortedSounds.map(s => s[1]),
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } } }
      }
    });
  },

  createConfidenceChart() {
    const ctx = document.getElementById('confidenceChart');
    if (!ctx) return;

    const ranges = { '0-25%': 0, '25-50%': 0, '50-75%': 0, '75-100%': 0 };
    this.detectionData.forEach(d => {
      const conf = d.confidence * 100;
      if (conf < 25) ranges['0-25%']++;
      else if (conf < 50) ranges['25-50%']++;
      else if (conf < 75) ranges['50-75%']++;
      else ranges['75-100%']++;
    });

    this.charts.confidence = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(ranges),
        datasets: [{
          label: 'Count',
          data: Object.values(ranges),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(102, 126, 234, 0.8)',
            'rgba(16, 185, 129, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
          x: { grid: { color: 'rgba(255,255,255,0.1)' } }
        }
      }
    });
  },

  createHourlyChart() {
    const ctx = document.getElementById('hourlyChart');
    if (!ctx) return;

    const hourCounts = new Array(24).fill(0);
    this.detectionData.forEach(d => {
      const hour = new Date(d.timestamp).getHours();
      hourCounts[hour]++;
    });

    this.charts.hourly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{
          label: 'Detections',
          data: hourCounts,
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
          x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { maxTicksLimit: 12 } }
        }
      }
    });
  },

  updateCharts() {
    // Update timeline chart
    if (this.charts.timeline) {
      const last10 = this.detectionData.slice(-10);
      this.charts.timeline.data.labels = last10.map((_, i) => `#${i + 1}`);
      this.charts.timeline.data.datasets[0].data = last10.map(d => d.confidence * 100);
      this.charts.timeline.update();
    }

    // Update distribution chart
    if (this.charts.distribution) {
      const soundCounts = {};
      this.detectionData.forEach(d => {
        soundCounts[d.label] = (soundCounts[d.label] || 0) + 1;
      });
      const sortedSounds = Object.entries(soundCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      this.charts.distribution.data.labels = sortedSounds.map(s => s[0]);
      this.charts.distribution.data.datasets[0].data = sortedSounds.map(s => s[1]);
      this.charts.distribution.update();
    }

    // Update confidence chart
    if (this.charts.confidence) {
      const ranges = { '0-25%': 0, '25-50%': 0, '50-75%': 0, '75-100%': 0 };
      this.detectionData.forEach(d => {
        const conf = d.confidence * 100;
        if (conf < 25) ranges['0-25%']++;
        else if (conf < 50) ranges['25-50%']++;
        else if (conf < 75) ranges['50-75%']++;
        else ranges['75-100%']++;
      });
      this.charts.confidence.data.datasets[0].data = Object.values(ranges);
      this.charts.confidence.update();
    }

    // Update hourly chart
    if (this.charts.hourly) {
      const hourCounts = new Array(24).fill(0);
      this.detectionData.forEach(d => {
        const hour = new Date(d.timestamp).getHours();
        hourCounts[hour]++;
      });
      this.charts.hourly.data.datasets[0].data = hourCounts;
      this.charts.hourly.update();
    }
  }
};

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;

  switch (e.key.toLowerCase()) {
    case 's': document.getElementById('startBtn')?.click(); break;
    case 'x': document.getElementById('stopBtn')?.click(); break;
    case 't': ThemeManager.toggle(); break;
    case 'd': document.getElementById('sidebarDebugMode')?.click(); break;
    case 'm': SidebarManager.open(); break;
    case 'f':
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
      break;
    case '?':
      alert(`⌨️ Keyboard Shortcuts:\n\nS - Start\nX - Stop\nT - Theme\nM - Menu\nD - Debug\nF - Fullscreen`);
      break;
  }
});

// ===== INITIALIZE =====
ThemeManager.init();
I18n.init();
SidebarManager.init();
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

    // Start voice command listening
    if (VoiceCommand.isSupported()) {
      VoiceCommand.start();
      console.log("🎤 Voice commands active");
    }

    UI.setMonitoring();
    UI.hideEmergencyControls();

    // Reset stats and alert flag
    emergencyAlertSent = false;
    stats = { detections: 0, critical: 0, emergencies: 0, startTime: Date.now() };

    Notifications.show('Silent Sentinel', 'Monitoring started! 🎧 Voice commands active.');

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
  VoiceCommand.stop(); // Stop voice command listening
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
  EmergencyMode.deactivate(); // Deactivate flash and red glow
  emergencyAlertSent = false; // Reset alert flag for next emergency
  UI.hideEmergencyControls();
  Detection.resumeAfterFalseAlarm();
  UI.hideAlert();
  UI.updateClaudeVerdict("Waiting for detection...");
  UI.setClaudeVerdictClass("");
  UI.resetToIdle();
  // Voice commands will restart with Detection when start button is clicked
  document.getElementById('startBtn')?.click();
});

// Resume Later Button
UI.onResumeLaterClick(() => {
  SoundFX.warning();
  EmergencyMode.deactivate(); // Deactivate flash and red glow
  emergencyAlertSent = false; // Reset alert flag for next emergency
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

    // Add to dashboard charts
    DashboardCharts.addDetection(data);
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
    EmergencyMode.activate(); // Activate flash and red glow

    if (verdictIcon) verdictIcon.textContent = '🚨';
    UI.updateClaudeVerdict("🚨 EMERGENCY", result.reason || "", result.recommendation || "");
    UI.setClaudeVerdictClass("verdict-emergency");

    UI.showAlert(`<strong>🚨 EMERGENCY</strong><br>${result.reason}<br><small>📱 Sending alert to contacts...</small>`);

    if ("vibrate" in navigator) navigator.vibrate([500, 200, 500, 200, 500]);

    Notifications.show('🚨 EMERGENCY', result.reason);

    // Send WhatsApp alert ONLY ONCE - check the flag first
    if (!emergencyAlertSent) {
      emergencyAlertSent = true; // Set flag immediately to prevent duplicates
      console.log("📱 Sending emergency alert (first and only time)...");

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
    } else {
      console.log("📱 Emergency alert already sent - skipping duplicate");
    }

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

// ===== VOICE COMMAND EMERGENCY HANDLER =====
// This triggers directly without Claude verification - for user-initiated emergencies
VoiceCommand.onVoiceEmergency(async (data) => {
  console.log("🆘 VOICE EMERGENCY TRIGGERED:", data);

  stats.emergencies++;
  SoundFX.emergency();
  EmergencyMode.activate(); // Activate flash and red glow

  const verdictIcon = document.getElementById('verdictIcon');
  if (verdictIcon) verdictIcon.textContent = '🆘';

  // Create user-friendly message based on the phrase
  let reason = "Voice command emergency activated";
  if (data.phrase.includes('help')) {
    reason = "User called for help";
  } else if (data.phrase === 'emergency') {
    reason = "User declared emergency";
  } else if (data.phrase === 'mayday') {
    reason = "User called mayday";
  }

  UI.updateClaudeVerdict("🆘 USER EMERGENCY", reason, "Alert sent to emergency contacts");
  UI.setClaudeVerdictClass("verdict-emergency");

  UI.showAlert(`<strong>🆘 USER EMERGENCY</strong><br>${reason}<br><small>Voice command: "${data.transcript}"</small><br><small>📱 Sending alert to contacts...</small>`);

  if ("vibrate" in navigator) navigator.vibrate([500, 200, 500, 200, 500]);

  Notifications.show('🆘 USER EMERGENCY', reason);

  // Send WhatsApp alert to emergency contacts - NO Claude verification needed
  // Only send if alert hasn't been sent already
  if (!emergencyAlertSent) {
    emergencyAlertSent = true; // Set flag immediately to prevent duplicates
    console.log("📱 Sending voice emergency alert (first and only time)...");

    try {
      const alertResult = await API.sendEmergencyAlert({
        message: `USER EMERGENCY! ${reason}. Voice command detected: "${data.phrase}". Please check on them immediately.`,
        severity: "critical",
        soundType: "VOICE_COMMAND",
        reason: reason
      });

      console.log("📱 WhatsApp alert result:", alertResult);
      if (alertResult.success) {
        UI.showAlert(`<strong>🆘 USER EMERGENCY</strong><br>${reason}<br><small>📱 Alert sent to ${alertResult.contacts?.length || 0} contact(s)</small>`);
      } else {
        UI.showAlert(`<strong>🆘 USER EMERGENCY</strong><br>${reason}<br><small>⚠️ ${alertResult.message || "Could not send alert"}</small>`);
      }
    } catch (err) {
      console.error("Failed to send voice emergency alert:", err);
      UI.showAlert(`<strong>🆘 USER EMERGENCY</strong><br>${reason}<br><small>⚠️ Failed to send alert</small>`);
    }
  } else {
    console.log("📱 Emergency alert already sent - skipping duplicate voice emergency");
  }

  // Stop detection and show emergency controls
  Detection.shutdownForEmergency();
  VoiceCommand.stop();
  UI.setEmergency();
});

// Voice command status updates
VoiceCommand.onStatus((status) => {
  console.log("🎤 Voice status:", status);
});

console.log("🎨 Ultimate UI loaded! Press ? for shortcuts");
