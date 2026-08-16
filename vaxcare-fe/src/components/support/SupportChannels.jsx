// ============ SUPPORT CHANNELS ============
export default function SupportChannels() {
  return (
    <section style={{ padding: '60px 0 20px' }}>
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">
            <span className="dot"></span>Kênh hỗ trợ
          </span>
          <h2>Chọn cách liên hệ phù hợp</h2>
          <p>Chúng tôi hỗ trợ qua điện thoại, email và form trực tuyến.</p>
        </div>
        <div className="support-channels">
          <div className="channel-card">
            <div className="ch-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <h4>Hotline</h4>
            <p>Hỗ trợ đặt lịch &amp; tư vấn 7:30 – 20:00 hàng ngày</p>
            <a href="tel:19006868">1900 6868</a>
          </div>
          <div className="channel-card">
            <div className="ch-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h4>Email</h4>
            <p>Phản hồi trong vòng 24 giờ làm việc</p>
            <a href="mailto:support@vaxcare.vn">support@vaxcare.vn</a>
          </div>
          <div className="channel-card">
            <div className="ch-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h4>Chat / Form</h4>
            <p>Gửi yêu cầu ngay trên trang này</p>
            <a href="#contact">Điền form ↓</a>
          </div>
        </div>
      </div>
    </section>
  );
}
