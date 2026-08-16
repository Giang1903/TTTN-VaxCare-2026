import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'Làm thế nào để đặt lịch tiêm chủng trên VaxCare?',
    a: 'Đăng nhập hoặc đăng ký tài khoản → chọn vắc xin hoặc cơ sở → chọn khung giờ còn chỗ → xác nhận. Bạn sẽ nhận mã QR check-in và nhắc lịch trước ngày hẹn. Có thể đặt lịch cho bản thân hoặc người thân trong hồ sơ.',
  },
  {
    q: 'Tôi có thể hủy hoặc đổi lịch tiêm không?',
    a: 'Có. Vào mục "Lịch tiêm của tôi", chọn lịch cần hủy/đổi. Hủy trước ít nhất 2 giờ so với giờ hẹn để giải phóng chỗ cho người khác. Đổi lịch sẽ đưa bạn về bước chọn khung giờ mới tại cùng cơ sở hoặc cơ sở khác.',
  },
  {
    q: 'Hồ sơ tiêm điện tử có được công nhận không?',
    a: 'Hồ sơ trên VaxCare lưu trữ lịch sử tiêm, loại vắc xin, lô và cơ sở thực hiện. Bạn có thể tải chứng nhận PDF. Việc đồng bộ với hệ thống quốc gia phụ thuộc từng địa phương; vui lòng liên hệ hotline nếu cần hỗ trợ xuất dữ liệu.',
  },
  {
    q: 'AI đề xuất lịch tiêm hoạt động như thế nào?',
    a: 'Hệ thống phân tích lịch sử tiêm, khoảng cách giữa các mũi, sức chứa khung giờ của cơ sở gần bạn và ưu tiên thời gian bạn thường chọn. Đề xuất chỉ mang tính gợi ý; bạn luôn được tự chọn khung giờ khác.',
  },
  {
    q: 'Dữ liệu cá nhân có được bảo mật không?',
    a: 'VaxCare mã hóa dữ liệu nhạy cảm, hạn chế quyền truy cập theo vai trò và tuân thủ quy định bảo vệ dữ liệu cá nhân. Chúng tôi không bán thông tin người dùng. Chi tiết xem tại Chính sách bảo mật.',
  },
  {
    q: 'Tôi cần mang gì khi đến tiêm?',
    a: 'Mang theo CCCD/CMND hoặc giấy tờ tùy thân, mã QR check-in (trên app hoặc tin nhắn), và nếu tiêm cho trẻ em thì mang sổ tiêm chủng hoặc giấy khai sinh. Đến sớm 10–15 phút để làm thủ tục.',
  },
];

// ============ FAQ ============
export default function SupportFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="booking" style={{ padding: '60px 0 80px', background: 'var(--mint-50)' }}>
      <div className="wrap">
        <div className="section-head center">
          <span className="eyebrow">
            <span className="dot"></span>Câu hỏi thường gặp
          </span>
          <h2>Giải đáp thắc mắc nhanh</h2>
          <p>Những câu hỏi phổ biến về đặt lịch, hồ sơ và sử dụng VaxCare.</p>
        </div>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div className={'faq-item' + (openIndex === i ? ' open' : '')} key={item.q}>
              <button
                className="faq-q"
                type="button"
                aria-expanded={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
              >
                {item.q}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="faq-a">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
