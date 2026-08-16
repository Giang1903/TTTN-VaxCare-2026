// ============ WHY (Vaccines) ============
export default function VaccinesWhy() {
  return (
    <section className="why">
      <div className="wrap">
        <div className="section-head center" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          <span className="eyebrow" style={{ marginLeft: 'auto', marginRight: 'auto', display: 'inline-flex' }}>
            <span className="dot"></span>Cam kết chất lượng
          </span>
          <h2>Vì sao nên đặt vắc xin tại VaxCare</h2>
          <p>Toàn bộ vắc xin được nhập khẩu chính hãng, bảo quản đạt chuẩn GSP và đồng bộ hồ sơ tại mọi cơ sở.</p>
        </div>
        <div className="why-grid">
          <div className="card why-card">
            <div className="why-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h4>Vắc xin chính hãng</h4>
            <p>Nhập khẩu trực tiếp từ nhà sản xuất, có đầy đủ giấy tờ kiểm định.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M8 3v4M16 3v4M3 10h18" />
              </svg>
            </div>
            <h4>Đặt lịch linh hoạt</h4>
            <p>Chọn khung giờ phù hợp, AI tự động đề xuất thời điểm tối ưu.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3a9 9 0 1 0 9 9" />
                <path d="M12 3v9h9" />
              </svg>
            </div>
            <h4>Hồ sơ điện tử</h4>
            <p>Lưu trữ và tra cứu chứng nhận tiêm chủng mọi lúc, mọi nơi.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h4>Hơn 120 cơ sở</h4>
            <p>Đồng bộ hồ sơ tiêm chủng trên toàn hệ thống, tiêm ở đâu cũng tiện.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
