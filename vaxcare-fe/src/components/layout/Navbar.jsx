import { Link } from 'react-router-dom';
export default function Navbar() {
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
          <Link to="/vaccines">Vắc xin</Link>
          <Link to="/facilities">Cơ sở tiêm chủng</Link>
          <Link to="/about">Giới thiệu</Link>
          <Link to="/support">Hỗ trợ</Link>
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
