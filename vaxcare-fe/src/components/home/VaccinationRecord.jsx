import { Link } from 'react-router-dom';
// ============ ELECTRONIC VACCINATION RECORD ============
export default function VaccinationRecord() {
  return (
    <section className="record">
      <div className="wrap">
        <div className="record-grid">
          <div className="record-visual">
            <div className="record-mock" style={{position: 'relative'}}>
              <span
                className="badge"
                style={{position: 'absolute', top: '16px', right: '16px', background: 'rgba(255, 255, 255, 0.18)', color: '#fff'}}
                >Ví dụ minh hoạ</span
              >
              <div className="rm-head">
                <div style={{fontFamily: 'var(--font-display)', fontWeight: '700'}}>
                  Hồ sơ tiêm chủng
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <rect x="3" y="8" width="18" height="9" rx="2" />
                  <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div className="record-stats">
                <div className="record-stat">
                  <div className="n">12</div>
                  <div className="l">Tổng số mũi đã tiêm</div>
                </div>
                <div className="record-stat">
                  <div className="n">15/09</div>
                  <div className="l">Mũi tiếp theo</div>
                </div>
              </div>
              <div className="record-list-mini">
                <div className="record-row-mini">
                  <span>Vắc xin Cúm mùa</span><span>✓ Hoàn thành</span>
                </div>
                <div className="record-row-mini">
                  <span>Vắc xin HPV – Mũi 1</span><span>✓ Hoàn thành</span>
                </div>
                <div className="record-row-mini">
                  <span>Vắc xin HPV – Mũi 2</span><span>Sắp tới</span>
                </div>
              </div>
            </div>
            <div className="qr-card-side">
              <div className="qr-box"></div>
              <div>
                <div className="fc-title">Chứng nhận tiêm chủng</div>
                <div className="fc-sub">Scan QR để xác thực</div>
              </div>
            </div>
          </div>
          <div className="record-content">
            <span className="eyebrow"><span className="dot"></span>Hồ sơ điện tử</span>
            <h2>Hồ sơ tiêm chủng<br />luôn bên bạn</h2>
            <p
              className="lead"
              style={{color: 'var(--gray-500)', fontSize: '16px', maxWidth: '480px'}}
            >
              Toàn bộ lịch sử tiêm chủng và chứng nhận được lưu trữ tập trung.
              Đăng nhập để tra cứu hồ sơ của riêng bạn — ví dụ minh hoạ bên cạnh
              cho thấy hồ sơ sẽ trông như thế nào.
            </p>
            <ul className="check-list">
              <li>
                <span className="ico"
                  ><svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M20 6 9 17l-5-5" /></svg
                ></span>
                <div>
                  <b>Lịch sử tiêm chủng</b
                  ><span>Đầy đủ theo từng mũi tiêm, cơ sở, thời gian</span>
                </div>
              </li>
              <li>
                <span className="ico"
                  ><svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M20 6 9 17l-5-5" /></svg
                ></span>
                <div>
                  <b>Phác đồ tiêm chủng</b
                  ><span>Theo dõi tiến độ hoàn thành từng phác đồ</span>
                </div>
              </li>
              <li>
                <span className="ico"
                  ><svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M20 6 9 17l-5-5" /></svg
                ></span>
                <div>
                  <b>Chứng nhận điện tử</b
                  ><span>Xác thực qua mã QR, xuất PDF nhanh chóng</span>
                </div>
              </li>
            </ul>
            <Link to="/login" className="btn btn-ghost"
              >Đăng nhập để xem hồ sơ của bạn</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
