import { Router } from 'express';
import { obs, connectOBS, disconnectOBS, isConnected } from '../obs.js';

const router = Router();

router.post('/connect', async (req, res) => {
  const { host = 'localhost', port = 4455, password = '' } = req.body;
  try {
    await connectOBS(host, String(port), password);
    res.json({ success: true, message: `Connected to OBS at ${host}:${port}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    await disconnectOBS();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/status', (req, res) => {
  res.json({ connected: isConnected });
});

router.get('/scenes', async (req, res) => {
  try {
    const { scenes, currentProgramSceneName } = await obs.call('GetSceneList');
    res.json({ scenes, currentScene: currentProgramSceneName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/scenes/current', async (req, res) => {
  const { sceneName } = req.body;
  try {
    await obs.call('SetCurrentProgramScene', { sceneName });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sources', async (req, res) => {
  try {
    const { inputs } = await obs.call('GetInputList');
    res.json({ sources: inputs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/scene-items/:sceneName', async (req, res) => {
  try {
    const { sceneItems } = await obs.call('GetSceneItemList', {
      sceneName: req.params.sceneName,
    });
    res.json({ sceneItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sources/visibility', async (req, res) => {
  const { sceneName, sceneItemId, enabled } = req.body;
  try {
    await obs.call('SetSceneItemEnabled', {
      sceneName,
      sceneItemId,
      sceneItemEnabled: enabled,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stream/start', async (req, res) => {
  try {
    await obs.call('StartStream');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stream/stop', async (req, res) => {
  try {
    await obs.call('StopStream');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/record/start', async (req, res) => {
  try {
    await obs.call('StartRecord');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/record/stop', async (req, res) => {
  try {
    await obs.call('StopRecord');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
