import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';
import { getMyVaccinationHistory } from '../../services/vaccinationService';
import {
  getMyReactions,
  submitReaction,
  SEVERITY_OPTIONS,
  severityLabel,
} from '../../services/reactionService';

function formatDate(d) {
  if (!d) return '—';
  const s = String(d);
  if (s.includes('-') && s.length >= 10) {
    const [y, m, day] = s.slice(0, 10).split('-');
    return `${day}/${m}/${y}`;
  }
  return s;
}

const cardStyle = {
  background: '#fff',
  borderRadius: 20,
  border: '1px solid #e8eef5',
  padding: '32px 28px',
  boxShadow: '0 8px 28px rgba(15, 23, 42, 0.05)',
  minHeight: 320,
  display: 'flex',
  flexDirection: 'column',
};

const fieldStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid #dbe3ee',
  fontSize: 14.5,
  fontFamily: 'inherit',
  color: '#1e293b',
  background: '#f8fafc',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontWeight: 800,
  fontSize: 13.5,
  marginBottom: 8,
  color: '#1e293b',
};

export default function ReactionsPage() {
  const [details, setDetails] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detailId, setDetailId] = useState('');
  const [severity, setSeverity] = useState('MILD');
  const [symptoms, setSymptoms] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([getMyVaccinationHistory(), getMyReactions()])
      .then(([history, rx]) => {
        const list = history?.details || history?.detailList || [];
        setDetails(Array.isArray(list) ? list : []);
        setReactions(Array.isArray(rx) ? rx : []);
      })
      .catch((err) => {
        setError(err.message || 'Không tải được dữ liệu.');
        setDetails([]);
        setReactions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const doseOptions = useMemo(() => {
    return details
      .filter((d) => d.detailId)
      .map((d) => {
        const dose = d.doseNumber != null ? `Mũi ${d.doseNumber}` : '';
        const name = [d.vaccineName, dose].filter(Boolean).join(' – ') || `Mũi #${d.detailId}`;
        const date = formatDate(d.injectionDate);
        return {
          value: String(d.detailId),
          label: `${name} · ${date}${d.facilityName ? ` · ${d.facilityName}` : ''}`,
        };
      });
  }, [details]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');
    if (!detailId) {
      setFormError('Vui lòng chọn mũi tiêm đã thực hiện.');
      return;
    }
    setSubmitting(true);
    try {
      await submitReaction({
        detailId,
        severity,
        symptoms: symptoms.trim(),
      });
      setSuccessMsg('Đã ghi nhận phản ứng sau tiêm. Nhân viên y tế sẽ theo dõi nếu cần.');
      setSymptoms('');
      setSeverity('MILD');
      setDetailId('');
      const rx = await getMyReactions();
      setReactions(Array.isArray(rx) ? rx : []);
    } catch (err) {
      setFormError(err.message || 'Gửi phản ứng thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SlimPageHero currentLabel="Phản ứng sau tiêm" />

      <div className="wrap" style={{ maxWidth: 960, margin: '0 auto', padding: '8px 20px 56px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 28px)',marginBottom: 10, color: '#0f172a' }}>
            Theo dõi phản ứng sau tiêm
          </h1>
          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            Trong <strong style={{ color: '#1e293b' }}>24–72 giờ</strong> sau tiêm, hãy cập nhật tình trạng
            sức khỏe. Nhân viên y tế có thể liên hệ khi cần xử lý.
          </p>
        </div>

        {error && (
          <p className="form-error" style={{ marginBottom: 16, textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* 2 cột cân đều */}
        <div
          className="reactions-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {/* Card form */}
          <div style={cardStyle}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>
                Khai báo phản ứng
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Chỉ áp dụng cho mũi tiêm <strong style={{ color: '#1e293b' }}>đã hoàn thành</strong> trên
                hệ thống.
              </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                <p style={{ color: '#64748b', margin: 'auto 0', textAlign: 'center' }}>Đang tải…</p>
              ) : doseOptions.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '24px 12px',
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'linear-gradient(145deg, #e0f2fe, #f0f9ff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                      color: '#0284c7',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6M12 18v-6M9 15h6" />
                    </svg>
                  </div>
                  <p style={{ color: '#475569', fontSize: 14.5, margin: '0 0 6px', fontWeight: 600 }}>
                    Chưa có mũi tiêm được ghi nhận
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 16px', maxWidth: 260 }}>
                    Sau khi staff ghi nhận kết quả tiêm, bạn có thể khai báo phản ứng tại đây.
                  </p>
                  <Link
                    to="/appointments"
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700 }}
                  >
                    Xem lịch tiêm
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                  <div>
                    <label htmlFor="rx-dose" style={labelStyle}>
                      Mũi tiêm <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <select
                      id="rx-dose"
                      required
                      value={detailId}
                      onChange={(e) => setDetailId(e.target.value)}
                      style={fieldStyle}
                    >
                      <option value="">Chọn mũi đã tiêm</option>
                      {doseOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="rx-sev" style={labelStyle}>
                      Mức độ <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <select
                      id="rx-sev"
                      required
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      style={fieldStyle}
                    >
                      {SEVERITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label htmlFor="rx-sym" style={labelStyle}>
                      Triệu chứng / ghi chú
                    </label>
                    <textarea
                      id="rx-sym"
                      rows={4}
                      placeholder="VD: Sốt nhẹ 37.8°C, đau tại chỗ tiêm…"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      style={{ ...fieldStyle, resize: 'vertical', minHeight: 96 }}
                    />
                  </div>

                  {formError && <p className="form-error" style={{ margin: 0 }}>{formError}</p>}
                  {successMsg && (
                    <p className="form-success" style={{ margin: 0, fontSize: 13.5 }}>
                      {successMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                    style={{ width: '100%', height: 48, fontWeight: 700, marginTop: 4 }}
                  >
                    {submitting ? 'Đang gửi…' : 'Gửi phản hồi'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Card lịch sử */}
          <div style={cardStyle}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>
                Phản hồi đã gửi
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>
                Danh sách khai báo của bạn và trạng thái xử lý từ nhân viên y tế.
              </p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {loading && (
                <p style={{ color: '#64748b', margin: 'auto 0', textAlign: 'center' }}>Đang tải…</p>
              )}
              {!loading && reactions.length === 0 && (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '24px 12px',
                    background: '#f8fafc',
                    borderRadius: 14,
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'linear-gradient(145deg, #ecfdf5, #f0fdf4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                      color: '#059669',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                  <p style={{ color: '#475569', fontSize: 14.5, margin: '0 0 6px', fontWeight: 600 }}>
                    Chưa có phản hồi nào
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, maxWidth: 240 }}>
                    Sau khi gửi khai báo, lịch sử sẽ hiện tại đây.
                  </p>
                </div>
              )}
              {!loading && reactions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                  {reactions.map((r) => (
                    <div
                      key={r.reactionId}
                      style={{
                        border: '1px solid #e8eef5',
                        borderRadius: 14,
                        padding: '14px 16px',
                        background: '#f8fafc',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4, color: '#0f172a' }}>
                        {r.vaccineName || `Mũi #${r.detailId}`}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        {formatDate(r.injectionDate)}
                        {r.facilityName ? ` · ${r.facilityName}` : ''}
                      </div>
                      <div style={{ fontSize: 13.5, marginTop: 8, color: '#334155' }}>
                        <strong>Mức độ:</strong> {severityLabel(r.severity)}
                      </div>
                      {r.symptoms && (
                        <div style={{ fontSize: 13.5, marginTop: 4, color: '#475569' }}>{r.symptoms}</div>
                      )}
                      {r.processingStatus && (
                        <div style={{ fontSize: 12.5, marginTop: 8, color: '#64748b' }}>
                          Trạng thái: <strong style={{ color: '#1e293b' }}>{r.processingStatus}</strong>
                          {r.staffNote ? ` — ${r.staffNote}` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .reactions-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
