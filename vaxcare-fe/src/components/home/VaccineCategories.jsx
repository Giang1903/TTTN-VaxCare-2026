// ============ VACCINE CATEGORIES ============
export default function VaccineCategories() {
  return (
    <section className="categories" id="vaccines">
      <div className="wrap">
        <div
          className="section-head center"
          style={{marginLeft: 'auto', marginRight: 'auto'}}
        >
          <span
            className="eyebrow"
            style={{marginLeft: 'auto', marginRight: 'auto', display: 'table'}}
            ><span className="dot"></span>Danh mục</span
          >
          <h2>Khám phá vắc xin</h2>
          <p>
            Tra cứu thông tin vắc xin theo độ tuổi và đối tượng khuyến nghị.
          </p>
        </div>
        <div className="cat-grid">
          <div className="card cat-card">
            <div className="cat-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
              </svg>
            </div>
            <h4>Trẻ em</h4>
            <p>Phác đồ tiêm chủng mở rộng theo từng giai đoạn phát triển.</p>
            <span className="arrow-link"
              ><svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" /></svg
            ></span>
          </div>
          <div className="card cat-card">
            <div className="cat-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="8" r="5" />
              </svg>
            </div>
            <h4>Người trưởng thành</h4>
            <p>Bổ sung miễn dịch và phòng ngừa bệnh theo môi trường sống.</p>
            <span className="arrow-link"
              ><svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" /></svg
            ></span>
          </div>
          <div className="card cat-card">
            <div className="cat-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M12 21c-4-3-8-6.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4.5-4 8-8 11Z"
                />
              </svg>
            </div>
            <h4>Người cao tuổi</h4>
            <p>Tăng cường đề kháng, giảm nguy cơ biến chứng do bệnh lý nền.</p>
            <span className="arrow-link"
              ><svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" /></svg
            ></span>
          </div>
          <div className="card cat-card">
            <div className="cat-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M9 8h6M9 12h6M9 16h3" />
              </svg>
            </div>
            <h4>Vắc xin theo bệnh</h4>
            <p>Tra cứu vắc xin phù hợp theo từng nhóm bệnh cụ thể.</p>
            <span className="arrow-link"
              ><svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" /></svg
            ></span>
          </div>
        </div>
      </div>
    </section>
  );
}
