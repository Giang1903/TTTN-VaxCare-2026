import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resendVerification, verifyEmail } from "../../services/authService";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [status, setStatus] = useState(token ? "loading" : "missing"); // loading | success | error | missing
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmail(token)
      .then(() => {
        if (cancelled) return;
        setStatus("success");
        setMessage("Tài khoản đã được kích hoạt. Bạn có thể đăng nhập.");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err.message || "Link xác nhận không hợp lệ hoặc đã hết hạn.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend(e) {
    e.preventDefault();
    if (!email.trim()) {
      setResendMsg("Vui lòng nhập email.");
      return;
    }
    setResending(true);
    setResendMsg("");
    try {
      await resendVerification(email.trim());
      setResendMsg("Nếu email chưa kích hoạt, hệ thống đã gửi lại link xác nhận. Vui lòng kiểm tra hộp thư.");
    } catch (err) {
      setResendMsg(err.message || "Không gửi được email. Thử lại sau.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-shell" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="form-wrap" style={{ maxWidth: 440, width: "100%", padding: 32 }}>
        <Link to="/" className="logo" style={{ display: "inline-flex", marginBottom: 24, textDecoration: "none" }}>
          <span className="logo-mark">
            <img src="/logo.png" alt="VaxCare" width={36} height={36} />
          </span>
          VaxCare
        </Link>

        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Xác nhận email</h1>

        {status === "loading" && (
          <p className="sub">Đang kích hoạt tài khoản…</p>
        )}

        {status === "success" && (
          <>
            <p className="form-success">{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ display: "inline-block", marginTop: 16 }}>
              Đăng nhập ngay
            </Link>
          </>
        )}

        {(status === "error" || status === "missing") && (
          <>
            <p className="form-error" style={{ marginBottom: 16 }}>
              {message || "Thiếu token xác nhận. Vui lòng mở link trong email đăng ký."}
            </p>
            <p className="sub" style={{ marginBottom: 12 }}>
              Gửi lại email xác nhận:
            </p>
            <form onSubmit={handleResend}>
              <div className="form-field" style={{ marginBottom: 12 }}>
                <label htmlFor="email">Email đã đăng ký</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--gray-300)" }}
                />
              </div>
              {resendMsg && (
                <p className={resendMsg.includes("gửi lại") || resendMsg.includes("Nếu email") ? "form-success" : "form-error"} style={{ marginBottom: 12 }}>
                  {resendMsg}
                </p>
              )}
              <button type="submit" className="btn btn-primary" disabled={resending}>
                {resending ? "Đang gửi…" : "Gửi lại email"}
              </button>
            </form>
            <p style={{ marginTop: 20, fontSize: 13 }}>
              <Link to="/login">Quay lại đăng nhập</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}