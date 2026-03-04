import { useObsStore } from '../store/obsStore';
import { useOBS } from '../hooks/useOBS';

export default function StreamControl() {
  const { isStreaming, isRecording, connectionStatus } = useObsStore();
  const { startStream, stopStream, startRecord, stopRecord } = useOBS();
  const connected = connectionStatus === 'connected';

  return (
    <div className="panel">
      <h2>Stream & Record</h2>

      <div className="control-row">
        <div className="status-indicator">
          <span
            className="status-dot"
            style={{ background: isStreaming ? '#ef4444' : '#6b7280' }}
          />
          <span>{isStreaming ? 'LIVE' : 'Offline'}</span>
        </div>
        <button
          className={`btn ${isStreaming ? 'btn-danger' : 'btn-success'}`}
          onClick={isStreaming ? stopStream : startStream}
          disabled={!connected}
        >
          {isStreaming ? 'Stop Stream' : 'Start Stream'}
        </button>
      </div>

      <div className="control-row">
        <div className="status-indicator">
          <span
            className="status-dot"
            style={{ background: isRecording ? '#ef4444' : '#6b7280' }}
          />
          <span>{isRecording ? 'REC' : 'Not Recording'}</span>
        </div>
        <button
          className={`btn ${isRecording ? 'btn-danger' : 'btn-warning'}`}
          onClick={isRecording ? stopRecord : startRecord}
          disabled={!connected}
        >
          {isRecording ? 'Stop Record' : 'Start Record'}
        </button>
      </div>
    </div>
  );
}
