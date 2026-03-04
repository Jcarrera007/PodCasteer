import { useState, useEffect } from 'react';
import { useObsStore } from '../store/obsStore';
import { useOBS } from '../hooks/useOBS';

export default function SourceControl() {
  const { scenes, currentScene, connectionStatus } = useObsStore();
  const { fetchSceneItems, toggleSourceVisibility } = useOBS();
  const [sceneItems, setSceneItems] = useState([]);
  const [selectedScene, setSelectedScene] = useState('');
  const [loading, setLoading] = useState(false);

  const connected = connectionStatus === 'connected';

  useEffect(() => {
    if (currentScene && connected) {
      setSelectedScene(currentScene);
      loadItems(currentScene);
    }
  }, [currentScene, connected]);

  const loadItems = async (sceneName) => {
    if (!sceneName) return;
    setLoading(true);
    try {
      const items = await fetchSceneItems(sceneName);
      setSceneItems(items || []);
    } catch {
      setSceneItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSceneChange = (e) => {
    setSelectedScene(e.target.value);
    loadItems(e.target.value);
  };

  const handleToggle = async (item) => {
    await toggleSourceVisibility(selectedScene, item.sceneItemId, !item.sceneItemEnabled);
    setSceneItems((prev) =>
      prev.map((i) =>
        i.sceneItemId === item.sceneItemId
          ? { ...i, sceneItemEnabled: !i.sceneItemEnabled }
          : i
      )
    );
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Sources</h2>
        <select
          value={selectedScene}
          onChange={handleSceneChange}
          disabled={!connected}
          className="scene-select"
        >
          <option value="">Select scene</option>
          {scenes.map((s) => (
            <option key={s.sceneName} value={s.sceneName}>
              {s.sceneName}
            </option>
          ))}
        </select>
      </div>

      {!connected && <p className="muted">Connect to OBS to see sources.</p>}

      {connected && loading && <p className="muted">Loading...</p>}

      <div className="source-list">
        {sceneItems.map((item) => (
          <div key={item.sceneItemId} className="source-item">
            <span className={`source-name ${item.sceneItemEnabled ? '' : 'disabled'}`}>
              {item.sourceName}
            </span>
            <button
              className={`btn btn-sm ${item.sceneItemEnabled ? 'btn-warning' : 'btn-success'}`}
              onClick={() => handleToggle(item)}
            >
              {item.sceneItemEnabled ? 'Hide' : 'Show'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
