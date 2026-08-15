import { Link } from 'react-router-dom';
// ============ FOOTER ============
export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="footer-logo">
              <span className="logo-mark"
                ><img src="/logo.png" alt="VaxCare logo"
              /></span>
              VaxCare
            </div>
            <p style={{fontSize: '14px', maxWidth: '280px'}}>
              Nền tảng quản lý và điều phối hoạt động tiêm chủng thông minh, ứng
              dụng trí tuệ nhân tạo.
            </p>
          </div>
          <div className="footer-col">
            <h5>Sản phẩm</h5>
            <ul>
              <li><Link to="/login">Đặt lịch tiêm</Link></li>
              <li>
                <Link to="/vaccines">Tra cứu vắc xin</Link>
              </li>
              <li>
                <Link to="/facilities">Cơ sở tiêm chủng</Link>
              </li>
              <li><Link to="/login">Hồ sơ điện tử</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Công ty</h5>
            <ul>
              <li><Link to="/about">Giới thiệu</Link></li>
              <li><a href="#">Đối tác y tế</a></li>
              <li><a href="#">Tuyển dụng</a></li>
              <li><Link to="/support">Liên hệ</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Hỗ trợ</h5>
            <ul>
              <li>
                <Link to="/support#booking">Câu hỏi thường gặp</Link>
              </li>
              <li><a href="#">Chính sách bảo mật</a></li>
              <li><a href="#">Điều khoản sử dụng</a></li>
              <li><a href="#">Hotline: 1900 6868</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 VaxCare. Tất cả các quyền được bảo lưu.</span>
        </div>
      </div>
    </footer>
  );
}
