# 🎬 Behind the Scenes

<p align="center">
  <strong>Development Insights & War Stories</strong>
</p>

---

## 🔥 The War Stories

### The Stale Alert Bug

**Day 3, 11 PM:** Users kept getting alerts for sounds detected 30 seconds ago.

```
Debug log:
- Sound: Gunshot → Claude triggered → Response arrives → Alert shows
- But wait... the alert was for a PREVIOUS sound! 😱
```

**The Fix (3 lines):**
```javascript
const sessionId = `${Date.now()}-${Math.random()}`;
// Later in response handler...
if (response.sessionId !== currentSession) return; // Ignore stale!
```

---

### The CarDoor-Shot Problem

**Day 3, 2 AM:** Every car door slam in YouTube gunshot test videos was triggering alerts.

**Root cause:** YAMNet's "Door" classification was too close to "Gunshot" in the embedding space.

**Solution:** The three-path trigger system:
1. Single high-confidence isn't enough
2. Need pattern confirmation OR
3. Sustained consecutive detection

---

### The Memory Leak Hunt

**Day 4:** After 2 hours of continuous monitoring, memory usage: 800MB+ 💀

**Found it:** Audio buffer was growing instead of sliding.

```diff
- audioHistory.push(...newSamples);  // Grows forever!
+ // Circular buffer - fixed size
+ for (let i = 0; i < newSamples.length; i++) {
+   buffer[writeIndex] = newSamples[i];
+   writeIndex = (writeIndex + 1) % buffer.length;
+ }
```

---

## 💡 "Aha!" Moments

| Moment | Insight |
|--------|---------|
| Accessibility-first | Building for deaf users made UX better for everyone |
| Dual-model approach | Complementary detection catches what single model misses |
| Pattern > Confidence | 3 medium alerts > 1 high-confidence alert |
| Premium design | Users trust beautiful interfaces more |

---

## 🛠️ What We'd Do Differently

1. **Set up testing on Day 1** — Manual testing slowed iteration
2. **Profile memory early** — Caught the leak late in dev
3. **Design Claude prompts first** — API contract before code

---

## 📊 Quick Stats

```
Total Development Time: 120 hours (5 days × 4 devs × 6 hours)
Bugs Fixed: 47
Coffee Consumed: Immeasurable ☕
Lines of Code: 4,000+
Refactoring Sessions: 0 (thanks, Kiro specs!)
```

---

<p align="center">
  <sub>Built with lots of debugging and Kiro IDE</sub>
</p>
