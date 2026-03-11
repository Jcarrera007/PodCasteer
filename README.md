# PodCasteer 4.0

A real-time OBS remote control dashboard with an AI camera director that automatically switches podcast camera scenes based on who is speaking.

---

## What It Does

PodCasteer connects to your OBS Studio instance over its built-in WebSocket server and gives you a browser-based control panel. On top of basic remote control (scenes, stream, record, sources, audio), it layers an AI system that watches microphone audio levels and decides which camera to cut to — automatically, in real time.

**Two switching modes:**

- **Audio Level mode** — purely mechanical. Reads OBS audio meter data 2x per second. Whoever is loudest above your sensitivity threshold gets the cut. If two or more mics are loud at the same time, it switches to your designated wide-angle / Camera 3 scene.
- **Claude AI mode** — sends the current audio levels and conversation history to Claude (claude-haiku) every 15 seconds. Claude acts as a camera director and decides when to switch, why, and with what confidence. It avoids flip-flopping, holds on silence, and learns from recent decisions via a sliding conversation window.

---

## Architecture

```
PodCasteer-4.0/
├── backend/                    Node.js + Express API server
│   └── src/
│       ├── index.js            HTTP server + WebSocket server (port 3001)
│       ├── obs.js              OBS WebSocket singleton — connects, relays events
│       ├── wsRelay.js          Broadcasts OBS events to all browser clients
│       └── routes/
│           ├── obs.js          REST API: /api/obs/*
│           └── ai.js           REST API: POST /api/ai/analyze
│       └── ai/
│           └── cameraDirector.js   Claude AI with sliding conversation history
│
└── frontend/                   React app (Vite, port 5173)
    └── src/
        ├── App.jsx             Root layout — 3-column grid
        ├── store/obsStore.js   Zustand global state + OBS event dispatcher
        ├── hooks/
        │   ├── useOBS.js       Axios wrappers for all REST calls
        │   └── useWebSocket.js WebSocket client — auto-reconnects every 3s
        └── components/
            ├── ConnectionPanel.jsx   OBS host/port/password + connect
            ├── SceneControl.jsx      Scene list + live switching
            ├── StreamControl.jsx     Go Live / Record buttons
            ├── SourceControl.jsx     Source visibility + audio mute toggles
            ├── SoundBoard.jsx        One-click media source triggers
            └── AICameraPanel.jsx     Mic→camera assignments + AI controls
```

---

## How the Data Flows

```
OBS Studio
    │  WebSocket (port 4455)
    ▼
backend/obs.js  ──────────────────────────────────────────────────┐
    │  Receives every OBS event (scenes, stream state,            │
    │  InputVolumeMeters, mute changes, etc.)                      │
    ▼                                                             │
wsRelay.js  ──► Browser WebSocket clients (port 3001/ws)          │
                    │                                             │
                    ▼                                             │
            obsStore.handleObsEvent()                             │
                    │                                             │
                    ├── Updates audio levels (dBFS per mic)       │
                    ├── Updates mute states                       │
                    ├── Updates current scene                     │
                    └── Updates stream/record status              │
                                                                  │
AICameraPanel (500ms or 15s interval)                             │
    │  Reads levels from store                                     │
    ├── Audio mode: picks loudest mic → switches scene ───────────┘
    └── Claude mode: POST /api/ai/analyze
                         │
                    backend/routes/ai.js
                         │
                    cameraDirector.js
                         │  Calls Claude API
                         ▼
                    { switchTo, reason, confidence }
                         │
                    If autoSwitch=true → SetCurrentProgramScene
                    Response logged in browser decision log
```

---

## OBS Audio Meters

OBS streams real-time audio meter data via its `InputVolumeMeters` WebSocket event. This event is **high-volume and opt-in** — you must explicitly request it when connecting:

```js
obs.connect(url, password, { eventSubscriptions: 2047 | 65536 })
// 2047 = all standard events
// 65536 = InputVolumeMeters (high-frequency, must be explicitly enabled)
```

The raw data arrives as a multiplier (`0.0 – 1.0`) per audio channel. The backend converts it to dBFS:

```
dBFS = 20 × log10(magnitude)
```

This is the same scale OBS uses in its mixer. Silence is around −60 dBFS. Comfortable speech is around −20 to −10 dBFS.

> **Important:** OBS only sends meter data for sources that are actively processing audio. For a mic to always appear in the AI panel regardless of which scene is active, add it as a **Global Audio Source** in OBS → Settings → Audio → Mic/Auxiliary Audio 1–4.

---

## Claude AI Director

The AI director uses a **sliding conversation history window** (last 5 exchanges) so Claude has temporal context — it remembers what it decided a moment ago and avoids rapid flip-flopping between cameras.

Each call sends:
```json
{
  "timestamp": "...",
  "currentScene": "Camera 1",
  "audioLevels": [
    { "source": "mic1", "level": -18.4, "assignedScene": "Camera 1" },
    { "source": "mic2", "level": -52.1, "assignedScene": "Camera 2" }
  ],
  "recentSwitches": ["Camera 1", "Camera 2"]
}
```

Claude returns:
```json
{
  "switchTo": "Camera 1",
  "reason": "mic1 has been consistently loud for 3 seconds. mic2 is silent.",
  "confidence": 0.91
}
```

If `autoSwitch` is enabled, the backend calls `SetCurrentProgramScene` directly. The decision is also sent to the browser and logged in the Decision Log panel.

**Rate limiting:** The free Anthropic tier allows ~5 requests/minute. The Claude mode interval is set to 15 seconds (4 req/min) to stay safely within limits.

---

## Multi-Speaker / Camera 3

When **two or more microphones** are simultaneously above the speaking threshold in Audio Level mode, PodCasteer automatically cuts to a designated **wide-angle scene** (Camera 3). Assign this in the AI Camera Director panel under "Multi-speaker (Camera 3)".

---

## Setup

### Prerequisites
- Node.js 18+
- OBS Studio 28+ (WebSocket 5.x is built in)
- Enable WebSocket in OBS: **Tools → obs-websocket Settings → Enable WebSocket Server**

### Install & Run

```bash
# 1. Clone the repo
git clone <repo-url>
cd PodCasteer-4.0

# 2. Add your Anthropic API key
cp backend/.env.example backend/.env
# Edit backend/.env and set ANTHROPIC_API_KEY=sk-ant-...

# 3. Install all dependencies (frontend + backend)
npm install

# 4. Start both servers
npm run dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

Open **http://localhost:5173** in your browser.

### WSL2 Users

If running the backend inside WSL2 while OBS runs on Windows, `localhost` will not reach OBS. Find your Windows host IP:

```bash
ip route | grep default
# e.g. default via 172.23.48.1 dev eth0
```

Use that IP (e.g. `172.23.48.1`) as the host in the Connection Panel instead of `localhost`.

---

## Environment Variables

`backend/.env`:
```
PORT=3001
ANTHROPIC_API_KEY=sk-ant-...
```

OBS credentials (host, port, password) are entered in the UI at runtime and never persisted to disk.

---

## Features at a Glance

| Feature | How it works |
|---|---|
| Scene switching | REST → OBS WebSocket `SetCurrentProgramScene` |
| Live audio meters | OBS `InputVolumeMeters` event → WebSocket relay → browser |
| Mute/unmute | `SetInputMute` / `ToggleInputMute` via REST |
| Soundboard | `TriggerMediaInputAction` restarts any media source |
| Stream & record | `StartStream` / `StopStream` / `StartRecord` / `StopRecord` |
| AI audio mode | Browser interval reads dBFS, switches to loudest assigned mic |
| AI Claude mode | Backend calls Claude API, decision logged with confidence score |
| Camera 3 / wide angle | Activates when 2+ mics are simultaneously above threshold |
| Real-time sync | All OBS state changes pushed to browser via WebSocket relay |
