import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../services/apiClient';

function resolveWsUrl() {
  const api = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
  try {
    const u = new URL(api);
    return `${u.protocol}//${u.host}/ws`;
  } catch {
    return 'http://localhost:8080/ws';
  }
}

export function useAppointmentRealtime({ enabled = true, onEvent } = {}) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  // eslint-disable-next-line react-hooks/refs
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return undefined;
    const token = apiClient.getAccessToken();
    if (!token) return undefined;

    let cancelled = false;
    let client = null;

    (async () => {
      try {
        const [{ Client }, { default: SockJS }] = await Promise.all([
          import('@stomp/stompjs'),
          import('sockjs-client'),
        ]);
        if (cancelled) return;

        const wsUrl = resolveWsUrl();
        client = new Client({
          webSocketFactory: () => new SockJS(wsUrl),
          connectHeaders: {
            Authorization: `Bearer ${token}`,
            token,
          },
          reconnectDelay: 3000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          debug: () => {},
          onConnect: () => {
            if (cancelled) return;
            setConnected(true);
            const handler = (frame) => {
              try {
                const body = JSON.parse(frame.body);
                onEventRef.current?.(body);
              } catch (e) {
                console.warn('[Realtime] parse event failed', e);
              }
            };
            client.subscribe('/user/queue/appointments', handler);
            client.subscribe('/topic/appointments', handler);
            console.info('[Realtime] appointment socket connected', wsUrl);
          },
          onDisconnect: () => setConnected(false),
          onStompError: () => setConnected(false),
          onWebSocketClose: () => setConnected(false),
        });
        client.activate();
      } catch (err) {
        console.warn('[Realtime] WebSocket init failed:', err);
      }
    })();

    return () => {
      cancelled = true;
      try {
        client?.deactivate?.();
      } catch {
        /* ignore */
      }
      setConnected(false);
    };
  }, [enabled]);

  return { connected };
}