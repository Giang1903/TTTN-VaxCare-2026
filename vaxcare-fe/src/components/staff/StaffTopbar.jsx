import { useAuth } from '../../context/AuthContext';

export default function StaffTopbar({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  showSearch = true,
}) {
  const { user } = useAuth();
  const fullName = user?.fullName || 'Nhân viên y tế';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header className="staff-topbar">
      <div className="tb-title">
        <h1>{title}</h1>
        {subtitle && <div className="date">{subtitle}</div>}
      </div>

      {showSearch && (
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
          <input
            type="search"
            placeholder={searchPlaceholder || 'Tìm kiếm...'}
            value={searchValue || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      )}

      <div className="tb-profile">
        <div className="av">{initials || 'NV'}</div>
        <div>
          <div className="n">{fullName}</div>
          <div className="s">Nhân viên y tế</div>
        </div>
      </div>
    </header>
  );
}
