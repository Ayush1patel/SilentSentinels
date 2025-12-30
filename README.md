# 🛡️ Silent Sentinel: Intelligent Safety Monitoring

## Project Objective
Silent Sentinel is a **deployable, AI-powered safety system** designed for **deaf, hard-of-hearing, and elderly people**. It transforms everyday devices into an intelligent safety layer that converts critical environmental sounds into immediate, understandable, and actionable alerts.

### How it Works
1.  **Edge Detection**: Continuously listens using a local sound classification model (YAMNet) to respect privacy and ensure speed.
2.  **AI Reasoning**: Uses **Anthropic’s Claude** as a high-level reasoning engine to analyze detection context, urgency, and history.
3.  **Accessible Alerts**: Delivers strong visual and vibration alerts for emergencies like fire alarms, glass breaking, or thuds (falls).

---

## Server Setup (Backend)

The server handles the AI verification using the Anthropic API.

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  **Configure API Key**:
    - Open the `.env` file in the `server` directory.
    - Replace the placeholder value for `ANTHROPIC_API_KEY` with your actual API key.
    - Example `.env` content:
      ```env
      ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY-HERE...
      PORT=5001
      ```

4.  Start the server:
    ```bash
    node server.js
    ```
    You should see: `🚀 Server running on port 5001`

## Client Setup (Frontend)

The client runs the local sound detection.

1.  Navigate to the `client` directory.
2.  Because the client uses ES modules (`<script type="module">`), you cannot just double-click `index.html`. You need to serve it using a local web server.
    - **Option A (using Python):**
      ```bash
      # Run inside the client directory
      python -m http.server 8000
      ```
      Then open `http://localhost:8000` in your browser.
    
    - **Option B (using VS Code Live Server):**
      Right-click `index.html` and select "Open with Live Server".

## Note
Currently, the client detects sounds locally using YAMNet and a custom gunshot model. When emergencies are detected, it sends requests to the server's `/verify-sound` endpoint. The Claude AI then verifies the emergency and triggers appropriate MCP tools (WhatsApp alerts, logging, etc.).

# Team Codebase Contribution & Distribution

Here is the detailed breakdown of contributions and responsibilities for each team member:

## Sachin Nain
- **Backend**: Developed core server infrastructure, designed API endpoints, and set up environment configuration and training service orchestration.
  - *Highlights*: Implemented graceful shutdown mechanisms and contributed to overall architecture.
- **MCP (Model Context Protocol)**: Implemented the core MCP module, handling event logging and emergency protocol workflows.
  - *Highlights*: Designed state management for MCP, integrated escalation logic, and added comprehensive logging.

## Aryan Malik
- **Backend**: Optimized backend performance, performed code reviews, and improved API latency and stability.
  - *Highlights*: Added monitoring, logging enhancements, and collaborated on performance tuning.
- **YAMNet**: Developed the audio classification pipeline and integrated YAMNet logic.
  - *Highlights*: Refined audio preprocessing, tuned thresholds, and added custom event triggers.

## Naman Jindal
- **YAMNet**: Co‑authored detection algorithms, optimized model inference speed, and improved accuracy.
  - *Focus*: Fine‑tuning YAMNet parameters and adding post‑processing filters.
- **Documentation**: Authored and maintained project documentation, feature guides, and specifications.
  - *Highlights*: Structured documentation hierarchy and ensured up‑to‑date guides.

## Vraj Vashi
- **Frontend**: Designed UI components, implemented styling, and built client‑side application logic.
  - *Highlights*: Created responsive layout, added interactive elements, and integrated API calls.
- **Custom Model**: Trained and integrated the custom gunshot detection model.
  - *Highlights*: Collected training data, performed model conversion for web deployment, and added inference pipeline.

## Ayush Patel
- **MCP**: Contributed to MCP features, emergency response protocols, and alert mechanisms.
  - *Highlights*: Implemented logging of emergency events, integrated WhatsApp alerts, and added user safety status checks.
- **Custom Model**: Assisted in training data preparation and validation for the gunshot model.
  - *Focus*: Curated dataset, performed validation, and fine‑tuned model hyperparameters.

## Shive Bhat
- **Frontend**: Co‑developed UI/UX, added voice command features, contributed to architecture documentation, built interactive dashboards, and implemented multilingual support.
  - *Highlights*: Implemented voice command handling, refined UI interactions, created responsive dashboards for data visualization, integrated i18n library for multilingual UI, and documented overall architecture.
- **Documentation**: Helped structure project guides and maintain core documentation files.
  - *Highlights*: Updated setup instructions, changelog, and security considerations.
