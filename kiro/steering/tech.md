# 🔧 Technology Stack

> Steering file defining technical standards and conventions

---

## Core Technologies

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| JavaScript | ES2022 | Core application logic |
| HTML5 | Living Standard | Semantic structure |
| CSS3 | Modern | Premium styling with animations |
| Web Audio API | W3C | Real-time audio capture |

### Machine Learning

| Technology | Version | Purpose |
|------------|---------|---------|
| TensorFlow.js | 4.x | ML runtime in browser |
| YAMNet | Google Hub | 521-category audio classification |
| Custom CNN | TFLite→TFJS | Binary gunshot detection |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Server runtime |
| Express | 4.x | HTTP server |
| Anthropic SDK | Latest | Claude AI integration |

---

## Coding Standards

### JavaScript

```javascript
// Use modern ES6+ syntax
const detectSound = async (audioBuffer) => {
  // Prefer async/await over callbacks
  const results = await model.predict(audioBuffer);
  return results;
};

// Use descriptive variable names
const CRITICAL_CONFIDENCE_THRESHOLD = 0.8;
const PATTERN_DETECTION_WINDOW = 20;

// Document all exported functions
/**
 * Analyzes audio buffer for emergency sounds
 * @param {Float32Array} buffer - Audio samples (16kHz)
 * @returns {DetectionResult} - Classification results
 */
export function analyzeAudio(buffer) { ... }
```

### CSS

```css
/* Use CSS custom properties for theming */
:root {
  --bg-primary: #0a0a0f;
  --accent-gradient: linear-gradient(135deg, #667eea, #764ba2);
}

/* Mobile-first responsive design */
.card {
  padding: 1rem;
}

@media (min-width: 768px) {
  .card {
    padding: 2rem;
  }
}

/* Use BEM-like naming */
.card__title { }
.card__content { }
.card--emergency { }
```

---

## Performance Standards

| Metric | Target | Measurement |
|--------|--------|-------------|
| Detection latency | <200ms | Time from audio to classification |
| UI frame rate | 60 FPS | Smooth animations |
| Model load time | <3s | Initial page load |
| Memory usage | <150MB | During active detection |

---

## Security Standards

- ✅ No audio data leaves the browser (except emergency context to Claude)
- ✅ API keys stored server-side only
- ✅ HTTPS required for production
- ✅ Microphone permission requested explicitly

---

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Safari | 15+ | ⚠️ WebGL issues possible |

---

<p align="center">
  <sub>Technology standards enforced by Kiro</sub>
</p>
