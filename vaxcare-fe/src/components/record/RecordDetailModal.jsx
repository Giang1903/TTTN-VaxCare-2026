import VxModal from './VxModal';
import { profile, profileStats, recordDetailSummary } from '../../mockdata/record';

// ============ MODAL: Hồ sơ chi tiết ============
export default function RecordDetailModal({ open, onClose, displayName }) {
  return (
    <VxModal
      open={open}
      onClose={onClose}
      titleId="recordDetailTitle"
      title="Hồ sơ tiêm chủng chi tiết"
      large
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
          <button type="button" className="btn btn-primary" onClick={() => alert('Demo: Đã tải file PDF hồ sơ tổng hợp.')}>Tải PDF tổng hợp</button>
        </>
      }
    >
      <div className="record-detail-header">
        <div className="profile-av" style={{ width: '56px', height: '56px', fontSize: '18px' }}>NA</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '18px' }}>{displayName}</div>
          <div style={{ color: 'var(--gray-500)', fontSize: '13px', marginTop: '2px' }}>
            {profile.idNumber} · Sinh {profile.dob} · {profile.city}
          </div>
          <div style={{ marginTop: '6px' }}>
            <span className="profile-verified" style={{ fontSize: '12px' }}>Hồ sơ đã xác thực</span>
          </div>
        </div>
      </div>

      <div className="record-detail-stats">
        {profileStats.map((s) => (
          <div key={s.l}><strong>{s.n}</strong><span>{s.l}</span></div>
        ))}
      </div>

      <h4 style={{ margin: '18px 0 10px', fontSize: '15px' }}>Tóm tắt lịch sử tiêm</h4>
      <ul className="record-detail-list">
        {recordDetailSummary.map((r) => (
          <li key={r.name}><span>{r.name}</span><span>{r.meta}</span></li>
        ))}
      </ul>
      <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '14px' }}>
        Mã hồ sơ: <strong>{profile.recordCode}</strong> · Cập nhật lần cuối: {profile.updatedAt}
      </p>
    </VxModal>
  );
}
