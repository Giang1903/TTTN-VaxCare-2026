import { Link } from 'react-router-dom';

const CATEGORIES = [
  {
    key: 'tre-em',
    match: 'Trẻ em',
    title: 'Trẻ em',
    desc: 'Phác đồ tiêm chủng mở rộng theo từng giai đoạn phát triển.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
  {
    key: 'truong-thanh',
    match: 'Người trưởng thành',
    title: 'Người trưởng thành',
    desc: 'Bổ sung miễn dịch và phòng ngừa bệnh theo môi trường sống.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="8" r="5" />
      </svg>
    ),
  },
  {
    key: 'cao-tuoi',
    match: 'Người cao tuổi',
    title: 'Người cao tuổi',
    desc: 'Tăng cường đề kháng, giảm nguy cơ biến chứng do bệnh lý nền.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'theo-benh',
    match: '',
    title: 'Vắc xin theo bệnh',
    desc: 'Tra cứu vắc xin phù hợp theo từng nhóm bệnh cụ thể.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M12 18v-6M9 15h6" />
      </svg>
    ),
  },
];

// ============ VACCINE CATEGORIES ============
export default function VaccineCategories() {
  return (
    <section className="categories" id="vaccines">
      <div className="wrap">
        <div className="section-head center" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          <span className="eyebrow" style={{ marginLeft: 'auto', marginRight: 'auto', display: 'table' }}>
            <span className="dot"></span>Danh mục
          </span>
          <h2>Khám phá vắc xin</h2>
          <p>Tra cứu thông tin vắc xin theo độ tuổi và đối tượng khuyến nghị.</p>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => {
            const to = c.match
              ? `/vaccines?category=${encodeURIComponent(c.match)}`
              : '/vaccines';
            return (
              <Link key={c.key} to={to} className="card cat-card cat-card-link">
                <div className="cat-icon">{c.icon}</div>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
                <span className="arrow-link">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}