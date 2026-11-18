import { apiClient } from "./apiClient";

const SESSION_KEY = "vx_chatbot_session_id";
const SESSION_OWNER_KEY = "vx_chatbot_session_owner";
const MESSAGES_PREFIX = "vx_chatbot_messages_";

function newSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = newSessionId();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function clearChatSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getChatOwnerKey(user) {
  if (!user) return "guest";
  const id = user.accountId ?? user.userId ?? user.id ?? user.email;
  return id != null ? `acc_${id}` : "guest";
}

export function ensureSessionOwner(ownerKey) {
  const key = ownerKey || "guest";
  const prev = localStorage.getItem(SESSION_OWNER_KEY);
  if (prev === key && localStorage.getItem(SESSION_KEY)) {
    return { reset: false, sessionId: getOrCreateSessionId(), ownerKey: key };
  }
  clearChatSession();
  localStorage.setItem(SESSION_OWNER_KEY, key);
  const sessionId = newSessionId();
  localStorage.setItem(SESSION_KEY, sessionId);
  return { reset: true, sessionId, ownerKey: key };
}

export function loadStoredMessages(ownerKey, welcome) {
  try {
    const raw = localStorage.getItem(MESSAGES_PREFIX + (ownerKey || "guest"));
    if (!raw) return [welcome];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [welcome];
    return parsed;
  } catch {
    return [welcome];
  }
}

export function saveStoredMessages(ownerKey, messages) {
  try {
    localStorage.setItem(
      MESSAGES_PREFIX + (ownerKey || "guest"),
      JSON.stringify(messages.slice(-80)) // giới hạn 80 tin
    );
  } catch {
    // quota / private mode
  }
}

export function clearStoredMessages(ownerKey) {
  localStorage.removeItem(MESSAGES_PREFIX + (ownerKey || "guest"));
}

export async function sendChatMessage(message, { sessionId } = {}) {
  const sid = sessionId || getOrCreateSessionId();
  const hasToken = Boolean(apiClient.getAccessToken());
  const data = await apiClient.request("/chatbot/chat", {
    method: "POST",
    body: {
      message: message.trim(),
      sessionId: sid,
    },
    auth: hasToken,
  });

  if (data?.session_id || data?.sessionId) {
    localStorage.setItem(SESSION_KEY, data.session_id || data.sessionId);
  }

  return normalizeChatResponse(data);
}

function normalizeChatResponse(data) {
  if (!data) {
    return {
      reply: "Xin lỗi, không nhận được phản hồi từ trợ lý.",
      intent: "unknown",
      intentConfidence: 0,
      sessionId: getOrCreateSessionId(),
      sources: [],
      actions: [],
      safeMode: false,
      meta: {},
    };
  }

  return {
    reply: data.reply || data.message || "",
    intent: data.intent || "unknown",
    intentConfidence: data.intent_confidence ?? data.intentConfidence ?? 0,
    sessionId: data.session_id || data.sessionId || getOrCreateSessionId(),
    sources: Array.isArray(data.sources) ? data.sources : [],
    actions: Array.isArray(data.actions) ? data.actions : [],
    safeMode: Boolean(data.safe_mode ?? data.safeMode),
    meta: data.meta || {},
  };
}

export const QUICK_PROMPTS = [
  "Tôi đã tiêm những vaccine gì?",
  "Lịch tiêm sắp tới của tôi?",
  "HPV phòng bệnh gì?",
  "Tôi 20 tuổi nên tiêm gì?",
];
