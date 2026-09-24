import { Link } from 'react-router-dom';

const STATUS_STYLE = {
  overdue: {
    bg: 'rgba(239, 68, 68, 0.12)',
    color: '#dc2626',
    border: '1px solid rgba(239, 68, 68, 0.25)',
  },
  today: {
    bg: 'rgba(245, 158, 11, 0.14)',
    color: '#d97706',
    border: '1px solid rgba(245, 158, 11, 0.3)',
  },
  soon: {
    bg: 'rgba(59, 130, 246, 0.12)',
    color: '#2563eb',
    border: '1px solid rgba(59, 130, 246, 0.25)',
  },
  scheduled: {
    bg: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
    border: '1px solid rgba(16, 185, 129, 0.22)',
  },
};

function StatusBadge({ status }) {
  if (!status) return null;
  const s = STATUS_STYLE[status.kind] || STATUS_STYLE.scheduled;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.2,
        background: s.bg,
        color: s.color,
        border: s.border,
        whiteSpace: 'nowrap',
      }}
    >
      {status.kind === 'overdue' && '⚠ '}
      {status.label}
    </span>
  );
}

function AgeChip({ ageLabel, ageMatched, ageRangeLabel }) {
  if (!ageLabel && !ageRangeLabel) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
      }}
    >
      {ageLabel && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--gray-600, #4b5563)',
            background: 'var(--gray-50, #f9fafb)',
            border: '1px solid var(--gray-100, #f3f4f6)',
            borderRadius: 8,
            padding: '2px 8px',
          }}
          title="Độ tuổi tính từ ngày sinh trên hồ sơ"
        >
          Bạn: {ageLabel}
        </span>
      )}
      {ageMatched && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#0f766e',
            background: 'rgba(20, 184, 166, 0.12)',
            border: '1px solid rgba(20, 184, 166, 0.25)',
            borderRadius: 8,
            padding: '2px 8px',
          }}
        >
          ✓ Theo phác đồ độ tuổi
        </span>
      )}
      {ageRangeLabel && (
        <span
          style={{
            fontSize: 11,
            color: 'var(--gray-500, #6b7280)',
            padding: '2px 4px',
          }}
        >
          {ageRangeLabel}
        </span>
      )}
    </div>
  );
}

// ============ PROTOCOL PROGRESS ============
export default function ProtocolProgress({ protocols = [], dateOfBirthMissing = false }) {
  return (
    <div className="protocol-section" style={{ marginBottom: 28 }}>
      <div className="section-title" style={{ marginBottom: 6 }}>
        <span className="dot-live" aria-hidden />
        Phác đồ đang theo dõi
      </div>
      <p className="section-desc" style={{ marginBottom: protocols.length ? 16 : 12 }}>
        Tiến độ mũi tiêm và <strong>ngày mũi tiếp theo</strong> (ưu tiên phác đồ khớp độ tuổi trên hồ
        sơ).
      </p>

      {dateOfBirthMissing && protocols.length > 0 && (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            fontSize: 13,
            color: '#92400e',
            lineHeight: 1.45,
          }}
        >
          Chưa có <strong>ngày sinh</strong> trên hồ sơ — hệ thống chưa lọc phác đồ theo độ tuổi.
          Cập nhật hồ sơ để nhận lịch mũi tiếp theo chính xác hơn.
        </div>
      )}

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
              <div className="pc-head" style={{ alignItems: 'flex-start', gap: 8 }}>
                <h4 style={{ flex: 1, margin: 0 }}>
                  <span
                    className="pc-icon hepb"
                    style={{
                      backgroundColor: p.isCompleted ? 'rgba(16, 185, 129, 0.12)' : undefined,
                      color: p.isCompleted ? '#10b981' : undefined,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
                    </svg>
                  </span>
                  {p.name}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span
                    className="pc-pct"
                    style={{
                      color: p.isCompleted ? '#10b981' : 'var(--primary)',
                      fontWeight: 700,
                    }}
                  >
                    {p.pct}
                  </span>
                  {!p.isCompleted && p.status && <StatusBadge status={p.status} />}
                </div>
              </div>

              <div
                className="progress-bar"
                style={{ backgroundColor: p.isCompleted ? '#e6f4ea' : undefined }}
              >
                <span
                  style={{
                    width: p.width || '0%',
                    backgroundColor: p.isCompleted
                      ? '#10b981'
                      : p.status?.kind === 'overdue'
                        ? '#ef4444'
                        : 'var(--primary)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              {p.sub && (
                <p className="pc-sub" style={{ marginTop: 10, marginBottom: 0, lineHeight: 1.45 }}>
                  {p.sub}
                </p>
              )}

              {!p.isCompleted && (
                <AgeChip
                  ageLabel={p.ageLabel}
                  ageMatched={p.ageMatched}
                  ageRangeLabel={p.ageRangeLabel}
                />
              )}

              {!p.isCompleted && p.nextDate && (
                <div style={{ marginTop: 12 }}>
                  <Link
                    to="/booking"
                    className="btn btn-sm"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '6px 12px',
                      borderRadius: 10,
                      background:
                        p.status?.kind === 'overdue'
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(13, 148, 136, 0.1)',
                      color: p.status?.kind === 'overdue' ? '#dc2626' : 'var(--primary, #0d9488)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                    }}
                  >
                    {p.status?.kind === 'overdue' ? 'Đặt lịch bù mũi →' : 'Đặt lịch mũi tiếp theo →'}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}