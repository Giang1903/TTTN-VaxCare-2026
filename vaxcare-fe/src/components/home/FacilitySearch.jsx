import { Link } from 'react-router-dom';
// ============ FACILITY SEARCH ============
export default function FacilitySearch() {
  return (
    <section className="facility" id="facilities">
      <div className="wrap">
        <div
          className="section-head"
          style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', maxWidth: 'none'}}
        >
          <div>
            <span className="eyebrow"
              ><span className="dot"></span>Mạng lưới cơ sở</span
            >
            <h2>Tìm cơ sở tiêm chủng</h2>
            <p>Lựa chọn cơ sở gần bạn với thông tin lịch hoạt động rõ ràng.</p>
          </div>
          <Link to="/facilities" className="btn-link"
            >Xem tất cả cơ sở
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" /></svg
          ></Link>
        </div>
        <div className="fac-grid">
          <div className="fac-card">
            <div className="fac-media">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div className="fac-rate">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6z"
                  />
                </svg>
                4.8
              </div>
            </div>
            <div className="fac-body">
              <h3>VaxCare Quận 1</h3>
              <div className="fac-meta">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                </svg>
                12 Nguyễn Huệ, Q.1, TP.HCM
              </div>
              <div className="fac-meta">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                7:30 – 17:00, T2–CN
              </div>
              <div className="fac-foot">
                <span className="fac-slots">Còn 24 chỗ hôm nay</span>
                <Link to="/facilities" className="btn-link">Đặt lịch →</Link>
              </div>
            </div>
          </div>
          <div className="fac-card">
            <div className="fac-media">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div className="fac-rate">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6z"
                  />
                </svg>
                4.9
              </div>
            </div>
            <div className="fac-body">
              <h3>VaxCare Quận 7</h3>
              <div className="fac-meta">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                </svg>
                88 Nguyễn Lương Bằng, Q.7
              </div>
              <div className="fac-meta">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                7:00 – 18:00, T2–CN
              </div>
              <div className="fac-foot">
                <span className="fac-slots">Còn 15 chỗ hôm nay</span>
                <Link to="/facilities" className="btn-link">Đặt lịch →</Link>
              </div>
            </div>
          </div>
          <div className="fac-card">
            <div className="fac-media">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div className="fac-rate">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6z"
                  />
                </svg>
                4.7
              </div>
            </div>
            <div className="fac-body">
              <h3>VaxCare Thủ Đức</h3>
              <div className="fac-meta">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                </svg>
                200 Võ Văn Ngân, TP. Thủ Đức
              </div>
              <div className="fac-meta">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
                8:00 – 17:00, T2–T7
              </div>
              <div className="fac-foot">
                <span className="fac-slots">Còn 31 chỗ hôm nay</span>
                <Link to="/facilities" className="btn-link">Đặt lịch →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
