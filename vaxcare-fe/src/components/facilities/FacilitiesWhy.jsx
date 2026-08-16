// ============ WHY (Facilities) ============
export default function FacilitiesWhy() {
  return (
    <section className="why">
      <div className="wrap">
        <div className="section-head center" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          <span className="eyebrow" style={{ marginLeft: 'auto', marginRight: 'auto', display: 'inline-flex' }}>
            <span className="dot"></span>Trải nghiệm đồng nhất
          </span>
          <h2>Tiêm ở cơ sở nào cũng an tâm</h2>
          <p>Toàn bộ 12 cơ sở đều đồng bộ hồ sơ, quy trình và tiêu chuẩn bảo quản vắc xin như nhau.</p>
        </div>
        <div className="why-grid">
          <div className="card why-card">
            <div className="why-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3a9 9 0 1 0 9 9" />
                <path d="M12 3v9h9" />
              </svg>
            </div>
            <h4>Hồ sơ đồng bộ toàn hệ thống</h4>
            <p>Tiêm ở cơ sở nào, hồ sơ cũng được cập nhật và tra cứu được ở mọi nơi.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M8 3v4M16 3v4M3 10h18" />
              </svg>
            </div>
            <h4>Đặt lịch theo khung giờ</h4>
            <p>Chọn khung giờ còn trống, tránh chờ đợi lâu tại quầy.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h4>Đạt chuẩn bảo quản GSP</h4>
            <p>Vắc xin được bảo quản đúng nhiệt độ tại mọi cơ sở trong hệ thống.</p>
          </div>
          <div className="card why-card">
            <div className="why-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <h4>Hỗ trợ tại chỗ 24/7</h4>
            <p>Đường dây nóng 1900 6868 hỗ trợ đặt lịch và tư vấn quanh giờ hành chính.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
