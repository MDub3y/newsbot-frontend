import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createWS } from '../api/wsClient';
import { askOnce, fetchHistory, resetSession } from '../api/session';
import type { ChatMessage, WSInbound } from '../types';

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);     // true right after user sends
  const [streaming, setStreaming] = useState(false); // true while chunks arrive
  const wsRef = useRef<ReturnType<typeof createWS> | null>(null);

  // --- safety timer (prevents a stuck loader if server never responds) ---
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startSafetyTimer = () => {
    clearSafetyTimer();
    safetyTimerRef.current = setTimeout(() => {
      setLoading(false);
      setStreaming(false);
    }, 15000);
  };
  const clearSafetyTimer = () => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  const wsUrl = import.meta.env.VITE_WS_URL as string;

  // Load history once (strip old placeholder if present)
  useEffect(() => {
    fetchHistory(sessionId)
      .then((h) => {
        const cleaned = (h || []).filter(
          (m) => !(m.role === 'assistant' && m.content?.trim() === '(streamed reply in UI)')
        );
        setMessages(cleaned);
      })
      .catch(() => setMessages([]));
  }, [sessionId]);

  // WebSocket attach
  useEffect(() => {
    try {
      const client = createWS(wsUrl, (msg: WSInbound) => {
        if (msg.type === 'init') {
          setConnected(true);
          return;
        }

        if (msg.type === 'assistant_chunk') {
          // stop "Analyzing..." ASAP; we got a chunk
          setLoading(false);
          setStreaming(true);
          clearSafetyTimer();

          setMessages((m) => {
            const last = m[m.length - 1];
            if (last?.role === 'assistant') {
              const copy = m.slice(0, -1);
              return [...copy, { role: 'assistant', content: last.content + msg.content }];
            }
            return [...m, { role: 'assistant', content: msg.content }];
          });
          return;
        }

        if (msg.type === 'assistant_done') {
          // belt & suspenders: ensure loader is off even if no chunks arrived
          setStreaming(false);
          setLoading(false);
          clearSafetyTimer();
          return;
        }

        if (msg.type === 'error') {
          setStreaming(false);
          setLoading(false);
          clearSafetyTimer();
          return;
        }
      });

      wsRef.current = client;
      return () => {
        client.dispose();
        clearSafetyTimer();
      };
    } catch {
      setConnected(false);
    }
  }, [wsUrl]); // <-- NOTE: no `loading` here to avoid stale closures

  const send = useCallback(
    async (content: string, topK = 5) => {
      if (!content.trim()) return;

      // show user message immediately
      setMessages((m) => [...m, { role: 'user', content }]);

      // show analyzing state until the first assistant chunk
      setLoading(true);
      setStreaming(false);
      startSafetyTimer();

      // try WS
      if (wsRef.current) {
        try {
          wsRef.current.send({
            type: 'user_message',
            sessionId,
            content,
            topK,
          });
          return; // loader will flip off on first chunk / done
        } catch {
          setConnected(false);
        }
      }

      // fallback to REST
      try {
        const { answer } = await askOnce(sessionId, content, topK);
        setMessages((m) => [...m, { role: 'assistant', content: answer }]);
      } finally {
        setLoading(false);
        setStreaming(false);
        clearSafetyTimer();
      }
    },
    [sessionId]
  );

  const reset = useCallback(async () => {
    await resetSession(sessionId);
    setMessages([]);
  }, [sessionId]);

  return useMemo(
    () => ({ messages, send, reset, loading, streaming, connected }),
    [messages, send, reset, loading, streaming, connected]
  );
}
