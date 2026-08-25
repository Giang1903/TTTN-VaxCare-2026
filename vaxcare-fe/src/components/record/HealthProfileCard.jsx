function fmt(val, unit = '') {
  if (val === null || val === undefined || val === '') return '—';
  return `${val}${unit}`;
}

function bmi(heightCm, weightKg) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!h || !w || h <= 0) return null;
  const m = h / 100;
  const v = w / (m * m);
  if (!Number.isFinite(v)) return null;
  return v.toFixed(1);
}

function bmiLabel(bmiVal) {
  const v = Number(bmiVal);
  if (!v) return null;
  if (v < 18.5) return { text: 'Thiếu cân', color: '#0284c7' };
  if (v < 23) return { text: 'Bình thường', color: '#0d9f6e' };
  if (v < 25) return { text: 'Thừa cân', color: '#b45309' };
  return { text: 'Béo phì', color: '#c0392b' };
}

/**
 * Card hiển thị hồ sơ sức khỏe trên trang Record.
 * props.health: { height, weight, medicalHistory, allergies, healthNote|note, updatedAt }
 */
export default function HealthProfileCard({ health, onEdit }) {
  const height = health?.height;
  const weight = health?.weight;
  const medicalHistory = health?.medicalHistory;
  const allergies = health?.allergies;
  const note = health?.healthNote ?? health?.note;
  const bmiVal = bmi(height, weight);
  const label = bmiLabel(bmiVal);

  const hasAny =
    height != null ||
    weight != null ||
    (medicalHistory && String(medicalHistory).trim()) ||
    (allergies && String(allergies).trim()) ||
    (note && String(note).trim());

  return (
    <div style={{ marginBottom: '28px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          <span className="dot-live" aria-hidden />
          Hồ sơ sức khỏe
        </h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>
          {hasAny ? 'Cập nhật' : 'Thêm hồ sơ sức khỏe'}
        </button>
      </div>

      {!hasAny ? (
        <div
          className="protocol-card"
          style={{ padding: '20px 22px' }}
        >
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
            Chưa có thông tin sức khỏe. Bổ sung chiều cao, cân nặng, dị ứng và tiền sử bệnh để
            nhân viên y tế hỗ trợ tốt hơn khi tiêm.
          </p>
        </div>
      ) : (
        <div
          className="protocol-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        >
          <div className="protocol-card">
            <div className="pc-head">
              <h4>Chỉ số cơ thể</h4>
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Chiều cao</div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{fmt(height, ' cm')}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Cân nặng</div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{fmt(weight, ' kg')}</div>
              </div>
              {bmiVal && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>BMI</div>
                  <div style={{ fontSize: '20px', fontWeight: 800 }}>
                    {bmiVal}
                    {label && (
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: label.color,
                        }}
                      >
                        {label.text}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="protocol-card">
            <div className="pc-head">
              <h4>Dị ứng</h4>
            </div>
            <p className="pc-sub" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {(allergies && String(allergies).trim()) || 'Không ghi nhận'}
            </p>
          </div>

          <div className="protocol-card">
            <div className="pc-head">
              <h4>Tiền sử bệnh</h4>
            </div>
            <p className="pc-sub" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {(medicalHistory && String(medicalHistory).trim()) || 'Không ghi nhận'}
            </p>
          </div>

          <div className="protocol-card">
            <div className="pc-head">
              <h4>Ghi chú sức khỏe</h4>
            </div>
            <p className="pc-sub" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {(note && String(note).trim()) || '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}