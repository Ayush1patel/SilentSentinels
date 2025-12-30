# 📚 Lessons Learned

> Actionable insights from building Silent Sentinel with Kiro

---

## Development Insights

### 1. Start with Specs, Not Code

| Without Specs | With Kiro Specs |
|---------------|-----------------|
| Build → Realize problem → Refactor | Design → Validate → Build once |
| Features drift from requirements | Features match user stories |
| Integration surprises | Planned interfaces |

**Takeaway:** 30 minutes of planning saves 3 hours of refactoring.

### 2. Treat AI as a Thinking Partner

Kiro isn't a code generator—it's a collaborator.

**Effective Approach:**
- Describe the problem, not the solution
- Share context and constraints
- Ask "what am I missing?"

**Less Effective:**
- "Write a function that does X"
- "Fix this error"

### 3. Modular Architecture Enables Velocity

```
Before: 1 file, 755 lines
After:  4 files, clear responsibilities
```

| Module | Lines | Purpose |
|--------|-------|---------|
| detection.js | 400 | Audio processing |
| ui.js | 250 | Interface control |
| api.js | 100 | Claude communication |
| app.js | 50 | Bootstrap |

Each module can be understood, tested, and modified independently.

---

## Technical Lessons

### Audio Processing

- Web Audio API is powerful but has quirks
- Circular buffers are essential for continuous processing
- Resampling quality matters for ML models

### ML in the Browser

- TensorFlow.js WebGL backend is fastest
- Model loading is async—show progress
- Memory management is critical for long sessions

### Claude Integration

- Keep prompts structured (JSON output)
- Include context but not too much
- Handle rate limits gracefully

---

## What We'd Do Differently

1. **Set up testing earlier.** Manual testing slowed iteration.
2. **Design the API contract first.** Would have prevented integration issues.
3. **Profile memory usage sooner.** Caught a leak late in development.

---

## Metrics That Mattered

| Metric | Why It Mattered |
|--------|------------------|
| Detection accuracy | Core product value |
| False positive rate | User trust |
| Alert latency | Life-saving potential |
| Memory stability | Long-session reliability |

---

<p align="center">
  <sub>Lessons documented for future projects</sub>
</p>
