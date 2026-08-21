import { Link } from 'react-router-dom';

// ============ DETAIL BREADCRUMB ============
export default function DetailBreadcrumb({ vaccineName }) {
  return (
    <section
      style={{
        background: 'linear-gradient(160deg, var(--teal-800) 0%, var(--teal-700) 45%, var(--teal-600) 100%)',
        padding: '20px 0',
      }}
    >
      <div className="wrap">
        <div className="breadcrumb" style={{ marginBottom: 0 }}>
          <Link to="/">Trang chủ</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <Link to="/vaccines">Vắc xin</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span className="current">{vaccineName}</span>
        </div>
      </div>
    </section>
  );
}
