import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ============ NAVBAR (LOGGED IN) ============
export default function LoggedInNavbar({ onOpenMobileNav }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userName = user?.fullName || user?.email || 'Người dùng';

  // eslint-disable-next-line no-unused-vars
  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const links = [
    { to: '/dashboard', label: 'Tổng quan', match: (p) => p === '/dashboard' },
    { to: '/appointments', label: 'Lịch tiêm', match: (p) => p === '/appointments' },
    { to: '/record', label: 'Hồ sơ', match: (p) => p === '/record' },
    {
      to: '/vaccines',
      label: 'Vắc xin',
      match: (p) => p === '/vaccines' || p.startsWith('/vaccines/'),
    },
    {
      to: '/facilities',
      label: 'Cơ sở',
      match: (p) => p === '/facilities' || p.startsWith('/facilities/'),
    },
  ];

  return (
    <header className="navbar">
      <div className="wrap">
        <div className="nav-left">
          <button
            type="button"
            className="nav-menu-btn"
            title="Menu"
            aria-label="Mở menu"
            onClick={onOpenMobileNav}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>

        <Link to="/dashboard" className="logo">
          <span className="logo-mark">
            <img src="/logo.png" alt="VaxCare logo" />
          </span>
          VaxCare
        </Link>

        <nav className="nav-menu">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={l.match(pathname) ? 'active' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link to="/booking" className="btn btn-primary btn-sm">
            Đặt lịch ngay
          </Link>
          <div className="user-menu" id="userMenu">
            <span className="user-name">{userName}</span>
          </div>
          <button
            className="hamburger"
            style={{ display: 'none' }}
            aria-hidden="true"
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}