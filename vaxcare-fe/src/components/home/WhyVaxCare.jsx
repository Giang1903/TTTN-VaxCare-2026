// ============ WHY VAXCARE ============
export default function WhyVaxCare() {
  return (
    <section className="why" id="about">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow"
            ><span className="dot"></span>Vì sao chọn VaxCare</span
          >
          <h2>Nền tảng điều phối tiêm chủng<br />được xây dựng bằng AI</h2>
          <p>
            Kết hợp công nghệ và quy trình y tế để mang lại trải nghiệm tiêm
            chủng chủ động.
          </p>
        </div>
        <div className="why-grid">
          <div className="card why-card">
            <div className="why-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"
                />
              </svg>
            </div>
            <h4>Điều phối bằng AI</h4>
            <p>Giảm quá tải, tối ưu khung giờ tiêm dựa trên dữ liệu thực tế.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3a9 9 0 1 0 9 9" />
                <path d="M12 3v9h9" />
              </svg>
            </div>
            <h4>Hồ sơ tập trung</h4>
            <p>Lịch sử tiêm chủng, chứng nhận lưu trữ minh bạch, dễ tra cứu.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg
                width="22"
                height="22"
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
            <h4>Check-in bằng QR</h4>
            <p>
              Rút ngắn thời gian chờ tại cơ sở nhờ quy trình xác thực nhanh.
            </p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </div>
            <h4>Nhắc lịch tự động</h4>
            <p>Không bỏ lỡ mũi tiêm tiếp theo với thông báo đúng thời điểm.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
