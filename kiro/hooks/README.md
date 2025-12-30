# 🪝 Kiro Hooks Configuration

> Automated workflows triggered by development events

---

## What Are Hooks?

Kiro Hooks are event-driven automation triggers that execute predefined actions when specific events occur. They automate repetitive tasks and maintain consistency.

---

## Active Hooks

### 📝 Documentation Update Hook

**Trigger:** `detection.js` saved  
**Action:** Update detection documentation

```yaml
# .kiro/hooks/on-save-detection.yaml
trigger: on-save
pattern: "**/detection.js"
action: |
  - Check for new threshold constants
  - Update CRITICAL_SOUNDS list in docs
  - Regenerate trigger logic documentation
  - Verify JSDoc comments are current
```

---

### 🔔 Alert Threshold Hook

**Trigger:** Any file in `server/mcp/` modified  
**Action:** Validate MCP tool consistency

```yaml
# .kiro/hooks/on-save-mcp.yaml
trigger: on-save
pattern: "**/mcp/*.js"
action: |
  - Verify tool exports match index.js
  - Check API endpoint documentation
  - Update mcp/README.md if new tools added
```

---

### 🌍 i18n Completion Hook

**Trigger:** `i18n.js` saved  
**Action:** Verify all languages have same keys

```yaml
# .kiro/hooks/on-save-i18n.yaml
trigger: on-save
pattern: "**/i18n.js"
action: |
  - Compare all language objects
  - Report missing translation keys
  - Suggest translations for new keys
```

---

### 🧪 Pre-Commit Hook

**Trigger:** Git commit initiated  
**Action:** Generate semantic commit message

```yaml
# .kiro/hooks/pre-commit.yaml
trigger: pre-commit
action: |
  - Analyze staged changes
  - Generate conventional commit message
  - Include scope (detection/ui/mcp/i18n)
  - Warn about breaking changes
```

**Example Output:**
```
feat(detection): add voice command detection integration

- Added VoiceCommand module with Web Speech API
- Recognizes "SS Help" and other emergency phrases
- Auto-restarts on recognition errors
```

---

## Hook Benefits

| Before Hooks | With Hooks |
|--------------|------------|
| Manual doc updates | Auto-sync documentation |
| Generic commits | Semantic commit messages |
| Missing translations found late | Immediately flagged |
| API changes not documented | Auto-updated |

---

## How to Use

Kiro hooks are defined in `.kiro/hooks/` directory. They run automatically when:

1. **on-save** — Any matching file is saved
2. **on-create** — New matching file created
3. **pre-commit** — Before git commit
4. **on-build** — Before production build

---

<p align="center">
  <sub>Hooks configured with Kiro IDE</sub>
</p>
