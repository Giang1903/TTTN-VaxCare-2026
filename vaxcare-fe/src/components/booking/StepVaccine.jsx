import { useEffect, useState } from 'react';
import { searchVaccines } from '../../services/vaccineService';
import { formatCurrency } from '../../utils/format';

// ============ STEP 1: VACCINE ============
export default function StepVaccine({ active, selectedId, onSelect, onNext }) {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    searchVaccines()
      .then((data) => {
        if (cancelled) return;
        setVaccines(data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Không thể tải danh sách vắc xin.');
        setVaccines([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`book-step${active ? ' active' : ''}`} data-step="1">
      <div className="book-panel-head">Chọn loại vắc xin</div>
      <div className="book-panel-body">
        {loading && (
          <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>
            Đang tải danh sách vắc xin…
          </p>
        )}
        {error && (
          <p className="form-error" style={{ marginBottom: '12px' }}>
            {error}
          </p>
        )}
        {!loading && !error && vaccines.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
            Hiện chưa có vắc xin nào khả dụng.
          </p>
        )}
        <div className="opt-grid" id="vaccineOptions">
          {vaccines.map((v) => (
            <button
              type="button"
              key={v.vaccineId}
              className={`opt-card${selectedId === v.vaccineId ? ' selected' : ''}`}
              onClick={() =>
                onSelect({
                  id: v.vaccineId,
                  name: v.vaccineName,
                  title: v.vaccineName,
                  desc: v.targetDisease
                    ? `Phòng: ${v.targetDisease}`
                    : v.manufacturer
                      ? `NSX: ${v.manufacturer}`
                      : 'Vắc xin chính hãng',
                  price: v.currentPrice != null ? Number(v.currentPrice) : 0,
                })
              }
            >
              <h4>{v.vaccineName}</h4>
              <p>
                {v.targetDisease
                  ? `Phòng: ${v.targetDisease}`
                  : v.manufacturer
                    ? `NSX: ${v.manufacturer}`
                    : 'Vắc xin chính hãng'}
              </p>
              <div className="price">{formatCurrency(v.currentPrice)}</div>
            </button>
          ))}
        </div>
        <div className="book-nav">
          <span></span>
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