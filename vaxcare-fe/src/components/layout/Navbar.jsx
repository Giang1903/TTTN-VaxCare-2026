import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: '/vaccines', label: 'Vắc xin', match: (p) => p.startsWith('/vaccines') },
    { to: '/facilities', label: 'Cơ sở tiêm chủng', match: (p) => p.startsWith('/facilities') },
    { to: '/about', label: 'Giới thiệu', match: (p) => p === '/about' },
    { to: '/support', label: 'Hỗ trợ', match: (p) => p === '/support' },
  ];

  return (
    <header className="navbar">
      <div className="wrap">
        <Link to="/" className="logo">
          <span className="logo-mark">
            <img src="/logo.png" alt="VaxCare logo" />
          </span>
          VaxCare
        </Link>
        <nav className="nav-menu">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={l.match(pathname) ? 'active' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link to="/login" className="btn-text">Đăng nhập</Link>
          <Link to="/register" className="btn-text">Đăng ký</Link>
          <Link to="/login" className="btn btn-primary btn-sm">Đặt lịch ngay</Link>
          <button className="hamburger" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
  );
}