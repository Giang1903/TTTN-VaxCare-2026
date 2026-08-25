import { Link } from 'react-router-dom';

// ============ VACCINATION TIMELINE ============
export default function VaccinationTimeline({ items = [], loading, onOpenShotDetail }) {
  return (
    <div
      className="timeline-card"
      style={{
        background: '#fff',
        border: '1px solid var(--gray-100)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-sm)',
        padding: '22px 22px 18px',
        minHeight: 200,
      }}
    >
      <div className="section-title" style={{ marginBottom: 6 }}>
        <span className="dot-live" aria-hidden />
        Lịch sử tiêm chủng
      </div>
      <p className="section-desc" style={{ marginBottom: 16 }}>
        Các mũi tiêm đã được ghi nhận trong hồ sơ của bạn.
      </p>

      <div className="timeline-body">
        {loading && (
          <div className="empty-state" style={{ padding: '28px 12px' }}>
            Đang tải lịch sử…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div
            className="empty-state"
            style={{
              padding: '32px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--teal-600)',
                marginBottom: 4,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
              Chưa có mũi tiêm nào
            </div>
            <p style={{ margin: 0, maxWidth: 320, lineHeight: 1.5, fontSize: 13.5 }}>
              Khi nhân viên y tế ghi nhận kết quả tiêm, lịch sử sẽ hiển thị tại đây kèm chứng nhận
              PDF.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/booking" className="btn btn-primary btn-sm">
                Đặt lịch tiêm
              </Link>
              <Link to="/appointments" className="btn btn-ghost btn-sm">
                Xem lịch hẹn
              </Link>
            </div>
          </div>
        )}

        {!loading &&
          items.map((item, idx) => (
            <div className="timeline-item" key={`${item.title}-${item.date}-${idx}`} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: idx === items.length - 1 ? 'none' : '1px solid var(--gray-100)' }}>
              <div
                className="timeline-dot"
                data-type={item.tag?.type || 'done'}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  marginTop: 6,
                  flexShrink: 0,
                  background: item.tag?.type === 'next' ? '#f59e0b' : 'var(--teal-600)',
                  boxShadow: item.tag?.type === 'next' ? '0 0 0 3px #fcd34d' : '0 0 0 3px rgba(91,138,224,0.25)',
                }}
              />
              <div className="timeline-content" style={{ flex: 1, minWidth: 0 }}>
                <div className="timeline-top" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{item.title}</h4>
                  {item.tag && (
                    <span className={`tl-tag ${item.tag.type === 'done' ? 'done' : 'next'}`}>
                      {item.tag.text}
                    </span>
                  )}
                </div>
                {item.lines?.map((l) => (
                  <p key={l} style={{ margin: '2px 0', fontSize: 13, color: 'var(--gray-500)' }}>
                    {l}
                  </p>
                ))}
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 6 }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{item.date}</span>
                  {item.meta && <span> · {item.meta}</span>}
                </div>
                {item.shot && (
                  <button
                    type="button"
                    className="timeline-detail-btn"
                    onClick={() => onOpenShotDetail?.(item.shot)}
                    style={{
                      marginTop: 8,
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--teal-600)',
                      cursor: 'pointer',
                    }}
                  >
                    Chi tiết mũi tiêm
                  </button>
                )}
                {item.actions?.map((act) =>
                  act.to ? (
                    <a
                      key={act.label}
                      href={act.to}
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        marginRight: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--teal-600)',
                      }}
                    >
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
