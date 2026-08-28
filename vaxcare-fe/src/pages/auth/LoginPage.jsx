import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useTilt from "../../hooks/useTilt";
import { useAuth } from "../../context/AuthContext";

const HOME_BY_ROLE = {
  USER: "/dashboard",
  MEDICAL_STAFF: "/staff",
  ADMIN: "/admin",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const visualTiltRef = useTilt();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await login({ email: form.email, password: form.password });
      const role = data?.role;
      const from = location.state?.from?.pathname;
      let redirectTo = HOME_BY_ROLE[role] || "/";
      if (from && from !== "/login") {
        if (role === "ADMIN" && from.startsWith("/admin")) redirectTo = from;
        else if (role === "MEDICAL_STAFF" && from.startsWith("/staff")) redirectTo = from;
        else if (
          role === "USER" &&
          (from.startsWith("/dashboard") ||
            from.startsWith("/booking") ||
            from.startsWith("/appointments") ||
            from.startsWith("/record"))
        ) {
          redirectTo = from;
        }
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      {/* CỘT THƯƠNG HIỆU */}
      <aside className="brand-panel">
        <div className="vx-blob-field">
          <span className="vx-blob b1"></span>
          <span className="vx-blob b2"></span>
          <span className="vx-blob b3"></span>
        </div>
        <div
          className="vx-ibubble on-brand"
          style={{
            width: "56px",
            height: "56px",
            top: "18%",
            right: "16%",
            animationDelay: "-1s",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <div
          className="vx-ibubble on-brand"
          style={{
            width: "40px",
            height: "40px",
            bottom: "30%",
            right: "8%",
            animationDelay: "-3.5s",
            animationDuration: "9s",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
          </svg>
        </div>
        <div
          className="vx-ibubble on-brand"
          style={{
            width: "34px",
            height: "34px",
            top: "52%",
            left: "6%",
            animationDelay: "-5s",
            animationDuration: "8s",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        </div>
        <span
          className="vx-orbit"
          style={{ width: "260px", height: "260px", top: "8%", right: "2%" }}
        ></span>

        <Link to="/" className="brand-logo">
          <span className="logo-mark">
            <img src="/logo.png" alt="VaxCare logo" />
          </span>
          VaxCare
        </Link>

        <div className="brand-mid">
          <h2>Chào mừng trở lại</h2>
          <p>
            Đăng nhập để quản lý lịch tiêm, tra cứu hồ sơ tiêm chủng điện tử và
            nhận đề xuất khung giờ thông minh từ AI.
          </p>
          <ul className="brand-features">
            <li>
              <span className="ico">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              Đặt lịch tiêm chỉ trong vài bước
            </li>
            <li>
              <span className="ico">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              Hồ sơ &amp; chứng nhận tiêm chủng điện tử
            </li>
            <li>
              <span className="ico">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              Nhắc lịch tự động, không bỏ lỡ mũi tiêm
            </li>
          </ul>
          <div
            className="brand-visual vx-tilt vx-tilt-shine"
            ref={visualTiltRef}
          >
            <img
              src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=800&auto=format&fit=crop"
              alt="Nhân viên y tế VaxCare"
            />
          </div>
        </div>

        <p className="brand-quote">
          © 2026 VaxCare. Tất cả các quyền được bảo lưu.
        </p>
      </aside>

      {/* CỘT FORM */}
      <main className="form-panel">
        <div className="vx-blob-field">
          <span
            className="vx-blob b1"
            style={{ background: "rgba(91, 138, 224, 0.16)" }}
          ></span>
          <span
            className="vx-blob b2"
            style={{ background: "rgba(159, 203, 255, 0.18)" }}
          ></span>
        </div>

        <Link to="/" className="form-back">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Về trang chủ
        </Link>

        <div className="form-wrap">
          <h1>Đăng nhập</h1>
          <p className="sub">
            Nhập thông tin tài khoản để tiếp tục sử dụng VaxCare.
          </p>

          {location.state?.registered && (
            <p className="form-success">
              Đăng ký thành công! Vui lòng kiểm tra email và bấm link kích hoạt
              trước khi đăng nhập.
            </p>
          )}
          {location.state?.verified && (
            <p className="form-success">
              Tài khoản đã kích hoạt. Bạn có thể đăng nhập ngay.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <div className="input-wrap">
                <svg
                  className="li"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ban@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-wrap">
                <svg
                  className="li"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-eye"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.9 10.9 0 0 1 12 20c-7 0-11-8-11-8a19.4 19.4 0 0 1 5.06-5.94M9.9 4.24A10.6 10.6 0 0 1 12 4c7 0 11 8 11 8a19.5 19.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="row-between">
              <label className="remember">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                />
                Ghi nhớ đăng nhập
              </label>
              <Link to="/forgot-password" className="link-teal">Quên mật khẩu?</Link>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="switch-note">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="link-teal">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}