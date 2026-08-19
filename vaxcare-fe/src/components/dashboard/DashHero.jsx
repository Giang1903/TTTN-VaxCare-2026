import { Link } from 'react-router-dom';

// ============ DASH HERO ============
export default function DashHero({ userName = 'Nguyễn Văn A' }) {
  return (
    <section className="dash-hero">
      <div className="vx-blob-field">
        <span className="vx-blob b1"></span>
        <span className="vx-blob b2"></span>
        <span className="vx-blob b3"></span>
      </div>
      <div className="wrap">
        <div className="dash-welcome">
          <div>
            <h1>Xin chào, {userName} 👋</h1>
            <p>Bạn có <strong>1 lịch tiêm</strong> sắp tới và <strong>12 mũi</strong> đã hoàn thành.</p>
          </div>
          <div className="dash-actions">
            <Link to="/booking" className="btn btn-primary">Đặt lịch mới</Link>
            <Link to="/record" className="btn btn-on-dark">Xem hồ sơ đầy đủ</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
