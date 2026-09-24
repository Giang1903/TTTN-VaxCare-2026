import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px 60px', lineHeight: 1.65, color: '#1f2937' }}>
      <Link to="/register" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
        ← Quay lại đăng ký
      </Link>
      <h1 style={{ marginTop: 20, fontSize: 28 }}>Chính sách bảo mật VaxCare</h1>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Cập nhật: 10/09/2026 · Bảo vệ dữ liệu người dùng VaxCare</p>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>1. Phạm vi</h2>
      <p>
        Chính sách này mô tả cách VaxCare thu thập, sử dụng và bảo vệ thông tin cá nhân khi bạn
        đăng ký, đặt lịch tiêm và sử dụng các tính năng liên quan.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>2. Dữ liệu chúng tôi thu thập</h2>
      <ul>
        <li>
          <strong>Tài khoản:</strong> họ tên, email, số điện thoại, mật khẩu (đã mã hóa), ngày sinh,
          giới tính, địa chỉ (nếu cung cấp).
        </li>
        <li>
          <strong>Hồ sơ sức khỏe / tiêm chủng:</strong> lịch sử tiêm, phản ứng sau tiêm, ghi chú
          liên quan do bạn hoặc nhân viên y tế cập nhật.
        </li>
        <li>
          <strong>Giao dịch:</strong> thông tin thanh toán qua cổng (VD: VNPay) theo quy trình của
          đối tác; VaxCare không lưu số thẻ đầy đủ.
        </li>
        <li>
          <strong>Kỹ thuật:</strong> nhật ký truy cập, thiết bị, IP (phục vụ bảo mật và vận hành).
        </li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>3. Mục đích sử dụng</h2>
      <ul>
        <li>Tạo và quản lý tài khoản, xác thực đăng nhập.</li>
        <li>Đặt lịch, check-in, ghi nhận tiêm, gửi nhắc lịch / thông báo.</li>
        <li>Hỗ trợ cơ sở y tế xử lý phản ứng sau tiêm và chăm sóc người dùng.</li>
        <li>Cải thiện dịch vụ, thống kê nội bộ (có thể dạng tổng hợp, ẩn danh).</li>
        <li>Tuân thủ yêu cầu pháp lý khi có căn cứ.</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>4. Chia sẻ dữ liệu</h2>
      <p>Chúng tôi không bán dữ liệu cá nhân. Dữ liệu có thể được chia sẻ với:</p>
      <ul>
        <li>Cơ sở tiêm chủng / nhân viên y tế liên quan đến lịch hẹn của bạn.</li>
        <li>Đối tác thanh toán, gửi email (trong phạm vi cần thiết để cung cấp dịch vụ).</li>
        <li>Cơ quan nhà nước khi có yêu cầu hợp pháp.</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>5. Lưu trữ và bảo mật</h2>
      <ul>
        <li>Mật khẩu được băm (hash); truyền dữ liệu qua kết nối bảo mật khi triển khai production.</li>
        <li>Phân quyền USER / STAFF / ADMIN để hạn chế truy cập trái phép.</li>
        <li>Thời gian lưu theo nhu cầu vận hành và quy định áp dụng; bạn có thể yêu cầu cập nhật /
          xóa trong phạm vi hệ thống hỗ trợ.</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>6. Quyền của bạn</h2>
      <ul>
        <li>Xem và cập nhật hồ sơ trên ứng dụng.</li>
        <li>Yêu cầu hỗ trợ chỉnh sửa / hạn chế xử lý dữ liệu qua email hỗ trợ.</li>
        <li>Rút lại đồng ý bằng cách ngừng sử dụng và yêu cầu đóng tài khoản (theo quy trình).</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>7. Cookie / trình duyệt</h2>
      <p>
        Hệ thống có thể dùng bộ nhớ trình duyệt (token đăng nhập) để duy trì phiên. Bạn có thể xóa
        dữ liệu site trong cài đặt trình duyệt.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>8. Liên hệ</h2>
      <p>
        Câu hỏi về bảo mật dữ liệu: <strong>vaxcare2026@gmail.com</strong>
      </p>

      <p style={{ marginTop: 32 }}>
        Xem thêm: <Link to="/terms" style={{ color: '#0d9488' }}>Điều khoản sử dụng</Link>
      </p>
    </div>
  );
}
