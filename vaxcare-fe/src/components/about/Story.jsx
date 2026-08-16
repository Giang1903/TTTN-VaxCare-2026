import { Link } from 'react-router-dom';

const STATS = [
  { value: '120+', label: 'Cơ sở tiêm chủng' },
  { value: '850K+', label: 'Người dùng tin tưởng' },
  { value: '98%', label: 'Độ chính xác đề xuất AI' },
  { value: '-42%', label: 'Thời gian chờ trung bình' },
];

// ============ STORY ============
export default function Story() {
  return (
    <section style={{ padding: '60px 0 80px', background: 'var(--mint-50)' }}>
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot"></span>Câu chuyện VaxCare
          </span>
          <h2>Từ ý tưởng đến mạng lưới hơn 120 cơ sở</h2>
          <p>VaxCare được thành lập với mong muốn giải quyết các điểm nghẽn trong công tác tiêm chủng: xếp hàng dài, hồ sơ giấy rời rạc và thiếu nhắc lịch.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '48px', alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: '16px', color: 'var(--gray-700)', lineHeight: 1.8, marginBottom: '20px' }}>
              Bắt đầu từ năm 2024, đội ngũ VaxCare kết hợp chuyên gia y tế công cộng, kỹ sư phần mềm và nhà khoa
              học dữ liệu để xây dựng hệ thống điều phối lịch tiêm thông minh. AI phân tích nhu cầu theo khung giờ,
              dự báo số chỗ trống và đề xuất lịch phù hợp với từng cá nhân.
            </p>
            <p style={{ fontSize: '16px', color: 'var(--gray-700)', lineHeight: 1.8, marginBottom: '20px' }}>
              Hiện nay, VaxCare đã kết nối hơn 120 cơ sở tiêm chủng trên toàn quốc, phục vụ hàng trăm nghìn người
              dùng với hồ sơ tiêm điện tử tập trung, check-in QR và nhắc lịch tự động.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Trải nghiệm ngay
            </Link>
          </div>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {STATS.map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--teal-600)', fontFamily: 'var(--font-display)' }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--gray-500)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
