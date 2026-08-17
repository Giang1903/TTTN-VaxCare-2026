import { Link } from 'react-router-dom';

// ============ SLIM HERO (breadcrumb-only) ============
// Chuyển từ <section class="page-hero" style="padding:14px 0 18px"> dùng
// chung trong my-appointments.html, my-record.html, booking.html.
export default function SlimPageHero({ currentLabel }) {
  return (
    <section className="page-hero" style={{ padding: '14px 0 18px' }}>
      <div className="vx-blob-field">
        <span className="vx-blob b1"></span>
        <span className="vx-blob b2"></span>
        <span className="vx-blob b3"></span>
      </div>
      <div className="wrap">
        <div className="breadcrumb">
          <Link to="/dashboard">Tổng quan</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 6l6 6-6 6" /></svg>
          <span className="current">{currentLabel}</span>
        </div>
      </div>
    </section>
  );
}
