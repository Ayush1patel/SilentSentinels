# 🏗️ System Architecture

> Technical design generated through Kiro's spec-driven development

---

## High-Level Architecture

```mermaid
flowchart TB
    subgraph CLIENT["🖥️ Client Layer"]
        MIC[🎤 Microphone Input]
        WEB[Web Audio API]
        UI[Premium Dashboard]
    end
    
    subgraph DETECTION["🧠 Detection Layer"]
        YAMNET[YAMNet Model<br/>521 Categories]
        CUSTOM[Custom Gunshot Model<br/>98.6% Accuracy]
        BUFFER[Sliding Audio Buffer<br/>16,000 Samples]
    end
    
    subgraph INTELLIGENCE["🤖 Intelligence Layer"]
        TRIGGER[Smart Trigger Logic]
        CLAUDE[Claude AI Reasoning]
        PATTERN[Pattern Analyzer<br/>20-Detection Window]
    end
    
    subgraph ALERT["🚨 Alert Layer"]
        VISUAL[Visual Alerts]
        HAPTIC[Haptic Vibration]
        NOTIF[Push Notifications]
        SOUND[Audio Feedback]
    end
    
    MIC --> WEB
    WEB --> BUFFER
    BUFFER --> YAMNET
    BUFFER --> CUSTOM
    YAMNET --> TRIGGER
    CUSTOM --> TRIGGER
    TRIGGER --> PATTERN
    PATTERN --> CLAUDE
    CLAUDE --> VISUAL
    CLAUDE --> HAPTIC
    CLAUDE --> NOTIF
    CLAUDE --> SOUND
    UI --> VISUAL
```

---

## Detection Pipeline

### Audio Processing Flow

```mermaid
sequenceDiagram
    participant M as Microphone
    participant B as Audio Buffer
    participant Y as YAMNet
    participant C as Custom Model
    participant T as Trigger Logic
    participant AI as Claude AI
    participant U as User
    
    M->>B: Audio Stream (44.1kHz)
    B->>B: Resample to 16kHz
    B->>Y: 16,000 samples (1 second)
    B->>C: Same audio chunk
    
    Y->>T: Top 20 Classifications
    C->>T: Gunshot Probability
    
    alt High Confidence (≥80%)
        T->>AI: Request Verification
    else Pattern Detected (3+ Critical)
        T->>AI: Request Verification
    else Sustained Detection
        T->>AI: Request Verification
    end
    
    AI->>AI: Analyze Context
    AI->>U: Verdict (SAFE/MONITOR/EMERGENCY)
```

---

## Component Specifications

### Detection Module

| Component | Technology | Purpose |
|-----------|------------|---------|
| Audio Capture | Web Audio API | Real-time microphone access |
| Sample Buffer | Circular Buffer | Efficient 1-second audio window |
| Resampling | Linear Interpolation | 44.1kHz → 16kHz conversion |
| Primary Model | YAMNet (TensorFlow.js) | 521-category classification |
| Secondary Model | Custom CNN | Binary gunshot detection |

### Trigger Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE TRIGGER CONDITIONS                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Condition 1: High Confidence                               │
│  └─→ Any critical sound ≥ 80% confidence                   │
│                                                             │
│  Condition 2: Pattern Detection                             │
│  └─→ 3+ critical sounds in 20-detection window             │
│                                                             │
│  Condition 3: Sustained Detection                           │
│  └─→ Same critical sound for 3+ consecutive detections     │
│                                                             │
│  Cooldown: 10 seconds between triggers                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### AI Reasoning Layer

```mermaid
flowchart LR
    subgraph INPUT["Input Context"]
        H[Detection History]
        C[Current Detection]
        P[Pattern Analysis]
    end
    
    subgraph CLAUDE["Claude AI Processing"]
        A[Analyze Context]
        V[Generate Verdict]
        R[Create Recommendation]
    end
    
    subgraph OUTPUT["Output"]
        SAFE[🟢 SAFE]
        MONITOR[🟡 MONITOR]
        EMERGENCY[🔴 EMERGENCY]
    end
    
    H --> A
    C --> A
    P --> A
    A --> V
    V --> R
    R --> SAFE
    R --> MONITOR
    R --> EMERGENCY
```

---

## Data Flow

### Session Management

```
Session Start
    │
    ├── Generate Session ID (timestamp-based)
    │
    ├── Initialize Audio Context
    │
    ├── Load ML Models
    │   ├── YAMNet (from TFHub)
    │   └── Custom Gunshot Model (local)
    │
    └── Begin Detection Loop
        │
        └── Every 62.5ms (16 FPS)
            ├── Capture Audio Chunk
            ├── Run Detection
            ├── Update History
            ├── Check Triggers
            └── Update UI
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Vanilla JavaScript | ES2022 |
| Audio | Web Audio API | W3C Standard |
| ML Runtime | TensorFlow.js | 4.x |
| Primary Model | YAMNet | Google Hub |
| AI Reasoning | Claude 3.5 Sonnet | Latest |
| Backend | Node.js + Express | 20.x |
| Styling | CSS3 | Modern |

---

<p align="center">
  <sub>Architecture designed with Kiro IDE Specs</sub>
</p>
