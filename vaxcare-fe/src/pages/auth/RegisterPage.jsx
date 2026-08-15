import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useTilt from "../../hooks/useTilt";

export default function RegisterPage() {
  const navigate = useNavigate();
  const visualTiltRef = useTilt();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!form.agreeTerms) {
      setError("Bạn cần đồng ý với Điều khoản sử dụng để tiếp tục.");
      return;
    }
    setError("");
    // TODO: gọi API đăng ký thực tế tại đây (src/services)
    navigate("/login");
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
            width: "52px",
            height: "52px",
            top: "16%",
            right: "14%",
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
            width: "36px",
            height: "36px",
            bottom: "28%",
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
        <span
          className="vx-orbit"
          style={{ width: "240px", height: "240px", top: "6%", right: "2%" }}
        ></span>

        <Link to="/" className="brand-logo">
          <span className="logo-mark">
            <img src="/logo.png" alt="VaxCare logo" />
          </span>
          VaxCare
        </Link>

        <div className="brand-mid">
          <h2>Tạo tài khoản, chủ động tiêm chủng ngay hôm nay</h2>
          <p>
            Đăng ký miễn phí để đặt lịch tiêm, quản lý hồ sơ sức khỏe và nhận
            nhắc lịch tự động từ VaxCare.
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
              Miễn phí, chỉ mất chưa đến 1 phút
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
              AI đề xuất khung giờ tiêm phù hợp
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
              Đồng bộ hồ sơ tại mọi cơ sở VaxCare
            </li>
          </ul>
          <div
            className="brand-visual vx-tilt vx-tilt-shine"
            ref={visualTiltRef}
          >
            <img src="/assets/register.png" alt="Nhân viên y tế VaxCare" />
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

        <div className="form-wrap ">
          <h1>Tạo tài khoản</h1>
          <p className="sub">
            Điền thông tin bên dưới để bắt đầu sử dụng VaxCare.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="fullName">Họ và tên</label>
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
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
                </svg>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row2">
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
                <label htmlFor="phone">Số điện thoại</label>
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
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.79.63 2.65a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.43-1.2a2 2 0 0 1 2.11-.45c.86.3 1.75.51 2.65.63A2 2 0 0 1 22 16.92Z" />
                  </svg>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="0901 234 567"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="address">
                Địa chỉ <span className="opt-tag">(không bắt buộc)</span>
              </label>
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
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                  value={form.address}
                  onChange={handleChange}
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
                  placeholder="Tối thiểu 8 ký tự"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
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

            <div className="form-field">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
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
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-eye"
                  aria-label={
                    showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                  }
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? (
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

            {error && <p className="form-error">{error}</p>}

            <label className="terms-row">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={handleChange}
              />
              <span>
                Tôi đồng ý với <a href="#terms">Điều khoản sử dụng</a> và{" "}
                <a href="#privacy">Chính sách bảo mật</a> của VaxCare.
              </span>
            </label>

            <button type="submit" className="btn btn-primary">
              Đăng ký
            </button>
          </form>

          <p className="switch-note">
            Đã có tài khoản?{" "}
            <Link to="/login" className="link-teal">
              Đăng nhập
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
