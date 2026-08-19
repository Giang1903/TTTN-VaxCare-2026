import { Link, useLocation } from 'react-router-dom';

// ============ NAVBAR (LOGGED IN) ============
// Chuyển từ <header class="navbar"> dùng chung trong dashboard.html,
// my-appointments.html, my-record.html, booking.html.
export default function LoggedInNavbar({ onOpenMobileNav, userName = 'Nguyễn Văn A' }) {
  const { pathname } = useLocation();

  const links = [
    { to: '/dashboard', label: 'Tổng quan' },
    { to: '/appointments', label: 'Lịch tiêm' },
    { to: '/record', label: 'Hồ sơ' },
    { to: '/vaccines', label: 'Vắc xin' },
    { to: '/facilities', label: 'Cơ sở' },
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
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
            <Link key={l.to} to={l.to} className={pathname === l.to ? 'active' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link to="/booking" className="btn btn-primary btn-sm">Đặt lịch ngay</Link>
          <div className="user-menu" id="userMenu">
            <span className="user-name">{userName}</span>
          </div>
          <button className="hamburger" style={{ display: 'none' }} aria-hidden="true" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
