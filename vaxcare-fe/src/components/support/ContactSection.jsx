import { useState } from "react";

const INFO_ITEMS = [
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    title: "Hotline",
    body: (
      <p>
        <a href="tel:19006868">1900 6868</a> (7:30 – 20:00)
      </p>
    ),
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: "Email hỗ trợ",
    body: (
      <p>
        <a href="mailto:vaxcare2026@gmail.com">vaxcare2026@gmail.com</a>
      </p>
    ),
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Trụ sở",
    body: <p>TP. Hồ Chí Minh, Việt Nam</p>,
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "Giờ làm việc",
    body: <p>Thứ 2 – Chủ nhật: 7:30 – 20:00</p>,
  },
];

// ============ CONTACT FORM ============
export default function ContactSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [sentHint, setSentHint] = useState("");

  const TOPIC_LABELS = {
    booking: "Đặt / hủy / đổi lịch",
    account: "Tài khoản & hồ sơ",
    facility: "Cơ sở tiêm chủng",
    vaccine: "Thông tin vắc xin",
    other: "Khác",
  };

  function handleSubmit(e) {
    e.preventDefault();
    setSentHint("");
    const topicLabel = TOPIC_LABELS[topic] || topic || "Hỗ trợ";
    const subject = `[VaxCare Hỗ trợ] ${topicLabel} — ${name.trim()}`;

    const nl = "\r\n";
    const body = [
      "Họ và tên: " + name.trim(),
      "Số điện thoại: " + phone.trim(),
      "Email liên hệ: " + (email.trim() || "(không cung cấp)"),
      "Chủ đề: " + topicLabel,
      "",
      "Nội dung yêu cầu:",
      message.trim(),
      "",
      "------------------------------",
      "Gửi từ form hỗ trợ trên website VaxCare",
    ].join(nl);

    const gmailUrl =
      "https://mail.google.com/mail/?view=cm&fs=1&tf=1" +
      "&to=" +
      encodeURIComponent("vaxcare2026@gmail.com") +
      "&su=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);

    window.open(gmailUrl, "_blank", "noopener,noreferrer");
    setSentHint(
      "Đã mở Gmail soạn thư. Kiểm tra tab mới → xem lại nội dung → bấm Gửi.",
    );
  }

  return (
    <section id="contact" style={{ padding: "80px 0" }}>
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot"></span>Liên hệ
          </span>
          <h2>Gửi yêu cầu hỗ trợ</h2>
          <p>Điền form bên dưới, đội ngũ sẽ phản hồi sớm nhất có thể.</p>
        </div>
        <div className="contact-grid">
          <div className="contact-card">
            <h3>Form liên hệ</h3>
            <p>Các trường có dấu * là bắt buộc.</p>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form-row">
                <div>
                  <label htmlFor="cf-name">Họ và tên *</label>
                  <input
                    id="cf-name"
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="cf-phone">Số điện thoại *</label>
                  <input
                    id="cf-phone"
                    type="tel"
                    required
                    placeholder="09xx xxx xxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="contact-form-row">
                <div>
                  <label htmlFor="cf-email">Email</label>
                  <input
                    id="cf-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="cf-topic">Chủ đề *</label>
                  <select
                    id="cf-topic"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option value="">Chọn chủ đề</option>
                    <option value="booking">Đặt / hủy / đổi lịch</option>
                    <option value="account">Tài khoản &amp; hồ sơ</option>
                    <option value="facility">Cơ sở tiêm chủng</option>
                    <option value="vaccine">Thông tin vắc xin</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label htmlFor="cf-msg">Nội dung *</label>
                <textarea
                  id="cf-msg"
                  required
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  marginTop: 8,
                  height: 48,
                  fontWeight: 700,
                }}
              >
                Gửi yêu cầu qua Gmail
              </button>
              {sentHint && (
                <p
                  className="form-success"
                  style={{ marginTop: 12, fontSize: 13.5 }}
                >
                  {sentHint}
                </p>
              )}
              <p
                style={{
                  marginTop: 10,
                  fontSize: 12.5,
                  color: "var(--gray-500)",
                }}
              >
                Sẽ mở <strong>Gmail</strong> soạn sẵn tới{" "}
                <strong>vaxcare2026@gmail.com</strong>. Đăng nhập Google nếu
                được hỏi, rồi bấm <strong>Gửi</strong> trên Gmail.
              </p>
            </form>
          </div>
          <div>
            <div className="info-list">
              {INFO_ITEMS.map((item) => (
                <div className="info-item" key={item.title}>
                  <div className="info-icon">{item.icon}</div>
                  <div>
                    <h4>{item.title}</h4>
                    {item.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
