import { Link } from 'react-router-dom';

// ============ CTA (About) ============
export default function AboutCTA() {
  return (
    <section className="cta" id="support">
      <div className="wrap">
        <div className="cta-box">
          <div className="cta-content">
            <h3>Sẵn sàng bắt đầu với VaxCare?</h3>
            <p>Đăng ký tài khoản để đặt lịch tiêm, quản lý hồ sơ điện tử và nhận nhắc lịch thông minh.</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
              <Link to="/register" className="btn btn-primary">
                Đăng ký miễn phí
              </Link>
              <Link to="/support" className="btn btn-ghost">
                Liên hệ hỗ trợ
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
