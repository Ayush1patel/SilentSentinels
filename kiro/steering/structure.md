# 📁 Project Structure

> Steering file defining file organization conventions

---

## Directory Layout

```
Silent-Sentinel/
├── client/                     # Frontend application
│   ├── index.html              # Main entry point
│   ├── styles.css              # All styling (900+ lines)
│   ├── app.js                  # Application bootstrap
│   └── js/                     # Modular JavaScript
│       ├── detection.js        # Audio detection engine
│       ├── ui.js               # UI controller
│       └── api.js              # Claude API client
│
├── server/                     # Backend services
│   ├── server.js               # Express server
│   └── mcp.js                  # Model Context Protocol
│
├── tfjs_model/                 # Custom ML model
│   ├── model.json              # Model architecture
│   └── group1-shard1of1.bin    # Model weights
│
├── kiro/                       # Kiro IDE documentation
│   ├── HERO/                   # Required submission folder
│   ├── hooks/                  # Automation configuration
│   ├── mcp/                    # MCP server documentation
│   ├── steering/               # Project guidance files
│   ├── specs/                  # Feature specifications
│   └── docs/                   # Additional documentation
│
└── README.md                   # Project entry point
```

---

## Module Responsibilities

### `detection.js`
- Audio capture and processing
- YAMNet model inference
- Custom model inference
- Pattern detection logic
- History management

### `ui.js`
- DOM manipulation
- Theme management
- Spectrum visualizer
- Alert displays
- Keyboard shortcuts

### `api.js`
- Claude AI communication
- Request/response handling
- Session management

### `server.js`
- Static file serving
- Claude API proxy
- CORS handling
- Rate limiting

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| JavaScript | camelCase.js | detection.js |
| CSS | kebab-case.css | styles.css |
| Markdown | UPPERCASE.md or kebab-case.md | README.md |
| Config | lowercase.ext | .env, .gitignore |

---

## Import Order

```javascript
// 1. External dependencies
import * as tf from '@tensorflow/tfjs';

// 2. Internal modules (alphabetical)
import { API } from './api.js';
import { Detection } from './detection.js';
import { UI } from './ui.js';

// 3. Constants
const CONFIG = { ... };
```

---

<p align="center">
  <sub>Structure enforced by Kiro conventions</sub>
</p>
