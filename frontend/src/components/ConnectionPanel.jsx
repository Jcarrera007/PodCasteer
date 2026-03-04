import { useState } from 'react';
import { useObsStore } from '../store/obsStore';
import { useOBS } from '../hooks/useOBS';

export default function ConnectionPanel() {
  const { obsConfig, setObsConfig, connectionStatus, connectionError } = useObsStore();
  const { connect, disconnect, fetchSources } = useOBS();
  const [loading, setLoading] = useState(false);

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  const handleConnect = async () => {
    setLoading(true);
    await connect(obsConfig);
    await fetchSources().catch(() => {});
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    await disconnect();
    setLoading(false);
  };

  const statusColor = {
    connected: '#22c55e',
    connecting: '#eab308',
    error: '#ef4444',
    disconnected: '#6b7280',
  }[connectionStatus];

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>OBS Connection</h2>
        <span className="status-dot" style={{ background: statusColor }} title={connectionStatus} />
      </div>

      <div className="form-group">
        <label>Host</label>
        <input
          type="text"
          value={obsConfig.host}
          onChange={(e) => setObsConfig({ ...obsConfig, host: e.target.value })}
          disabled={isConnected || isConnecting}
          placeholder="localhost"
        />
      </div>

      <div className="form-group">
        <label>Port</label>
        <input
          type="number"
          value={obsConfig.port}
          onChange={(e) => setObsConfig({ ...obsConfig, port: e.target.value })}
          disabled={isConnected || isConnecting}
          placeholder="4455"
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          value={obsConfig.password}
          onChange={(e) => setObsConfig({ ...obsConfig, password: e.target.value })}
          disabled={isConnected || isConnecting}
          placeholder="(leave blank if none)"
        />
      </div>

      {connectionError && (
        <p className="error-text">{connectionError}</p>
      )}

      <div className="status-text">
        Status: <strong style={{ color: statusColor }}>{connectionStatus}</strong>
      </div>

      {isConnected ? (
        <button className="btn btn-danger" onClick={handleDisconnect} disabled={loading}>
          Disconnect
        </button>
      ) : (
        <button
          className="btn btn-primary"
          onClick={handleConnect}
          disabled={loading || isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      )}
    </div>
  );
}
