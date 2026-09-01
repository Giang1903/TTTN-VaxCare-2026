import { useEffect, useState } from 'react';
import { getFacilities } from '../../services/facilityService';
import { formatTime } from '../../utils/format';

// ============ STEP 2: FACILITY (lọc theo vắc xin đã chọn) ============
export default function StepFacility({
  active,
  vaccineId,
  selectedId,
  onSelect,
  onBack,
  onNext,
}) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');

    if (!vaccineId) {
      setFacilities([]);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    getFacilities(vaccineId)
      .then((data) => {
        if (cancelled) return;
        const list = data || [];
        setFacilities(list);
        // Nếu cơ sở đã chọn không còn trong danh sách (đổi vắc xin) → bỏ chọn
        if (selectedId && !list.some((f) => f.facilityId === selectedId)) {
          onSelect(null);
        }
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
    // selectedId / onSelect không đưa vào deps để tránh loop; chỉ reload khi vaccineId đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaccineId]);

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
        {!vaccineId && (
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>
            Vui lòng chọn vắc xin trước để xem cơ sở còn loại vắc xin đó.
          </p>
        )}
        {vaccineId && loading && (
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>
            Đang tải danh sách cơ sở còn vắc xin đã chọn…
          </p>
        )}
        {error && (
          <p className="form-error" style={{ marginBottom: '12px' }}>
            {error}
          </p>
        )}
        {vaccineId && !loading && !error && facilities.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
            Hiện không có cơ sở nào còn tồn kho vắc xin này. Vui lòng chọn vắc xin khác hoặc quay lại sau.
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