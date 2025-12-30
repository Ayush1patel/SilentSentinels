# 🎨 UI/UX Specification

> Design system for Silent Sentinel's premium interface

---

## Design Philosophy

> "A life-saving interface must inspire confidence in a moment of crisis."

Silent Sentinel is designed **accessibility-first** for deaf and hard-of-hearing users, with premium visual feedback that communicates urgency without relying on sound.

---

## Theme System (7 Themes)

| Theme | Primary | Accent | Special |
|-------|---------|--------|---------|
| 🌙 Midnight | `#0a0a0f` | Purple/Blue gradient | Default |
| 🌊 Ocean | Deep navy | Cyan/Teal | — |
| 🌲 Forest | Dark green | Emerald | — |
| 🌅 Sunset | Warm black | Orange/Pink | — |
| 🌸 Rose | Dark pink | Magenta | — |
| ⚡ Cyberpunk | Black | Neon pink/cyan | 🎵 Plays music! |
| ☀️ Light | `#f8f9fa` | Indigo | High contrast |

---

## Emergency Level Flash

Dynamic visual feedback based on threat severity:

```css
.emergency-low    { /* Subtle pulse */ }
.emergency-medium { /* Visible pulse */ }
.emergency-high   { /* Strong red pulse */ }
.emergency-critical { /* Full-screen flash */ }
```

| Level | Trigger | Effect |
|-------|---------|--------|
| Idle | No threat | Normal |
| Low | Critical 20%+ | Subtle glow |
| Medium | Critical 45%+ | Pulsing border |
| High | Critical 70%+ | Red pulse |
| Critical | Gunshot 75%+ | Screen flash |

---

## Component Library

### Status Indicator

```
┌─[🟢]─ MONITORING ─────────────────────┐
│  ● Listening for emergency sounds    │
│  🎤 Voice commands active            │
└───────────────────────────────────────┘
```

### Detection Card

```
┌─ 🎯 Current Detection ────────────────┐
│                                       │
│  ∿∿∿∿∿  (sound wave animation)       │
│                                       │
│  Speech                               │
│  Confidence: 87%                      │
│                                       │
│  🎯 Gunshot: 2%                       │
│                                       │
│  🎤 Say "SS Help" for voice emergency │
└───────────────────────────────────────┘
```

### AI Verdict Card (Hero)

```
┌─ 🤖 AI Safety Verdict ────────────────┐
│                                       │
│         ╭───────────╮                 │
│         │    🔍    │ (spinning ring) │
│         ╰───────────╯                 │
│                                       │
│  Waiting for detection...             │
│                                       │
│  ● Claude AI (status dot)             │
└───────────────────────────────────────┘
```

---

## Visual Effects

### Particles System

- 8 floating particles
- Upward float animation
- 8-15 second cycle
- Opacity varies with movement

### Glowing Orbs

- 3 large orbs (200-400px)
- Position: corners of screen
- Slow pulse animation
- Colors match theme accent

### Spectrum Visualizer

- 16 bars
- Height tied to audio RMS
- Gradient coloring
- Updates at 16 FPS

---

## Settings Modal

Tabbed interface:

| Tab | Contents |
|-----|----------|
| 🎨 Theme | 7 theme preview cards |
| 🌍 Language | 8 language options |
| 🔊 Audio | Sound effects, music |
| 🔔 Alerts | Browser, push notifications |
| 🛠️ Advanced | Debug, raw scores |

---

## Accessibility Compliance

| Requirement | Implementation | WCAG Level |
|-------------|----------------|------------|
| Color Contrast | 7:1 text/background | AAA |
| Focus Indicators | 3px accent outline | AA |
| Touch Targets | 44x44px minimum | AAA |
| Keyboard Nav | Full support (S/X/T/D/F) | AA |
| Screen Reader | ARIA labels | AA |
| Reduced Motion | Respects preference | AAA |

---

## Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Mobile (<768px) | Single column, hamburger menu |
| Tablet (768-1024px) | Two columns |
| Desktop (>1024px) | Full grid layout |

---

## Internationalization (i18n)

8 languages with full UI translation:

- English, Hindi, Bengali, Marathi
- Kannada, Tamil, Gujarati, Assamese

All text elements use `data-i18n` attributes for dynamic translation.

---

<p align="center">
  <sub>Design spec created with Kiro IDE</sub>
</p>
