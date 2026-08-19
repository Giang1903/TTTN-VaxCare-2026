import { Link } from 'react-router-dom';
// ============ HERO ============
export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="vx-blob-field">
        <span className="vx-blob b1"></span><span className="vx-blob b2"></span
        ><span className="vx-blob b3"></span>
      </div>
      <div
        className="vx-ibubble on-brand"
        style={{width: '58px', height: '58px', top: '14%', right: '20%', animationDelay: '-1s'}}
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
        style={{width: '40px', height: '40px', bottom: '14%', right: '6%', animationDelay: '-3.5s', animationDuration: '9s'}}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"
          />
        </svg>
      </div>
      <div
        className="vx-ibubble on-brand"
        style={{width: '32px', height: '32px', top: '56%', left: '4%', animationDelay: '-5s', animationDuration: '8s'}}
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
        style={{width: '300px', height: '300px', top: '4%', right: '8%'}}
      ></span>
      <div className="wrap">
        <div className="hero-copy">
          <span className="eyebrow on-dark"
            ><span className="dot"></span>VAXCARE — ĐỒNG HÀNH CÙNG SỨC KHỎE</span
          >
          <h1>
            Chủ động tiêm chủng,<br />bảo vệ sức khỏe
            <span className="accent"> thông minh</span>
          </h1>
          <p className="lead">
            Đặt lịch tiêm chủng dễ dàng, quản lý hồ sơ tiêm chủng và nhận nhắc
            lịch tự động cùng VaxCare.
          </p>
          <div className="btn-row">
            <Link to="/login" className="btn btn-primary">Đặt lịch ngay</Link>
            <a href="#vaccines" className="btn btn-ghost-dark">Khám phá vắc xin</a>
          </div>
          <ul className="feature-mini">
            <li>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M20 6 9 17l-5-5" /></svg
              >Đặt lịch trực tuyến
            </li>
            <li>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M20 6 9 17l-5-5" /></svg
              >Hồ sơ tiêm chủng điện tử
            </li>
            <li>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <path d="M20 6 9 17l-5-5" /></svg
              >QR Check-in
            </li>
          </ul>
        </div>
        <div className="hero-visual">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="photo-frame">
            <img
              src="/assets/preview.png"
              alt="Nhân viên y tế VaxCare"
            />
          </div>
          <div className="float-card card-record">
            <div className="fc-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3a9 9 0 1 0 9 9" />
                <path d="M12 3v9h9" />
              </svg>
            </div>
            <div>
              <div className="fc-title">Hồ sơ tiêm chủng</div>
              <div className="fc-sub">Cập nhật điện tử</div>
            </div>
          </div>
          <div className="float-card card-ai">
            <div className="fc-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <div className="fc-title">AI Smart Booking</div>
              <div className="fc-sub">Khung giờ phù hợp đã được đề xuất</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
