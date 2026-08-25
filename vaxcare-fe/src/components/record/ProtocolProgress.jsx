import { Link } from 'react-router-dom';

// ============ PROTOCOL PROGRESS ============
export default function ProtocolProgress({ protocols = [] }) {
  return (
    <div className="protocol-section" style={{ marginBottom: 28 }}>
      <div className="section-title" style={{ marginBottom: 6 }}>
        <span className="dot-live" aria-hidden />
        Phác đồ đang theo dõi
      </div>
      <p className="section-desc" style={{ marginBottom: protocols.length ? 16 : 12 }}>
        Theo dõi tiến độ các mũi tiêm đã ghi nhận trên hệ thống.
      </p>

      {!protocols.length ? (
        <div
          className="protocol-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '36px 24px',
            gap: 10,
          }}
        >
          <div
            className="pc-icon hepb"
            style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 4 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
            </svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
            Chưa có phác đồ nào
          </div>
          <p className="pc-sub" style={{ maxWidth: 360, margin: 0, lineHeight: 1.5 }}>
            Lịch sử và tiến độ phác đồ sẽ xuất hiện tại đây sau khi bạn hoàn thành mũi tiêm tại cơ
            sở VaxCare.
          </p>
          <Link to="/booking" className="btn btn-primary btn-sm" style={{ marginTop: 10 }}>
            Đặt lịch tiêm
          </Link>
        </div>
      ) : (
        <div className="protocol-grid">
          {protocols.map((p) => (
            <div className="protocol-card" key={p.key}>
              <div className="pc-head">
                <h4>
                  <span className="pc-icon hepb">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
                    </svg>
                  </span>
                  {p.name}
                </h4>
                <span className="pc-pct">{p.pct}</span>
              </div>
              <div className="progress-bar">
                <span style={{ width: p.width || '0%' }} />
              </div>
              {p.sub && <p className="pc-sub">{p.sub}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
