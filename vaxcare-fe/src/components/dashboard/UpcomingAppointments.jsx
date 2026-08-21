import { Link } from 'react-router-dom';

// ============ UPCOMING APPOINTMENTS (dash-card) ============
export default function UpcomingAppointments({ items = [], loading, onCancel, cancellingId }) {
  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <h3>Lịch tiêm sắp tới</h3>
        <Link to="/appointments">Xem tất cả →</Link>
      </div>
      <div className="dash-card-body">
        {loading && <div className="empty-state">Đang tải…</div>}
        {!loading && items.length === 0 && (
          <div className="empty-state">
            Bạn chưa có lịch tiêm nào sắp tới.{' '}
            <Link to="/booking" style={{ fontWeight: 600, color: 'var(--teal-600)' }}>
              Đặt lịch
            </Link>
          </div>
        )}
        {!loading &&
          items.map((a) => (
            <div className="appt-item" key={a.appointmentId ?? a.title}>
              <div className="appt-date" style={a.dateStyle}>
                <div className="d" style={a.dayStyle}>
                  {a.day}
                </div>
                <div className="m" style={a.monthStyle}>
                  {a.month}
                </div>
              </div>
              <div className="appt-info">
                <h4>{a.title}</h4>
                {a.lines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
                <span className={`appt-badge ${a.badge.type}`}>{a.badge.text}</span>
              </div>
              <div className="appt-actions">
                <Link to="/appointments">Chi tiết</Link>
                {a.cancelable && (
                  <button
                    type="button"
                    className="cancel"
                    disabled={cancellingId === a.appointmentId}
                    onClick={() => onCancel?.(a.appointmentId)}
                  >
                    {cancellingId === a.appointmentId ? 'Đang hủy…' : 'Hủy lịch'}
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}