import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setDone(true);
    } catch (err) {
      setError(err.message || "Không gửi được yêu cầu. Thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="auth-shell"
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div className="form-wrap" style={{ maxWidth: 440, width: "100%", padding: 32 }}>
        <Link to="/" className="logo" style={{ display: "inline-flex", marginBottom: 24, textDecoration: "none" }}>
          <span className="logo-mark">
            <img src="/logo.png" alt="VaxCare" width={36} height={36} />
          </span>
          VaxCare
        </Link>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: "#0f172a" }}>Quên mật khẩu</h1>
        <p style={{ color: "#64748b", fontSize: 14.5, lineHeight: 1.55, marginBottom: 20 }}>
          Nhập email đã đăng ký. Nếu tài khoản tồn tại, chúng tôi sẽ gửi link đặt lại mật khẩu (hiệu lực 1 giờ).
        </p>

        {done ? (
          <>
            <p className="form-success" style={{ marginBottom: 16 }}>
              Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi. Hãy kiểm tra hộp thư
              (và thư mục spam).
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: "inline-block" }}>
              Quay lại đăng nhập
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <p className="form-error" style={{ marginBottom: 12 }}>
                {error}
              </p>
            )}
            <div className="form-field" style={{ marginBottom: 16 }}>
              <label htmlFor="fp-email" style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>
                Email
              </label>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #dbe3ee",
                  fontSize: 14.5,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%", height: 48, fontWeight: 700 }}>
              {submitting ? "Đang gửi…" : "Gửi link đặt lại"}
            </button>
            <p style={{ marginTop: 16, fontSize: 14, textAlign: "center" }}>
              <Link to="/login" className="link-teal">
                Quay lại đăng nhập
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
