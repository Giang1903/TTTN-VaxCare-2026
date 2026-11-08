import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  QUICK_PROMPTS,
  getOrCreateSessionId,
  getChatOwnerKey,
  ensureSessionOwner,
  loadStoredMessages,
  saveStoredMessages,
  clearStoredMessages,
  sendChatMessage,
} from "../../services/chatbotService";
import "../../styles/chatbot.css";

/* ---- Icons (stroke style giống Hero / QuickActions) ---- */
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22 11 13 2 9l20-7z" />
  </svg>
);

const IconSpark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </svg>
);

const WELCOME = {
  id: "welcome",
  role: "bot",
  text:
    "Xin chào! Mình là trợ lý tiêm chủng của VaxCare.\n\nBạn có thể hỏi mình về vaccine, lịch tiêm theo tuổi, đối chiếu hồ sơ, hoặc tìm cơ sở để đặt lịch — mình sẽ trả lời ngắn gọn và có nguồn tham khảo.",
  sources: [],
  actions: [],
  safeMode: false,
};

export default function ChatWidget() {
  const navigate = useNavigate();
  const { role, user, isAuthenticated, loading: authLoading } = useAuth();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTip, setShowTip] = useState(true);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const sessionIdRef = useRef(getOrCreateSessionId());
  const ownerKeyRef = useRef("guest");
  const hidden = role === "MEDICAL_STAFF" || role === "ADMIN";

  // Gắn session + tin nhắn theo guest/account; F5 khôi phục; đổi account/logout → hội thoại mới
  useEffect(() => {
    if (authLoading) return;
    const ownerKey = getChatOwnerKey(isAuthenticated ? user : null);
    const { reset, sessionId } = ensureSessionOwner(ownerKey);
    ownerKeyRef.current = ownerKey;
    sessionIdRef.current = sessionId;
    if (reset) {
      // Đổi người dùng: xóa tin của owner mới (bắt đầu sạch) rồi hiện welcome
      clearStoredMessages(ownerKey);
      const welcome = { ...WELCOME, id: `welcome_${Date.now()}` };
      setMessages([welcome]);
      saveStoredMessages(ownerKey, [welcome]);
      setError(null);
      setInput("");
      setLoading(false);
    } else {
      const stored = loadStoredMessages(ownerKey, { ...WELCOME, id: "welcome" });
      setMessages(stored);
    }
  }, [authLoading, isAuthenticated, user]);

  // Lưu tin nhắn mỗi khi đổi (cùng owner) — sống qua F5
  useEffect(() => {
    if (authLoading) return;
    const ownerKey = ownerKeyRef.current;
    if (!ownerKey) return;
    saveStoredMessages(ownerKey, messages);
  }, [messages, authLoading]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowTip(false);
      if (inputRef.current) inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setShowTip(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Đóng panel nếu role đổi sang staff/admin giữa phiên
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (hidden) setOpen(false);
  }, [hidden]);

  const appendBot = useCallback((payload) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bot_${Date.now()}`,
        role: "bot",
        text: payload.reply,
        sources: payload.sources || [],
        actions: payload.actions || [],
        safeMode: payload.safeMode,
        intent: payload.intent,
      },
    ]);
  }, []);

  const handleSend = useCallback(
    async (rawText) => {
      const text = (rawText ?? input).trim();
      if (!text || loading) return;

      setError(null);
      setInput("");
      setMessages((prev) => [
        ...prev,
        { id: `user_${Date.now()}`, role: "user", text },
      ]);
      setLoading(true);

      try {
        const res = await sendChatMessage(text, {
          sessionId: sessionIdRef.current,
        });
        if (res.sessionId) sessionIdRef.current = res.sessionId;
        appendBot(res);
      } catch (err) {
        const msg =
          err?.message ||
          "Mình chưa kết nối được lúc này. Bạn thử lại sau vài giây nhé.";
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "bot",
            text: msg,
            isError: true,
            sources: [],
            actions: [],
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, appendBot]
  );

  const onActionClick = (action) => {
    if (!action) return;
    const path = action.path;
    if (path) {
      setOpen(false);
      navigate(path);
      return;
    }
    switch (action.type) {
      case "OPEN_BOOKING":
        setOpen(false);
        navigate("/booking");
        break;
      case "OPEN_HISTORY":
        setOpen(false);
        navigate("/record");
        break;
      case "OPEN_VACCINE": {
        const vid = action.vaccine_id || action.vaccineId;
        if (vid) {
          setOpen(false);
          navigate(`/vaccines/${vid}`);
        }
        break;
      }
      default:
        break;
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (hidden) return null;

  const onlyWelcome = messages.length === 1 && messages[0].id === "welcome";

  return (
    <div className="vx-chat">
      {open && (
        <div
          className="vx-chat__panel card"
          role="dialog"
          aria-label="Trợ lý tiêm chủng VaxCare"
        >
          <header className="vx-chat__header">
            <div className="vx-chat__brand">
              <span className="vx-chat__logo">
                <IconShield />
              </span>
              <div className="vx-chat__brand-text">
                <strong>Trợ lý VaxCare</strong>
                <span className="vx-chat__online">
                  <i className="vx-chat__online-dot" />
                  Sẵn sàng hỗ trợ
                </span>
              </div>
            </div>
            <button
              type="button"
              className="vx-chat__close"
              onClick={() => setOpen(false)}
              aria-label="Đóng chat"
            >
              <IconClose />
            </button>
          </header>

          <div className="vx-chat__body" ref={listRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={[
                  "vx-chat__row",
                  m.role === "user" ? "is-user" : "is-bot",
                ].join(" ")}
              >
                {m.role === "bot" && (
                  <span className="vx-chat__mini-avatar" aria-hidden>
                    <IconShield />
                  </span>
                )}
                <div
                  className={[
                    "vx-chat__bubble",
                    m.role === "user" ? "vx-chat__bubble--user" : "vx-chat__bubble--bot",
                    m.isError ? "is-error" : "",
                    m.safeMode ? "is-safe" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <p className="vx-chat__text">{m.text}</p>

                  {m.sources?.length > 0 && (
                    <div className="vx-chat__sources">
                      <span className="vx-chat__sources-label">Nguồn tham khảo</span>
                      <ul>
                        {m.sources.slice(0, 3).map((s, i) => (
                          <li key={i}>
                            <span className="badge badge-good">
                              {s.tier || "A"}
                            </span>
                            {s.title || s.doc_id || "Tài liệu"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {m.actions?.length > 0 && (
                    <div className="vx-chat__actions">
                      {m.actions.map((a, i) => (
                        <button
                          key={i}
                          type="button"
                          className="btn btn-sm btn-ghost vx-chat__action"
                          onClick={() => onActionClick(a)}
                        >
                          {a.label || a.type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="vx-chat__row is-bot">
                <span className="vx-chat__mini-avatar" aria-hidden>
                  <IconShield />
                </span>
                <div className="vx-chat__bubble vx-chat__bubble--bot is-typing">
                  <span className="vx-chat__dot" />
                  <span className="vx-chat__dot" />
                  <span className="vx-chat__dot" />
                </div>
              </div>
            )}
          </div>

          {onlyWelcome && !loading && (
            <div className="vx-chat__quick">
              <div className="vx-chat__quick-title">
                <IconSpark />
                <span>Gợi ý câu hỏi</span>
              </div>
              <div className="vx-chat__chips">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="vx-chat__chip"
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <footer className="vx-chat__footer">
            {error && <p className="vx-chat__error-hint">{error}</p>}
            <div className="vx-chat__composer">
              <textarea
                ref={inputRef}
                className="vx-chat__input"
                rows={1}
                placeholder="Hỏi về vaccine, lịch tiêm, hồ sơ..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={loading}
                aria-label="Nội dung câu hỏi"
              />
              <button
                type="button"
                className="vx-chat__send btn btn-primary btn-sm"
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                aria-label="Gửi tin nhắn"
              >
                <IconSend />
              </button>
            </div>
            <p className="vx-chat__disclaimer">
              Thông tin mang tính tham khảo · Không thay thế tư vấn y tế trực tiếp
            </p>
          </footer>
        </div>
      )}

      <div className="vx-chat__fab-wrap">
        {showTip && !open && (
          <div className="vx-chat__tip" role="status">
            <span>Cần hỏi về tiêm chủng?</span>
            <button
              type="button"
              className="vx-chat__tip-close"
              onClick={() => setShowTip(false)}
              aria-label="Đóng gợi ý"
            >
              ×
            </button>
          </div>
        )}
        <button
          type="button"
          className={`vx-chat__fab${open ? " is-open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Đóng trợ lý chat" : "Mở trợ lý chat VaxCare"}
        >
          {open ? <IconClose /> : <IconChat />}
        </button>
      </div>
    </div>
  );
}