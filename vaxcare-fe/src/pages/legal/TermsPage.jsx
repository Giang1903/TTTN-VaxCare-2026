import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px 60px', lineHeight: 1.65, color: '#1f2937' }}>
      <Link to="/register" style={{ color: '#0d9488', fontWeight: 600, textDecoration: 'none' }}>
        ← Quay lại đăng ký
      </Link>
      <h1 style={{ marginTop: 20, fontSize: 28 }}>Điều khoản sử dụng VaxCare</h1>
      <p style={{ color: '#6b7280', fontSize: 14 }}>Cập nhật: 10/09/2026 · Áp dụng cho người dùng hệ thống VaxCare</p>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>1. Chấp nhận điều khoản</h2>
      <p>
        Khi đăng ký và sử dụng VaxCare, bạn đồng ý tuân thủ các điều khoản này. Nếu không đồng ý,
        vui lòng không tạo tài khoản hoặc ngừng sử dụng dịch vụ.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>2. Mô tả dịch vụ</h2>
      <p>
        VaxCare là hệ thống hỗ trợ đặt lịch tiêm chủng, theo dõi hồ sơ tiêm, nhận thông báo nhắc
        lịch và khai báo phản ứng sau tiêm tại các cơ sở đối tác. Thông tin y tế trên hệ thống chỉ
        mang tính hỗ trợ quản lý, không thay thế tư vấn trực tiếp của bác sĩ.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>3. Tài khoản người dùng</h2>
      <ul>
        <li>Bạn cam kết cung cấp thông tin đúng, đầy đủ khi đăng ký và cập nhật hồ sơ.</li>
        <li>Bảo mật email, mật khẩu; không chia sẻ tài khoản cho người khác.</li>
        <li>Chịu trách nhiệm với các hoạt động thực hiện dưới tài khoản của mình.</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>4. Đặt lịch và thanh toán</h2>
      <ul>
        <li>Lịch hẹn chỉ được xác nhận sau khi hoàn tất thanh toán (nếu có phí) theo hướng dẫn trên hệ thống.</li>
        <li>Việc hủy / đổi lịch phải tuân thủ quy định thời gian của VaxCare và từng cơ sở.</li>
        <li>Phí đã thanh toán có thể không được hoàn trong một số trường hợp hủy muộn (theo thông báo trên app).</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>5. Hành vi bị cấm</h2>
      <ul>
        <li>Cung cấp thông tin giả mạo, can thiệp trái phép hệ thống.</li>
        <li>Sử dụng dịch vụ cho mục đích gian lận, spam hoặc gây hại cho người khác.</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>6. Giới hạn trách nhiệm</h2>
      <p>
        VaxCare nỗ lực duy trì hệ thống ổn định nhưng không cam kết không gián đoạn. Các quyết định
        tiêm chủng, chống chỉ định do nhân viên y tế tại cơ sở chịu trách nhiệm chuyên môn.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>7. Thay đổi điều khoản</h2>
      <p>
        VaxCare có thể cập nhật điều khoản; phiên bản mới sẽ được công bố trên website/app. Việc
        tiếp tục sử dụng sau khi cập nhật được xem như chấp nhận thay đổi.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 28 }}>8. Liên hệ</h2>
      <p>
        Hỗ trợ: <strong>vaxcare2026@gmail.com</strong> · Qua mục Hỗ trợ trên website.
      </p>

      <p style={{ marginTop: 32 }}>
        Xem thêm: <Link to="/privacy" style={{ color: '#0d9488' }}>Chính sách bảo mật</Link>
      </p>
    </div>
  );
}
