import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";

const inputBox = {
  width: "100%",
  padding: "12px 44px 12px 14px",
  borderRadius: 12,
  border: "1.5px solid #dbe3ee",
  fontSize: 14.5,
  boxSizing: "border-box",
  outline: "none",
};

const eyeBtn = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  padding: 6,
  cursor: "pointer",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.9 10.9 0 0 1 12 20c-7 0-11-8-11-8a19.4 19.4 0 0 1 5.06-5.94M9.9 4.24A10.6 10.6 0 0 1 12 4c7 0 11 8 11 8a19.5 19.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <path d="M1 1l22 22" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Thiếu token. Hãy mở đúng link trong email.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(err.message || "Đặt lại mật khẩu thất bại.");
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

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: "#0f172a" }}>Đặt lại mật khẩu</h1>

        {!token && (
          <p className="form-error" style={{ marginBottom: 12 }}>
            Thiếu token. Vui lòng mở link từ email đặt lại mật khẩu.
          </p>
        )}

        {done ? (
          <>
            <p className="form-success" style={{ marginBottom: 16 }}>
              Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => navigate("/login")}>
              Đăng nhập ngay
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <p className="form-error" style={{ marginBottom: 12 }}>
                {error}
              </p>
            )}

            <div className="form-field" style={{ marginBottom: 14 }}>
              <label htmlFor="np" style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>
                Mật khẩu mới
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="np"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={inputBox}
                />
                <button
                  type="button"
                  style={eyeBtn}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <div className="form-field" style={{ marginBottom: 16 }}>
              <label htmlFor="npc" style={{ display: "block", fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>
                Xác nhận mật khẩu
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="npc"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  style={inputBox}
                />
                <button
                  type="button"
                  style={eyeBtn}
                  aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !token}
              style={{ width: "100%", height: 48, fontWeight: 700 }}
            >
              {submitting ? "Đang lưu…" : "Đặt mật khẩu mới"}
            </button>
            <p style={{ marginTop: 16, fontSize: 14, textAlign: "center" }}>
              <Link to="/forgot-password" className="link-teal">
                Gửi lại email
              </Link>
              {" · "}
              <Link to="/login" className="link-teal">
                Đăng nhập
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
