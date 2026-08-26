import VxModal from './VxModal';
import { calcBmi, bmiCategory } from './HealthProfileCard';

function formatDob(dob) {
  if (!dob) return '—';
  const s = String(dob);
  if (s.includes('-')) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
  return s;
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============ MODAL: Hồ sơ chi tiết ============
export default function RecordDetailModal({
  open,
  onClose,
  profile,
  health,
  stats = [],
  summary = [],
  recordCode,
}) {
  const displayName = profile?.fullName || 'Người dùng';
  const code = recordCode || (profile?.userId != null ? `VC-${profile.userId}` : '—');

  return (
    <VxModal
      open={open}
      onClose={onClose}
      titleId="recordDetailTitle"
      title="Hồ sơ tiêm chủng chi tiết"
      large
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Đóng
        </button>
      }
    >
      <div className="record-detail-header">
        <div className="profile-av" style={{ width: '56px', height: '56px', fontSize: '18px' }}>
          {initials(displayName)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '18px' }}>{displayName}</div>
          <div style={{ color: 'var(--gray-500)', fontSize: '13px', marginTop: '2px' }}>
            {profile?.email || '—'} · Sinh {formatDob(profile?.dateOfBirth)} ·{' '}
            {profile?.address || 'Chưa cập nhật địa chỉ'}
          </div>
          <div style={{ marginTop: '6px' }}>
            <span className="profile-verified" style={{ fontSize: '12px' }}>
              Hồ sơ đã xác thực
            </span>
          </div>
        </div>
      </div>

      <div className="record-detail-stats">
        {stats.map((s) => (
          <div key={s.l}>
            <strong>{s.n}</strong>
            <span>{s.l}</span>
          </div>
        ))}
      </div>


      <h4 style={{ margin: '18px 0 10px', fontSize: '15px' }}>Hồ sơ sức khỏe</h4>
      <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, marginBottom: 8 }}>
        {(() => {
          const h = health || profile;
          const bmi = calcBmi(h?.height, h?.weight);
          const cat = bmiCategory(bmi);
          return (
            <>
              <div>Chiều cao: <strong>{h?.height != null ? `${h.height} cm` : '—'}</strong>
                {' · '}Cân nặng: <strong>{h?.weight != null ? `${h.weight} kg` : '—'}</strong>
                {' · '}BMI: <strong>{bmi != null ? bmi : '—'}</strong>
                {cat ? <span style={{ color: cat.color, fontWeight: 700 }}> ({cat.text})</span> : null}
              </div>
              <div>Dị ứng: {h?.allergies || '—'}</div>
              <div>Tiền sử bệnh: {h?.medicalHistory || '—'}</div>
              <div>Ghi chú: {h?.note || h?.healthNote || '—'}</div>
            </>
          );
        })()}
      </div>

      <h4 style={{ margin: '18px 0 10px', fontSize: '15px' }}>Tóm tắt lịch sử tiêm</h4>
      {summary.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>Chưa có mũi tiêm nào.</p>
      ) : (
        <ul className="record-detail-list">
          {summary.map((r) => (
            <li key={`${r.name}-${r.meta}`}>
              <span>{r.name}</span>
              <span>{r.meta}</span>
            </li>
          ))}
        </ul>
      )}
      <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '14px' }}>
        Mã hồ sơ: <strong>{code}</strong>
      </p>
    </VxModal>
  );
}