import { apiClient } from './apiClient';

function resolveWsUrl() {
  const api = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
  try {
    const u = new URL(api);
    return `${u.protocol}//${u.host}/ws`;
  } catch {
    return 'http://localhost:8080/ws';
  }
}

/** @type {import('@stomp/stompjs').Client | null} */
let client = null;
let activating = null;
let connected = false;
const connectionListeners = new Set();
const subsByDest = new Map();
const activeStompSubs = new Map();
let subIdSeq = 0;

function notifyConnection(state) {
  connected = state;
  connectionListeners.forEach((fn) => {
    try {
      fn(state);
    } catch {
      /* ignore */
    }
  });
}

function dispatch(destination, body) {
  const map = subsByDest.get(destination);
  if (!map) return;
  map.forEach((handler) => {
    try {
      handler(body);
    } catch (e) {
      console.warn('[Realtime] handler error', destination, e);
    }
  });
}

function ensureStompSubscription(destination) {
  if (!client || !connected) return;
  if (activeStompSubs.has(destination)) return;
  const stompSub = client.subscribe(destination, (frame) => {
    try {
      const body = JSON.parse(frame.body);
      dispatch(destination, body);
    } catch (e) {
      console.warn('[Realtime] parse failed', destination, e);
    }
  });
  activeStompSubs.set(destination, stompSub);
}

function dropStompSubscriptionIfEmpty(destination) {
  const map = subsByDest.get(destination);
  if (map && map.size > 0) return;
  const stompSub = activeStompSubs.get(destination);
  if (stompSub) {
    try {
      stompSub.unsubscribe();
    } catch {
      /* ignore */
    }
    activeStompSubs.delete(destination);
  }
  subsByDest.delete(destination);
}

async function ensureClient() {
  const token = apiClient.getAccessToken();
  if (!token) return null;

  if (client?.active) return client;
  if (activating) return activating;

  activating = (async () => {
    const [{ Client }, { default: SockJS }] = await Promise.all([
      import('@stomp/stompjs'),
      import('sockjs-client'),
    ]);

    try {
      client?.deactivate?.();
    } catch {
      /* ignore */
    }
    activeStompSubs.clear();

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
        notifyConnection(true);
        // Re-subscribe mọi destination đang có listener
        subsByDest.forEach((_, dest) => ensureStompSubscription(dest));
        console.info('[Realtime] connected', wsUrl);
      },
      onDisconnect: () => notifyConnection(false),
      onStompError: () => notifyConnection(false),
      onWebSocketClose: () => notifyConnection(false),
    });
    client.activate();
    return client;
  })();

  try {
    return await activating;
  } finally {
    activating = null;
  }
}

export function subscribe(destination, handler) {
  if (!destination || typeof handler !== 'function') {
    return () => {};
  }

  let map = subsByDest.get(destination);
  if (!map) {
    map = new Map();
    subsByDest.set(destination, map);
  }
  const id = ++subIdSeq;
  map.set(id, handler);

  ensureClient().then(() => {
    if (connected) ensureStompSubscription(destination);
  });

  return () => {
    const m = subsByDest.get(destination);
    if (m) {
      m.delete(id);
      if (m.size === 0) dropStompSubscriptionIfEmpty(destination);
    }
  };
}

export function subscribeMany(destinations, handler) {
  const unsubs = (destinations || [])
    .filter(Boolean)
    .map((d) => subscribe(d, handler));
  return () => unsubs.forEach((u) => u());
}

export function onConnectionChange(listener) {
  connectionListeners.add(listener);
  listener(connected);
  return () => connectionListeners.delete(listener);
}

export function isRealtimeConnected() {
  return connected;
}

export function disconnectRealtime() {
  subsByDest.clear();
  activeStompSubs.forEach((s) => {
    try {
      s.unsubscribe();
    } catch {
      /* ignore */
    }
  });
  activeStompSubs.clear();
  try {
    client?.deactivate?.();
  } catch {
    /* ignore */
  }
  client = null;
  notifyConnection(false);
}

export const REALTIME_DEST = {
  // User-private queues
  appointmentsUser: '/user/queue/appointments',
  notificationsUser: '/user/queue/notifications',
  reactionsUser: '/user/queue/reactions',
  vaccinationsUser: '/user/queue/vaccinations',
  chatMessages: '/user/queue/messages',
  chatRead: '/user/queue/messages/read',
  // Broadcast topics
  appointmentsTopic: '/topic/appointments',
  inventoryTopic: '/topic/inventory',
  reactionsTopic: '/topic/reactions',
  vaccinationsTopic: '/topic/vaccinations',
  facility: (domain, facilityId) =>
    facilityId != null ? `/topic/${domain}/facility/${facilityId}` : null,
};
