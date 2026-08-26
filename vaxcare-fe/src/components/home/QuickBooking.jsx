import { Link } from 'react-router-dom';

// ============ QUICK BOOKING ============
export default function QuickBooking() {
  return (
    <div className="wrap quick-booking-wrap">
      <div className="quick-booking">
        <div className="qb-top">
          <h3>Tìm lịch tiêm phù hợp</h3>
          <div className="qb-note">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            AI sẽ hỗ trợ phân tích lịch và đề xuất khung giờ phù hợp
          </div>
        </div>
        <div className="qb-grid">
          <div className="field">
            <label>Vắc xin</label>
            <Link to="/booking" className="field-input" style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="8" width="18" height="9" rx="2" />
                <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Chọn vắc xin
            </Link>
          </div>
          <div className="field">
            <label>Cơ sở</label>
            <Link to="/booking" className="field-input" style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Chọn cơ sở
            </Link>
          </div>
          <div className="field">
            <label>Ngày</label>
            <Link to="/booking" className="field-input" style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M8 3v4M16 3v4M3 10h18" />
              </svg>
              Chọn ngày
            </Link>
          </div>
          <div className="field">
            <label>Khung giờ</label>
            <Link to="/booking" className="field-input" style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              Chọn giờ
            </Link>
          </div>
          <Link to="/booking" className="btn btn-primary qb-submit">
            Tìm lịch
          </Link>
        </div>
      </div>
    </div>
  );
}
