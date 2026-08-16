import { Link } from 'react-router-dom';

// ============ CTA (Support) ============
export default function SupportCTA() {
  return (
    <section className="cta">
      <div className="wrap">
        <div className="cta-box">
          <div className="cta-content">
            <h3>Chưa có tài khoản?</h3>
            <p>Đăng ký miễn phí để đặt lịch tiêm và quản lý hồ sơ điện tử ngay hôm nay.</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
              <Link to="/register" className="btn btn-primary">
                Đăng ký ngay
              </Link>
              <Link to="/" className="btn btn-ghost">
                Về trang chủ
              </Link>
            </div>
          </div>
          <div className="cta-visual">
            <img src="/assets/logo-y-te.jpg" alt="Bác sĩ VaxCare" />
          </div>
        </div>
      </div>
    </section>
  );
}
