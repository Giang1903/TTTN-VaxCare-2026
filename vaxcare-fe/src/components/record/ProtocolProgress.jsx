// ============ PROTOCOL PROGRESS ============
export default function ProtocolProgress({ protocols = [] }) {
  if (!protocols.length) {
    return (
      <div className="protocol-section">
        <div className="protocol-head">
          <h2>Phác đồ đang theo dõi</h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
          Chưa có phác đồ nào được ghi nhận. Lịch sử tiêm sẽ xuất hiện tại đây sau khi bạn hoàn
          thành mũi tiêm.
        </p>
      </div>
    );
  }

  return (
    <div className="protocol-section">
      <div className="protocol-head">
        <h2>Phác đồ đang theo dõi</h2>
      </div>
      <div className="protocol-list">
        {protocols.map((p) => (
          <div className="protocol-item" key={p.key}>
            <div className="protocol-top">
              <span className="protocol-name">{p.name}</span>
              <span className="protocol-pct">{p.pct}</span>
            </div>
            <div className="protocol-bar">
              <div className="protocol-fill" style={{ width: p.width }} />
            </div>
            {p.sub && <p className="protocol-sub">{p.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}