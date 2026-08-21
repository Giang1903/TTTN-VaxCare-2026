// ============ VACCINATION TIMELINE ============
export default function VaccinationTimeline({ items = [], loading, onOpenShotDetail }) {
  return (
    <div className="timeline-card">
      <div className="timeline-head">
        <h2>Lịch sử tiêm chủng</h2>
      </div>
      <div className="timeline-body">
        {loading && (
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', padding: '12px 0' }}>
            Đang tải lịch sử…
          </p>
        )}
        {!loading && items.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', padding: '12px 0' }}>
            Chưa có mũi tiêm nào trong hồ sơ.
          </p>
        )}
        {!loading &&
          items.map((item, idx) => (
            <div className="timeline-item" key={`${item.title}-${item.date}-${idx}`}>
              <div className="timeline-dot" data-type={item.tag?.type || 'done'} />
              <div className="timeline-content">
                <div className="timeline-top">
                  <h4>{item.title}</h4>
                  {item.tag && (
                    <span className={`timeline-tag ${item.tag.type}`}>{item.tag.text}</span>
                  )}
                </div>
                {item.lines?.map((l) => (
                  <p key={l} className="timeline-line">
                    {l}
                  </p>
                ))}
                <div className="timeline-meta">
                  <span>{item.date}</span>
                  {item.meta && <span>· {item.meta}</span>}
                </div>
                {item.shot && (
                  <button
                    type="button"
                    className="timeline-detail-btn"
                    onClick={() => onOpenShotDetail?.(item.shot)}
                  >
                    Chi tiết mũi tiêm
                  </button>
                )}
                {item.actions?.map((act) =>
                  act.to ? (
                    <a key={act.label} href={act.to} className="timeline-detail-btn">
                      {act.label}
                    </a>
                  ) : null,
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}