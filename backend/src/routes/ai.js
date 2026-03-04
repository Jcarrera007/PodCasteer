import { Router } from 'express';
import { analyzeAudioForCameraSwitch } from '../ai/cameraDirector.js';
import { obs, isConnected } from '../obs.js';

const router = Router();

router.post('/analyze', async (req, res) => {
  const { audioLevels, currentScene, autoSwitch = false } = req.body;

  if (!audioLevels || !Array.isArray(audioLevels)) {
    return res.status(400).json({ error: 'audioLevels array is required' });
  }

  try {
    const decision = await analyzeAudioForCameraSwitch(audioLevels, currentScene);

    if (
      autoSwitch &&
      isConnected &&
      decision.switchTo &&
      decision.switchTo !== currentScene
    ) {
      await obs.call('SetCurrentProgramScene', { sceneName: decision.switchTo });
      console.log(`[AI] Auto-switched to scene: "${decision.switchTo}" (${decision.reason})`);
    }

    res.json(decision);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
