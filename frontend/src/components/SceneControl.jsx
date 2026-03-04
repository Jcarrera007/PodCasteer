import { useObsStore } from '../store/obsStore';
import { useOBS } from '../hooks/useOBS';

export default function SceneControl() {
  const { scenes, currentScene, connectionStatus } = useObsStore();
  const { switchScene, fetchScenes } = useOBS();
  const connected = connectionStatus === 'connected';

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Scenes</h2>
        <button className="btn btn-sm" onClick={fetchScenes} disabled={!connected}>
          Refresh
        </button>
      </div>

      {currentScene && (
        <p className="current-scene">
          Active: <strong>{currentScene}</strong>
        </p>
      )}

      {scenes.length === 0 && connected && (
        <p className="muted">No scenes found. Click Refresh.</p>
      )}

      {!connected && <p className="muted">Connect to OBS to see scenes.</p>}

      <div className="scene-list">
        {scenes.map((scene) => (
          <button
            key={scene.sceneName}
            className={`scene-btn ${scene.sceneName === currentScene ? 'active' : ''}`}
            onClick={() => switchScene(scene.sceneName)}
            disabled={!connected}
          >
            {scene.sceneName}
          </button>
        ))}
      </div>
    </div>
  );
}
