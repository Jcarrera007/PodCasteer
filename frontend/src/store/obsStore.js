import { create } from 'zustand';

export const useObsStore = create((set, get) => ({
  // Connection
  connectionStatus: 'disconnected',
  connectionError: null,
  obsConfig: { host: 'localhost', port: '4455', password: '' },

  // OBS state
  scenes: [],
  currentScene: null,
  sources: [],
  isStreaming: false,
  isRecording: false,
  obsAudioLevels: {}, // { inputName: dBFS }

  // AI state
  aiEnabled: false,
  aiMode: 'audio',
  aiAutoSwitch: false,
  micAssignments: {},
  audioSensitivity: -30,
  claudeDecisionLog: [],

  // Actions
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setConnectionError: (error) => set({ connectionError: error }),
  setObsConfig: (config) => set({ obsConfig: config }),
  setScenes: (scenes) => set({ scenes }),
  setCurrentScene: (currentScene) => set({ currentScene }),
  setSources: (sources) => set({ sources }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setAiEnabled: (aiEnabled) => set({ aiEnabled }),
  setAiMode: (aiMode) => set({ aiMode }),
  setAiAutoSwitch: (aiAutoSwitch) => set({ aiAutoSwitch }),
  setAudioSensitivity: (audioSensitivity) => set({ audioSensitivity }),

  setMicAssignment: (deviceId, sceneName) =>
    set((state) => ({
      micAssignments: { ...state.micAssignments, [deviceId]: sceneName },
    })),

  removeMicAssignment: (deviceId) =>
    set((state) => {
      const updated = { ...state.micAssignments };
      delete updated[deviceId];
      return { micAssignments: updated };
    }),

  addClaudeDecision: (decision) =>
    set((state) => ({
      claudeDecisionLog: [
        { ...decision, timestamp: new Date().toISOString() },
        ...state.claudeDecisionLog,
      ].slice(0, 50),
    })),

  handleObsEvent: (event) => {
    const { type, data } = event;
    switch (type) {
      case 'ConnectionOpened':
        set({ connectionStatus: 'connected', connectionError: null });
        break;
      case 'ConnectionClosed':
        set({ connectionStatus: 'disconnected' });
        break;
      case 'ConnectionError':
        set({ connectionStatus: 'error', connectionError: event.error });
        break;
      case 'CurrentProgramSceneChanged':
        set({ currentScene: data.sceneName });
        break;
      case 'StreamStateChanged':
        set({ isStreaming: data.outputActive });
        break;
      case 'RecordStateChanged':
        set({ isRecording: data.outputActive });
        break;
      case 'SceneListChanged':
        set({ scenes: data.scenes });
        break;
      case 'InputVolumeMeters': {
        // data.inputs: [{ inputName, inputLevelsMul: [[magnitude, peak], ...] }]
        const obsAudioLevels = {};
        for (const input of data.inputs) {
          // Take max magnitude across all channels, convert multiplier to dBFS
          const magnitude = Math.max(...input.inputLevelsMul.map((ch) => ch[0] ?? 0));
          obsAudioLevels[input.inputName] = magnitude > 0 ? 20 * Math.log10(magnitude) : -100;
        }
        set({ obsAudioLevels });
        break;
      }
      default:
        break;
    }
  },
}));
