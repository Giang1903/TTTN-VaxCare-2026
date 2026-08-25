import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ============ MOBILE / SLIDE NAV ============
export default function MobileNavPanel({ isOpen, onClose, userName: userNameProp }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userName = userNameProp || user?.fullName || user?.email || 'Người dùng';

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || 'U';

  function handleLogout(e) {
    e.preventDefault();
    onClose?.();
    logout();
    navigate('/login', { replace: true });
  }

  const navItem = (to, dataNav, label, icon) => (
    <Link to={to} className={pathname === to ? 'active' : undefined} onClick={onClose}>
      {icon}
      {label}
    </Link>
  );

  return (
    <div className={`mobile-nav-overlay${isOpen ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="mobile-nav-panel" role="dialog" aria-label="Menu điều hướng">
        <div className="mobile-nav-head">
          <div className="mn-user">
            <div className="mn-av">{initials}</div>
            <div>
              <div className="mn-name">{userName}</div>
              <div className="mn-role">{user?.email || 'Tài khoản cá nhân'}</div>
            </div>
          </div>
          <button type="button" className="mobile-nav-close" aria-label="Đóng menu" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="mobile-nav-links">
          {navItem('/dashboard', 'dashboard', 'Tổng quan',
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>)}
          {navItem('/booking', 'booking', 'Đặt lịch tiêm',
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M12 14v4M10 16h4" /></svg>)}
          {navItem('/appointments', 'appointments', 'Lịch tiêm',
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>)}
          {navItem('/record', 'record', 'Hồ sơ',
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>)}
          {navItem('/vaccines', 'vaccine', 'Vắc xin',
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" /></svg>)}
          {navItem('/facilities', 'facility', 'Cơ sở',
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" /></svg>)}
          <div className="mn-sep"></div>
          <Link to="/support" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></svg>
            Hỗ trợ
          </Link>
          <Link to="/about" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            Giới thiệu
          </Link>
          <div className="mn-sep"></div>
          <Link
            to="/login"
            className="danger"
            onClick={(e) => {
              e.preventDefault();
              handleLogout(e);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Đăng xuất
          </Link>
        </nav>
      </div>
    </div>
  );
}
