// ============ MISSION VISION ============
export default function MissionVision() {
  return (
    <section className="why" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">
            <span className="dot"></span>Sứ mệnh & Tầm nhìn
          </span>
          <h2>Chúng tôi tồn tại để mọi người được tiêm chủng đúng lúc, đúng cách</h2>
          <p>VaxCare kết nối người dân, cơ sở y tế và dữ liệu tiêm chủng trên một nền tảng thống nhất.</p>
        </div>
        <div className="why-grid" style={{ marginTop: '48px' }}>
          <div className="card why-card">
            <div className="why-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <h4>Sứ mệnh</h4>
            <p>Đơn giản hóa quy trình tiêm chủng, giảm thời gian chờ và nâng cao tỷ lệ bao phủ vắc xin nhờ công nghệ AI và dữ liệu thời gian thực.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h4>Tầm nhìn</h4>
            <p>Trở thành nền tảng tiêm chủng thông minh hàng đầu Việt Nam, mở rộng ra khu vực và góp phần bảo vệ sức khỏe cộng đồng.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h4>Giá trị cốt lõi</h4>
            <p>An toàn – Minh bạch – Lấy người dùng làm trung tâm – Đổi mới liên tục bằng AI và dữ liệu.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h4>Cam kết</h4>
            <p>Bảo mật dữ liệu sức khỏe theo tiêu chuẩn, đồng bộ với hệ thống y tế quốc gia và hỗ trợ 24/7 qua hotline.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
