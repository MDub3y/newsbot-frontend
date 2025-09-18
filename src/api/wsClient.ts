import type { WSInbound, WSOutbound } from '../types';

export function createWS(
  url: string,
  onMessage: (msg: WSInbound) => void,
  onOpen?: () => void,
  onClose?: () => void
) {
  let ws: WebSocket | null = null;
  let closed = false;

  const connect = () => {
    ws = new WebSocket(url);

    ws.onopen = () => { onOpen?.(); };

    ws.onmessage = (ev) => {
      try { onMessage(JSON.parse(ev.data) as WSInbound); } catch { /* ignore */ }
    };

    ws.onclose = () => {
      onClose?.();
      if (!closed) setTimeout(connect, 800); // simple reconnect
    };
  };

  connect();

  const send = (payload: WSOutbound) => {
    const data = JSON.stringify(payload);
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(data);
    else setTimeout(() => ws?.send(data), 500);
  };

  const dispose = () => { closed = true; ws?.close(); };

  return { send, dispose };
}
