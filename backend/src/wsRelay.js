let wss = null;

export function initWsRelay(wsServer) {
  wss = wsServer;
  wss.on('connection', (ws) => {
    console.log('[WS] Browser client connected');
    ws.on('close', () => console.log('[WS] Browser client disconnected'));
  });
}

export function broadcastToClients(message) {
  if (!wss) return;
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}
