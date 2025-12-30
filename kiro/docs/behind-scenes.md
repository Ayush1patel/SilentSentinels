# 🎬 Behind the Scenes

> The development story of Silent Sentinel

---

## The Challenge

Building an AI-powered emergency detection system in a hackathon timeframe seemed impossible. We needed:

- Real-time audio processing in the browser
- Multi-model ML inference
- Intelligent alert triggering
- Premium, accessible UI
- Claude AI integration

**Without Kiro, this would have taken weeks. With Kiro, it took days.**

---

## The Kiro Advantage

### Spec-Driven Development

Instead of diving into code, we started with specifications:

1. **User Stories** defined what we were building and why
2. **Technical Design** mapped the architecture
3. **Task Breakdown** created actionable items

This approach eliminated backtracking. Every feature had a clear purpose before a single line of code was written.

### Context-Aware Assistance

Kiro didn't just generate code—it understood our project:

- Knew our file structure
- Understood our coding conventions
- Remembered previous decisions
- Connected related components

### Intelligent Iteration

Each conversation built on the last:

```
Session 1: "Design the audio pipeline"
Session 2: "Now add pattern detection"
Session 3: "Integrate Claude for verification"
Session 4: "Make the UI stunning"
```

Each step informed the next, creating a cohesive system.

---

## Key Development Moments

### The Dual-Model Breakthrough

**Problem:** YAMNet was accurate but sometimes missed gunshots. Custom model was specialized but narrow.

**Solution:** Run both models in parallel:
- YAMNet provides broad classification
- Custom model catches specialized threats
- Results are combined for decision-making

### The Session ID Fix

**Problem:** Claude responses were triggering alerts for sounds detected 30 seconds ago.

**Solution:** Timestamp-based session tracking:
```javascript
if (sessionId !== currentSession) {
  return; // Ignore stale response
}
```

Three lines of code, massive impact.

### The Pattern Detection System

**Problem:** Individual sounds could be false positives. Patterns indicate real threats.

**Solution:** 20-detection window analysis:
- Count critical sounds in recent history
- 3+ critical sounds = high confidence
- Trigger Claude for verification

---

## What We Learned

1. **Specs save time.** Planning upfront prevents refactoring later.
2. **Context is everything.** Kiro's understanding of our project accelerated development.
3. **Iteration beats perfection.** Ship, test, refine.
4. **Accessibility is a feature.** Building for deaf users made the product better for everyone.

---

<p align="center">
  <sub>Built with Kiro IDE at HackXios 2025</sub>
</p>
