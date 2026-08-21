import { useEffect, useState } from 'react';
import { getFacilities } from '../../services/facilityService';
import { formatTime } from '../../utils/format';

// ============ STEP 2: FACILITY ============
export default function StepFacility({ active, selectedId, onSelect, onBack, onNext }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    getFacilities()
      .then((data) => {
        if (cancelled) return;
        setFacilities(data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Không thể tải danh sách cơ sở.');
        setFacilities([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function buildDesc(f) {
    const parts = [];
    if (f.address) parts.push(f.address);
    if (f.openingTime && f.closingTime) {
      parts.push(`${formatTime(f.openingTime)}–${formatTime(f.closingTime)}`);
    }
    if (f.capacityPerSlot) {
      parts.push(`Sức chứa ${f.capacityPerSlot}/khung`);
    }
    return parts.join(' · ') || 'Cơ sở tiêm chủng VaxCare';
  }

  return (
    <div className={`book-step${active ? ' active' : ''}`} data-step="2">
      <div className="book-panel-head">Chọn cơ sở tiêm chủng</div>
      <div className="book-panel-body">
        {loading && (
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>
            Đang tải danh sách cơ sở…
          </p>
        )}
        {error && (
          <p className="form-error" style={{ marginBottom: '12px' }}>
            {error}
          </p>
        )}
        {!loading && !error && facilities.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
            Hiện chưa có cơ sở nào khả dụng.
          </p>
        )}
        <div className="opt-grid" id="facilityOptions">
          {facilities.map((f) => (
            <button
              type="button"
              key={f.facilityId}
              className={`opt-card${selectedId === f.facilityId ? ' selected' : ''}`}
              onClick={() =>
                onSelect({
                  id: f.facilityId,
                  name: f.facilityName,
                  addr: f.address || '',
                  desc: buildDesc(f),
                })
              }
            >
              <h4>{f.facilityName}</h4>
              <p>{buildDesc(f)}</p>
            </button>
          ))}
        </div>
        <div className="book-nav">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            ← Quay lại
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedId}
            onClick={onNext}
          >
            Tiếp tục →
          </button>
        </div>
      </div>
    </div>
  );
}