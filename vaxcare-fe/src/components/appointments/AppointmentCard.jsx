import { Link } from 'react-router-dom';

// ============ APPOINTMENT FULL CARD ============
export default function AppointmentCard({ appt }) {
  function handleQr(e) {
    e.preventDefault();
    alert('Demo: Hiển thị mã QR check-in');
  }

  function handleCancel() {
    if (confirm('Hủy lịch tiêm này?')) alert('Đã hủy (demo).');
  }

  return (
    <div className="appt-full-card" data-status={appt.status}>
      <div className="appt-date" style={appt.dateStyle}>
        <div className="d" style={appt.dayStyle}>{appt.day}</div>
        <div className="m" style={appt.monthStyle}>{appt.month}</div>
      </div>
      <div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>{appt.title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '4px' }}>{appt.line1}</p>
        {appt.line2 && <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{appt.line2}</p>}
        <p style={{ fontSize: '13px', marginTop: '8px' }}>
          <span className={`status-pill ${appt.status}`}>{appt.statusLabel}</span>
          {appt.id && <> · Mã lịch: <strong>{appt.id}</strong></>}
          {appt.cancelledNote && <> · {appt.cancelledNote}</>}
        </p>
      </div>

      {appt.status === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <a href="#" className="btn btn-primary btn-sm" onClick={handleQr}>Mã QR</a>
          <Link to="/facilities" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-600)' }}>Đổi lịch</Link>
          <button type="button" style={{ fontSize: '13px', color: 'var(--gray-500)' }} onClick={handleCancel}>Hủy lịch</button>
        </div>
      )}

      {appt.status === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <Link to="/record" className="btn btn-primary btn-sm">Xem chứng nhận</Link>
        </div>
      )}

      {appt.status === 'cancelled' && (
        <div>
          <Link to="/facilities" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-600)' }}>Đặt lại</Link>
        </div>
      )}
    </div>
  );
}
