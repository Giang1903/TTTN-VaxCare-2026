import { useState } from 'react';

const CHECK_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Danh sách bước tiêm được TÍNH TOÁN từ requiredDoses/doseIntervalDays thật của vắc xin,
// không phải nội dung dựng sẵn cho riêng một vắc xin cụ thể.
function buildDoseSteps(vaccine) {
  const doses = vaccine.requiredDoses || 1;
  const interval = vaccine.doseIntervalDays;
  const steps = [];
  for (let i = 1; i <= doses; i += 1) {
    if (i === 1) {
      steps.push({ title: 'Liều thứ 1', desc: 'Mũi tiêm đầu tiên theo chỉ định của bác sĩ.' });
    } else if (interval) {
      steps.push({
        title: `Liều thứ ${i}`,
        desc: `Cách liều trước đó khoảng ${interval} ngày.`,
      });
    } else {
      steps.push({ title: `Liều thứ ${i}`, desc: 'Theo phác đồ được bác sĩ tư vấn.' });
    }
  }
  return steps;
}

const TABS = [
  { id: 'mota', label: 'Mô tả chi tiết' },
  { id: 'lichtiem', label: 'Lịch tiêm chủng' },
  { id: 'luuy', label: 'Lưu ý sau tiêm' },
];

// ============ DETAIL TABS ============
export default function DetailTabs({ vaccine }) {
  const [activeTab, setActiveTab] = useState('mota');
  const doseSteps = buildDoseSteps(vaccine);

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
          <h3>Về {vaccine.vaccineName}</h3>
          <p>{vaccine.description || 'Thông tin mô tả chi tiết đang được cập nhật.'}</p>
          <ul className="bullet-list">
            <li>
              {CHECK_ICON}
              Phòng bệnh: {vaccine.targetDisease || 'Đang cập nhật'}
            </li>
            <li>
              {CHECK_ICON}
              Nhà sản xuất: {vaccine.manufacturer || 'Đang cập nhật'}
            </li>
          </ul>
        </div>

        <div className={'detail-tab-panel' + (activeTab === 'lichtiem' ? ' active' : '')}>
          <h3>Phác đồ tiêm</h3>
          <div className="tl-list">
            {doseSteps.map((step, i) => (
              <div className="tl-item" key={step.title}>
                <div className="tl-dot">{i + 1}</div>
                <div className="tl-content">
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={'detail-tab-panel' + (activeTab === 'luuy' ? ' active' : '')}>
          <div className="warn-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            <p>Sau tiêm, người tiêm cần ở lại cơ sở y tế theo dõi tối thiểu 30 phút để phát hiện sớm phản ứng bất thường (nếu có).</p>
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
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-500)' }}>
            Thông tin mang tính tham khảo chung, không thay thế tư vấn của bác sĩ. Vui lòng trao đổi trực tiếp với
            nhân viên y tế tại cơ sở tiêm về tình trạng sức khỏe cụ thể của bạn.
          </p>
        </div>
      </div>
    </section>
  );
}
