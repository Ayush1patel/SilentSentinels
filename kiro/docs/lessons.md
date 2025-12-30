# 📚 Lessons Learned

<p align="center">
  <strong>Actionable Insights for Future Projects</strong>
</p>

---

## 🎯 The Big Three

### 1. Specs > Code

```
Time spent on specs:    2 hours
Time saved from specs:  6+ hours
ROI: 300%
```

**Lesson:** Every hour of planning saves three hours of refactoring.

### 2. AI is a Partner, Not a Tool

❌ "Write a function that does X"  
✅ "Here's my problem, constraints, and what I've tried"

**Lesson:** Share context, get architecture. Give orders, get code.

### 3. Accessibility = Better Design

We built for deaf users. We got:
- Clearer visual hierarchy
- Better keyboard navigation
- More intuitive color coding
- Universal design language

**Lesson:** Constraints breed creativity.

---

## ⚡ Quick Wins

| Pattern | Use Case |
|---------|----------|
| Circular buffers | Continuous data processing |
| Session IDs | Stale response prevention |
| Debounced triggers | API cost reduction |
| Modular files | Parallel development |

---

## ⚠️ Anti-Patterns Avoided

| Anti-Pattern | What We Did Instead |
|--------------|---------------------|
| God file (755 lines) | 4 focused modules |
| Alert spam | 10-second cooldown |
| Single model reliance | Dual-model validation |
| Manual docs | Kiro hooks automation |

---

## 📐 Architecture Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Browser-based ML | No server dependency | Offline capability |
| Claude verification | False positive reduction | 95% better UX |
| Theme system | User ownership | Higher engagement |
| i18n from Day 1 | Hard to add later | 500M+ reach |

---

## 🔬 Metrics That Mattered

| Metric | Why | Target |
|--------|-----|--------|
| **Detection latency** | Lives at stake | <500ms |
| **False positive rate** | User trust | <10% |
| **Memory stability** | Long sessions | <200MB |
| **Accessibility score** | Core mission | WCAG AA |

---

## 📖 Further Reading

- [Journey](../JOURNEY.md) — Full development story
- [Behind Scenes](./behind-scenes.md) — War stories
- [Impact Metrics](../IMPACT_METRICS.md) — Stats dashboard

---

<p align="center">
  <sub>Lessons documented for future projects</sub>
</p>
