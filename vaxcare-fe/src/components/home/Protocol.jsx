// ============ PROTOCOL + REMINDER ============
export default function Protocol() {
  return (
    <section className="protocol">
      <div className="wrap">
        <div className="protocol-layout">
          <div>
            <span className="eyebrow"
              ><span className="dot"></span>Phác đồ & nhắc lịch</span
            >
            <h2
              style={{fontSize: 'clamp(28px, 3.4vw, 38px)', fontWeight: '800', marginBottom: '14px'}}
            >
              Không bỏ lỡ<br />mũi tiêm tiếp theo
            </h2>
            <p
              style={{color: 'var(--gray-500)', fontSize: '15px', marginBottom: '26px', maxWidth: '440px'}}
            >
              Ví dụ minh hoạ một phác đồ tiêm — đăng nhập để VaxCare tự động
              theo dõi và nhắc lịch cho phác đồ của riêng bạn.
            </p>
            <div className="timeline">
              <div className="tl-item">
                <div className="tl-marker">
                  <div className="tl-dot done">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div className="tl-line"></div>
                </div>
                <div className="tl-body">
                  <h4>Mũi 1 — Vắc xin HPV</h4>
                  <span className="tl-status done">✓ Completed — 10/06/2026</span>
                </div>
              </div>
              <div className="tl-item">
                <div className="tl-marker">
                  <div className="tl-dot upcoming">2</div>
                  <div className="tl-line"></div>
                </div>
                <div className="tl-body">
                  <h4>Mũi 2 — Vắc xin HPV</h4>
                  <span className="tl-status upcoming"
                    >Upcoming — dự kiến 15/09/2026</span
                  >
                </div>
              </div>
              <div className="tl-item">
                <div className="tl-marker">
                  <div className="tl-dot upcoming">3</div>
                </div>
                <div className="tl-body">
                  <h4>Mũi 3 — Vắc xin HPV</h4>
                  <span className="tl-status upcoming"
                    >Upcoming — dự kiến 15/03/2027</span
                  >
                </div>
              </div>
            </div>
          </div>
          <div className="notif-mock">
            <div className="bell">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </div>
            <div>
              <b>🔔 Sắp đến lịch tiêm</b>
              <p>
                Mũi tiêm tiếp theo của bạn dự kiến vào
                <strong>15/09/2026</strong>. Hãy sắp xếp thời gian để không bỏ
                lỡ phác đồ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
