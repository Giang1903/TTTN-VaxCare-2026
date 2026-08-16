import { useState } from 'react';

const TABS = [
  { id: 'mota', label: 'Mô tả chi tiết' },
  { id: 'chidinh', label: 'Chỉ định & đối tượng' },
  { id: 'lichtiem', label: 'Lịch tiêm chủng' },
  { id: 'luuy', label: 'Lưu ý' },
  { id: 'faq', label: 'Câu hỏi thường gặp' },
];

const CHECK_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const FAQ_ITEMS = [
  {
    q: 'Vắc xin cúm có cần tiêm nhắc lại hằng năm không?',
    a: 'Có. Virus cúm biến đổi liên tục nên vắc xin được cập nhật thành phần mỗi năm, cần tiêm nhắc lại để duy trì hiệu quả bảo vệ.',
  },
  {
    q: 'Phụ nữ mang thai tiêm vắc xin cúm có an toàn không?',
    a: 'An toàn. Vắc xin cúm bất hoạt được khuyến cáo tiêm cho phụ nữ mang thai ở bất kỳ giai đoạn nào, giúp bảo vệ cả mẹ và bé trong 6 tháng đầu đời.',
  },
  {
    q: 'Có thể tiêm cùng lúc với vắc xin khác không?',
    a: 'Có thể tiêm cùng ngày với vắc xin khác nhưng ở vị trí tiêm khác nhau. Vui lòng thông báo với bác sĩ về các mũi tiêm gần đây để được tư vấn phù hợp.',
  },
];

function FaqItem({ item, open, onToggle }) {
  return (
    <div className={'faq-item' + (open ? ' open' : '')}>
      <div className="faq-q" onClick={onToggle}>
        {item.q}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <div className="faq-a">
        <p>{item.a}</p>
      </div>
    </div>
  );
}

// ============ DETAIL TABS ============
export default function DetailTabs() {
  const [activeTab, setActiveTab] = useState('mota');
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section className="detail-body">
      <div className="wrap">
        <div className="detail-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'detail-tab-btn' + (activeTab === t.id ? ' active' : '')}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={'detail-tab-panel' + (activeTab === 'mota' ? ' active' : '')}>
          <h3>Về Vắc xin Cúm mùa Influvac Tetra</h3>
          <p>
            Influvac Tetra là vắc xin cúm tứ giá bất hoạt, được Tổ chức Y tế Thế giới (WHO) khuyến cáo cập nhật
            thành phần hằng năm dựa trên chủng virus lưu hành phổ biến nhất. Vắc xin giúp cơ thể tạo kháng thể
            chống lại 4 chủng cúm mùa, giảm nguy cơ mắc bệnh và biến chứng nặng như viêm phổi, viêm phế quản.
          </p>
          <p>
            Đây là vắc xin được khuyến nghị tiêm nhắc lại mỗi năm một lần, đặc biệt quan trọng với trẻ nhỏ, người
            cao tuổi, phụ nữ mang thai và người có bệnh nền mạn tính.
          </p>
          <h3>Thành phần & cơ chế</h3>
          <ul className="bullet-list">
            <li>
              {CHECK_ICON}
              Kháng nguyên bề mặt virus cúm bất hoạt, tinh chế cao.
            </li>
            <li>
              {CHECK_ICON}
              Phòng đồng thời 2 chủng cúm A (H1N1, H3N2) và 2 chủng cúm B.
            </li>
            <li>
              {CHECK_ICON}
              Không chứa virus sống, không gây bệnh cúm sau tiêm.
            </li>
          </ul>
        </div>

        <div className={'detail-tab-panel' + (activeTab === 'chidinh' ? ' active' : '')}>
          <h3>Đối tượng nên tiêm</h3>
          <ul className="bullet-list">
            <li>
              {CHECK_ICON}
              Trẻ em từ 6 tháng tuổi đến dưới 9 tuổi (mũi đầu tiên tiêm 2 liều cách nhau tối thiểu 4 tuần).
            </li>
            <li>
              {CHECK_ICON}
              Người lớn, đặc biệt người trên 50 tuổi hoặc có bệnh nền tim mạch, hô hấp, tiểu đường.
            </li>
            <li>
              {CHECK_ICON}
              Phụ nữ đang mang thai (có thể tiêm ở bất kỳ giai đoạn thai kỳ nào).
            </li>
            <li>
              {CHECK_ICON}
              Nhân viên y tế và người thường xuyên tiếp xúc nơi đông người.
            </li>
          </ul>
          <h3>Chống chỉ định</h3>
          <ul className="bullet-list">
            <li>
              {CHECK_ICON}
              Người có tiền sử dị ứng nặng với thành phần vắc xin hoặc trứng gà.
            </li>
            <li>
              {CHECK_ICON}
              Đang sốt cao hoặc mắc bệnh cấp tính — nên hoãn tiêm và tư vấn bác sĩ.
            </li>
          </ul>
        </div>

        <div className={'detail-tab-panel' + (activeTab === 'lichtiem' ? ' active' : '')}>
          <h3>Phác đồ tiêm khuyến nghị</h3>
          <div className="tl-list">
            <div className="tl-item">
              <div className="tl-dot">1</div>
              <div className="tl-content">
                <h4>Mũi tiêm đầu tiên (trẻ dưới 9 tuổi)</h4>
                <p>Tiêm liều đầu tiên trong mùa cúm đầu tiên trẻ được tiêm.</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-dot">2</div>
              <div className="tl-content">
                <h4>Mũi tiêm thứ hai</h4>
                <p>Cách mũi đầu tối thiểu 4 tuần, chỉ áp dụng cho lần tiêm đầu đời.</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-dot">3</div>
              <div className="tl-content">
                <h4>Tiêm nhắc lại hằng năm</h4>
                <p>
                  Từ năm thứ 2 trở đi, tiêm 1 liều duy nhất mỗi năm để cập nhật kháng thể theo chủng cúm lưu hành
                  mới.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={'detail-tab-panel' + (activeTab === 'luuy' ? ' active' : '')}>
          <div className="warn-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            <p>Sau tiêm, người tiêm cần ở lại cơ sở y tế theo dõi tối thiểu 30 phút để phát hiện sớm phản ứng dị ứng (nếu có).</p>
          </div>
          <h3>Phản ứng sau tiêm thường gặp</h3>
          <ul className="bullet-list">
            <li>
              {CHECK_ICON}
              Đau, đỏ, sưng nhẹ tại vị trí tiêm, thường tự hết sau 1–2 ngày.
            </li>
            <li>
              {CHECK_ICON}
              Sốt nhẹ, mệt mỏi, đau đầu thoáng qua trong 24–48 giờ đầu.
            </li>
            <li>
              {CHECK_ICON}
              Hiếm gặp: phản ứng dị ứng nặng — cần đến ngay cơ sở y tế nếu có khó thở, nổi mề đay lan rộng.
            </li>
          </ul>
        </div>

        <div className={'detail-tab-panel' + (activeTab === 'faq' ? ' active' : '')}>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={item.q} item={item} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
