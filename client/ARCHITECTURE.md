# Silent Sentinel - Modular Architecture

## File Structure

```
client/
├── index.html           # Main HTML file
├── styles.css           # Styles (unchanged)
├── app.js              # Main entry point (glue code)
├── js/
│   ├── ui.js           # Frontend - UI layer
│   ├── detection.js    # Backend - Detection logic
│   └── api.js          # Backend - API communication
└── tfjs_model/         # Custom gunshot model
```

---

## Module Overview

### 1. `app.js` - Main Entry Point
**Purpose:** Minimal glue code that connects UI, Detection, and API modules

**What it does:**
- Imports all modules
- Connects UI button events to detection logic
- Handles detection callbacks and updates UI
- Manages application flow

**Size:** ~150 lines (down from 755!)

---

### 2. `js/ui.js` - Frontend UI Layer
**Purpose:** All DOM manipulation and UI updates

**Your teammate can modify this file to:**
- Change button labels and styling
- Modify alert messages
- Update detection log format
- Add new UI elements
- Change colors and animations

**Key exports:**
- `UI.elements` - All DOM element references
- `UI.updateStatus()` - Update status text
- `UI.updateSound()` - Update detected sound
- `UI.addToLog()` - Add to detection log
- `UI.showAlert()` / `UI.hideAlert()` - Alert management
- `UI.onStartClick()` - Register button callbacks

**Size:** ~260 lines

---

### 3. `js/detection.js` - Backend Detection Logic
**Purpose:** Audio processing, YAMNet, custom model, trigger logic

**Contains:**
- YAMNet model loading and inference
- Custom gunshot model loading and inference
- Audio processing (AudioContext, ScriptProcessor)
- Sound classification
- History tracking
- Pattern detection
- Trigger logic (confidence thresholds, sustained detection)
- Session management

**Key exports:**
- `Detection.init()` - Initialize models
- `Detection.start()` - Start monitoring
- `Detection.stop()` - Stop monitoring
- `Detection.onDetection()` - Register detection callback
- `Detection.onTrigger()` - Register trigger callback

**Size:** ~420 lines

---

### 4. `js/api.js` - Backend API Communication
**Purpose:** Claude API communication

**Contains:**
- API request handling
- Rate limiting
- Error handling
- Session validation

**Key exports:**
- `API.sendToServer()` - Send detection to Claude
- `API.isRateLimited()` - Check rate limit status

**Size:** ~70 lines

---

## Benefits of This Structure

### ✅ Separation of Concerns
- UI code completely isolated from detection logic
- Easy to modify UI without breaking detection
- Easy to test detection logic independently

### ✅ Parallel Development
- **Frontend developer** can work on `ui.js`
  - Modify styling, layout, animations
  - Add new UI features
  - Change button labels and messages
  
- **Backend developer** can work on `detection.js` and `api.js`
  - Adjust detection thresholds
  - Improve algorithms
  - Add new detection features

### ✅ Maintainability
- Each module has single responsibility
- Easier to debug (know which file to look at)
- Better code organization
- Smaller, more manageable files

### ✅ Reusability
- Detection logic can be reused in other projects
- UI components can be swapped out easily
- API module can be extended for other endpoints

---

## How to Work with This Structure

### For Frontend Developers (Your Teammate)

**Files to modify:** `js/ui.js`, `styles.css`, `index.html`

**Example: Change button label**
```javascript
// In ui.js, find setMonitoring() method
setMonitoring() {
  this.elements.startBtn.textContent = "🎧 Listening..."; // Change this
  // ...
}
```

**Example: Change alert styling**
```javascript
// In ui.js, find showAlert() method
showAlert(message) {
  this.elements.alertBox.style.background = "#your-color";
  // ...
}
```

### For Backend Developers

**Files to modify:** `js/detection.js`, `js/api.js`

**Example: Adjust confidence threshold**
```javascript
// In detection.js, find constants at top
const MEDIUM_CONFIDENCE = 0.60; // Change from 0.50 to 0.60
```

**Example: Change trigger cooldown**
```javascript
// In detection.js
const TRIGGER_COOLDOWN = 10000; // Change from 5000 to 10000 (10 seconds)
```

---

## Testing

All functionality remains identical to the previous version. Test:
1. Start/stop monitoring
2. Sound detection and logging
3. Claude API integration
4. Emergency controls
5. Pattern detection
6. Session tracking

---

## Migration Notes

**What changed:**
- Code split into 4 files instead of 1 monolithic file
- ES6 modules used for imports/exports
- Same functionality, better organization

**What stayed the same:**
- All detection logic
- All UI behavior
- All API communication
- All features and thresholds
