import { useEffect, useRef } from 'react';
import { useObsStore } from '../store/obsStore';

const WS_URL = 'ws://localhost:3001/ws';
const RECONNECT_DELAY = 3000;

export function useWebSocket() {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const handleObsEvent = useObsStore((s) => s.handleObsEvent);

  function connect() {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => console.log('[WS] Connected to relay');

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          handleObsEvent(parsed);
        } catch (e) {
          console.warn('[WS] Parse error:', e);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected — reconnecting in 3s');
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    }
  }

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return wsRef;
}
