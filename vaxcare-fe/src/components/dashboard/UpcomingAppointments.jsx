import { Link } from 'react-router-dom';
import { upcomingAppointments } from '../../mockdata/dashboardData';

// ============ UPCOMING APPOINTMENTS (dash-card) ============
export default function UpcomingAppointments() {
  function handleCancel() {
    alert("Demo: Hủy lịch sẽ mở xác nhận.");
  }

  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <h3>Lịch tiêm sắp tới</h3>
        <Link to="/appointments">Xem tất cả →</Link>
      </div>
      <div className="dash-card-body">
        {upcomingAppointments.length === 0 && (
          <div className="empty-state">Bạn chưa có lịch tiêm nào sắp tới.</div>
        )}
        {upcomingAppointments.map((a) => (
          <div className="appt-item" key={a.title}>
            <div className="appt-date" style={a.dateStyle}>
              <div className="d" style={a.dayStyle}>{a.day}</div>
              <div className="m" style={a.monthStyle}>{a.month}</div>
            </div>
            <div className="appt-info">
              <h4>{a.title}</h4>
              {a.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
              <span className={`appt-badge ${a.badge.type}`}>{a.badge.text}</span>
            </div>
            <div className="appt-actions">
              {a.actions.detailTo && <Link to={a.actions.detailTo}>Chi tiết</Link>}
              {a.actions.bookTo && <Link to={a.actions.bookTo}>Đặt lịch</Link>}
              {a.actions.cancelable && (
                <button type="button" className="cancel" onClick={handleCancel}>Hủy lịch</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
