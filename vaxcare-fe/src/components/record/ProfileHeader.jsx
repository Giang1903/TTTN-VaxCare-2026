const STAT_ICONS = [
  <svg key="1" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="M22 4 12 14.01l-3-3" />
  </svg>,
  <svg key="2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>,
  <svg key="3" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
  </svg>,
  <svg key="4" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>,
];

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDob(dob) {
  if (!dob) return 'Chưa cập nhật';
  const s = String(dob);
  if (s.includes('-')) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
  return s;
}

// ============ PROFILE HEADER ============
export default function ProfileHeader({
  profile,
  stats = [],
  onOpenDetail,
  onOpenEdit,
}) {
  const displayName = profile?.fullName || 'Người dùng';
  const dob = formatDob(profile?.dateOfBirth);
  const city = profile?.address || 'Chưa cập nhật địa chỉ';
  const phone = profile?.phone || 'Chưa có SĐT';

  return (
    <div className="profile-shell">
      <div className="profile-main">
        <div className="profile-row">
          <div className="profile-av">{initials(displayName)}</div>
          <div className="profile-text">
            <h1>{displayName}</h1>
            <div className="profile-chips">
              <span className="profile-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                {dob}
              </span>
              <span className="profile-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {city}
              </span>
              <span className="profile-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.35a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.75.34 1.54.57 2.35.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {phone}
              </span>
            </div>
            <span className="profile-verified">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Hồ sơ đã xác thực
            </span>
          </div>
        </div>
        <div className="profile-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenEdit}>
            Chỉnh sửa
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenDetail}>
            Chi tiết hồ sơ
          </button>
        </div>
      </div>

      <div className="profile-stats">
        {stats.map((s, i) => (
          <div className="profile-stat" key={s.l}>
            <div className="profile-stat-icon">{STAT_ICONS[i % STAT_ICONS.length]}</div>
            <div>
              <div className="n">{s.n}</div>
              <div className="l">{s.l}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}