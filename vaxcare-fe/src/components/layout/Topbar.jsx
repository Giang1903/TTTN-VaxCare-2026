import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ title, subtitle, searchPlaceholder, onSearch, showSearch = true }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const fullName = user?.fullName || 'Quản trị viên';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="topbar">
      <div className="tb-title">
        <h1>{title}</h1>
        {subtitle && <div className="date">{subtitle}</div>}
      </div>
      {showSearch && (
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder || 'Tìm kiếm…'}
            onChange={(e) => onSearch?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch?.(e.target.value);
            }}
          />
        </div>
      )}
      <button className="icon-btn" aria-label="Thông báo" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        <span className="dot" />
      </button>
      <div className="tb-profile">
        <div className="av">{initials || 'QT'}</div>
        <div>
          <div className="n">{fullName}</div>
          <div className="s">{user?.email || 'admin@vaxcare.vn'}</div>
        </div>
      </div>
      <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
        Đăng xuất
      </button>
    </header>
  );
}
