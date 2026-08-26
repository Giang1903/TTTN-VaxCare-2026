// eslint-disable-next-line react-refresh/only-export-components
export function calcBmi(heightCm, weightKg) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  const m = h / 100;
  const bmi = w / (m * m);
  return Math.round(bmi * 10) / 10;
}

// eslint-disable-next-line react-refresh/only-export-components
export function bmiCategory(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return { text: 'Thiếu cân', color: '#0284c7' };
  if (bmi < 23) return { text: 'Bình thường', color: '#059669' };
  if (bmi < 25) return { text: 'Thừa cân', color: '#d97706' };
  if (bmi < 30) return { text: 'Béo phì độ I', color: '#ea580c' };
  return { text: 'Béo phì độ II+', color: '#dc2626' };
}

export default function HealthProfileCard({ health, onEdit }) {
  const height = health?.height;
  const weight = health?.weight;
  const bmi = calcBmi(height, weight);
  const cat = bmiCategory(bmi);

  const hasAny =
    height != null && height !== '' ||
    weight != null && weight !== '' ||
    health?.allergies ||
    health?.medicalHistory ||
    health?.note ||
    health?.healthNote;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 18,
        border: '1px solid #e8eef5',
        boxShadow: '0 6px 20px rgba(15,23,42,0.04)',
        padding: '22px 24px',
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#0f172a' }}>
          Hồ sơ sức khỏe
        </h2>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--teal-600, #0d9488)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cập nhật →
          </button>
        )}
      </div>

      {!hasAny ? (
        <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>
          Chưa có thông tin sức khỏe. Bấm <strong>Chỉnh sửa</strong> để bổ sung chiều cao, cân nặng, dị ứng…
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <Metric label="Chiều cao" value={height != null && height !== '' ? `${height} cm` : '—'} />
            <Metric label="Cân nặng" value={weight != null && weight !== '' ? `${weight} kg` : '—'} />
            <Metric
              label="BMI"
              value={bmi != null ? String(bmi) : '—'}
              sub={cat ? cat.text : null}
              subColor={cat?.color}
            />
          </div>
          <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
            <Row label="Dị ứng" value={health?.allergies || '—'} />
            <Row label="Tiền sử bệnh" value={health?.medicalHistory || '—'} />
            <Row label="Ghi chú" value={health?.note || health?.healthNote || '—'} />
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, sub, subColor }) {
  return (
    <div
      style={{
        background: '#f8fafc',
        borderRadius: 12,
        padding: '12px 14px',
        border: '1px solid #eef2f7',
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 12, fontWeight: 700, color: subColor || '#64748b', marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
      <span style={{ width: 110, flexShrink: 0, color: '#64748b', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#334155', fontWeight: 500 }}>{value}</span>
    </div>
  );
}