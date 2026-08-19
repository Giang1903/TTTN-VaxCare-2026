import { Link } from 'react-router-dom';
import { profile, profileStats } from '../../mockdata/record';

const STAT_ICONS = [
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>,
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" /></svg>,
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
];

// ============ PROFILE HEADER ============
export default function ProfileHeader({ displayName, onOpenDetail, onOpenEdit }) {
  return (
    <div className="profile-shell">
      <div className="profile-main">
        <div className="profile-row">
          <div className="profile-av">NA</div>
          <div className="profile-text">
            <h1>{displayName}</h1>
            <div className="profile-chips">
              <span className="profile-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                {profile.dob}
              </span>
              <span className="profile-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                {profile.city}
              </span>
              <span className="profile-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
                {profile.idNumber}
              </span>
            </div>
            <span className="profile-verified">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" /><path d="m9 12 2 2 4-4" /></svg>
              Hồ sơ đã xác thực
            </span>
          </div>
        </div>
        <div className="profile-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenDetail}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: '-2px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></svg>
            Xem hồ sơ chi tiết
          </button>
          <button type="button" className="btn btn-ghost" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={onOpenEdit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px', verticalAlign: '-2px' }}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            Chỉnh sửa hồ sơ
          </button>
          <Link to="/booking" className="btn btn-ghost" style={{ fontSize: '13px', padding: '8px 16px' }}>Đặt lịch tiêm mới</Link>
        </div>
      </div>

      <div className="profile-stats-panel">
        {profileStats.map((s, i) => (
          <div className="pstat" key={s.l}>
            <div className="ico">{STAT_ICONS[i]}</div>
            <div className="n">{s.n}</div>
            <div className="l">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
