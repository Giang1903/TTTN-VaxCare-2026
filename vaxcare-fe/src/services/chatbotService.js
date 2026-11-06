import { apiClient } from "./apiClient";

const SESSION_KEY = "vx_chatbot_session_id";

/** Lấy hoặc tạo session_id giữ ngữ cảnh trong phiên trình duyệt */
export function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function clearChatSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function sendChatMessage(message, { sessionId } = {}) {
  const sid = sessionId || getOrCreateSessionId();
  // Chỉ gửi Bearer khi đã có token — guest vẫn chat được nếu BE cho phép
  const hasToken = Boolean(apiClient.getAccessToken());
  const data = await apiClient.request("/chatbot/chat", {
    method: "POST",
    body: {
      message: message.trim(),
      sessionId: sid,
    },
    auth: hasToken,
  });

  // Đồng bộ session từ server nếu có
  if (data?.session_id || data?.sessionId) {
    const serverSid = data.session_id || data.sessionId;
    localStorage.setItem(SESSION_KEY, serverSid);
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

/** Gợi ý câu hỏi nhanh — giọng gần gũi, dễ bấm */
export const QUICK_PROMPTS = [
  "Tôi 20 tuổi nên tiêm gì?",
  "HPV phòng bệnh gì?",
  "Lịch tiêm bé 12 tháng?",
  "Tiêm HPV mũi 1 xong rồi sao?",
];