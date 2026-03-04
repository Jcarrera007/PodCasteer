import axios from 'axios';
import { useObsStore } from '../store/obsStore';

const api = axios.create({ baseURL: '/api' });

export function useOBS() {
  const store = useObsStore();

  const connect = async (config) => {
    store.setConnectionStatus('connecting');
    store.setConnectionError(null);
    try {
      await api.post('/obs/connect', config);
      const data = await fetchScenes();
      return data;
    } catch (err) {
      store.setConnectionStatus('error');
      store.setConnectionError(err.response?.data?.error || err.message);
    }
  };

  const disconnect = async () => {
    try {
      await api.post('/obs/disconnect');
      store.setConnectionStatus('disconnected');
      store.setScenes([]);
      store.setCurrentScene(null);
    } catch (err) {
      console.error('[OBS] Disconnect error:', err.message);
    }
  };

  const fetchScenes = async () => {
    const res = await api.get('/obs/scenes');
    store.setScenes(res.data.scenes);
    store.setCurrentScene(res.data.currentScene);
    return res.data;
  };

  const switchScene = async (sceneName) => {
    await api.post('/obs/scenes/current', { sceneName });
    store.setCurrentScene(sceneName);
  };

  const fetchSources = async () => {
    const res = await api.get('/obs/sources');
    store.setSources(res.data.sources);
    return res.data.sources;
  };

  const fetchSceneItems = async (sceneName) => {
    const res = await api.get(`/obs/scene-items/${encodeURIComponent(sceneName)}`);
    return res.data.sceneItems;
  };

  const toggleSourceVisibility = async (sceneName, sceneItemId, enabled) => {
    await api.post('/obs/sources/visibility', { sceneName, sceneItemId, enabled });
  };

  const startStream = async () => {
    await api.post('/obs/stream/start');
    store.setIsStreaming(true);
  };

  const stopStream = async () => {
    await api.post('/obs/stream/stop');
    store.setIsStreaming(false);
  };

  const startRecord = async () => {
    await api.post('/obs/record/start');
    store.setIsRecording(true);
  };

  const stopRecord = async () => {
    await api.post('/obs/record/stop');
    store.setIsRecording(false);
  };

  const analyzeAudio = async (obsAudioLevels, currentScene) => {
    const { aiAutoSwitch, micAssignments } = store;

    const levelsWithScenes = Object.entries(obsAudioLevels).map(([inputName, level]) => ({
      source: inputName,
      level,
      assignedScene: micAssignments[inputName] || null,
    }));

    const res = await api.post('/ai/analyze', {
      audioLevels: levelsWithScenes,
      currentScene,
      autoSwitch: aiAutoSwitch,
    });

    store.addClaudeDecision(res.data);
    return res.data;
  };

  return {
    connect,
    disconnect,
    fetchScenes,
    switchScene,
    fetchSources,
    fetchSceneItems,
    toggleSourceVisibility,
    startStream,
    stopStream,
    startRecord,
    stopRecord,
    analyzeAudio,
  };
}
