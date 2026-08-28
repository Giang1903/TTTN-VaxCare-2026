import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="form-wrap"
        style={{ maxWidth: 440, width: "100%", padding: 32 }}
      >
        <Link
          to="/"
          className="logo"
          style={{
            display: "inline-flex",
            marginBottom: 24,
            textDecoration: "none",
          }}
        >
          <span className="logo-mark">
            <img src="/logo.png" alt="VaxCare" width={36} height={36} />
          </span>
          VaxCare
        </Link>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 8,
            color: "#0f172a",
          }}
        >
          Đặt lại mật khẩu
        </h1>

        {!token && (
          <p className="form-error" style={{ marginBottom: 12 }}>
            Thiếu token. Vui lòng mở link từ email đặt lại mật khẩu.
          </p>
        )}

        {done ? (
          <>
            <p className="form-success" style={{ marginBottom: 16 }}>
              Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu
              mới.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/login")}
            >
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
              <label
                htmlFor="np"
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: 13.5,
                  marginBottom: 6,
                }}
              >
                Mật khẩu mới
              </label>
              <input
                id="np"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
            <div className="form-field" style={{ marginBottom: 16 }}>
              <label
                htmlFor="npc"
                style={{
                  display: "block",
                  fontWeight: 700,
                  fontSize: 13.5,
                  marginBottom: 6,
                }}
              >
                Xác nhận mật khẩu
              </label>
              <input
                id="npc"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
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
