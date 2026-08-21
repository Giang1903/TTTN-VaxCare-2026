import { useEffect, useMemo, useState } from 'react';
import { getAvailableSlots } from '../../services/appointmentService';
import { formatTime } from '../../utils/format';

const DOWS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

function buildBookingDates(days = 14) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`; // yyyy-MM-dd cho API
    const label = `${dd}/${mm}/${yyyy}`;
    dates.push({
      key: iso,
      iso,
      label,
      dow: DOWS[d.getDay()],
      dom: d.getDate(),
      moy: MONTHS[d.getMonth()],
    });
  }
  return dates;
}

// ============ STEP 3: DATE & SLOT ============
export default function StepDateTime({
  active,
  facilityId,
  facilityName,
  date,
  slot,
  onSelectDate,
  onSelectSlot,
  onBack,
  onNext,
}) {
  const dates = useMemo(() => buildBookingDates(14), []);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  useEffect(() => {
    if (!date?.iso || !facilityId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlots([]);
      setSlotsError('');
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSlotsError('');
    getAvailableSlots(facilityId, date.iso)
      .then((data) => {
        if (cancelled) return;
        setSlots(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setSlotsError(err.message || 'Không thể tải khung giờ trống.');
        setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date?.iso, facilityId]);

  function displayTime(t) {
    if (!t) return '';
    return formatTime(typeof t === 'string' && t.length === 5 ? `${t}:00` : t);
  }

  function slotKey(s) {
    const t = s.timeSlot;
    if (!t) return '';
    if (typeof t === 'string') return t.slice(0, 5);
    return String(t).slice(0, 5);
  }

  return (
    <div className={`book-step${active ? ' active' : ''}`} data-step="3">
      <div className="book-panel-head">Chọn ngày và khung giờ</div>
      <div className="book-panel-body">
        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>
          Chọn ngày trong 14 ngày tới
        </p>
        <div className="date-row" id="dateRow">
          {dates.map((d) => (
            <button
              type="button"
              key={d.key}
              className={`date-chip${date?.key === d.key ? ' selected' : ''}`}
              onClick={() => onSelectDate(d)}
            >
              <div className="dow">{d.dow}</div>
              <div className="dom">{d.dom}</div>
              <div className="moy">{d.moy}</div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>
          Khung giờ còn chỗ
        </p>
        <div className="slot-grid" id="slotGrid">
          {!date && (
            <p style={{ gridColumn: '1/-1', fontSize: '13px', color: 'var(--gray-500)' }}>
              Chọn ngày để xem khung giờ
            </p>
          )}
          {date && loadingSlots && (
            <p style={{ gridColumn: '1/-1', fontSize: '13px', color: 'var(--gray-500)' }}>
              Đang tải khung giờ…
            </p>
          )}
          {date && slotsError && (
            <p className="form-error" style={{ gridColumn: '1/-1' }}>
              {slotsError}
            </p>
          )}
          {date && !loadingSlots && !slotsError && slots.length === 0 && (
            <p style={{ gridColumn: '1/-1', fontSize: '13px', color: 'var(--gray-500)' }}>
              Không còn khung giờ trống trong ngày này. Vui lòng chọn ngày khác.
            </p>
          )}
          {date &&
            !loadingSlots &&
            slots.map((s) => {
              const key = slotKey(s);
              const isFull = !!s.full || (s.availableCount != null && s.availableCount <= 0);
              const left = s.availableCount != null ? s.availableCount : isFull ? 0 : null;
              return (
                <button
                  type="button"
                  key={key}
                  className={`slot-btn${slot === key ? ' selected' : ''}`}
                  disabled={isFull}
                  onClick={() => onSelectSlot(key)}
                >
                  {displayTime(s.timeSlot)}
                  <span className="cap">
                    {isFull ? 'Hết chỗ' : left != null ? `Còn ${left}` : 'Còn chỗ'}
                  </span>
                </button>
              );
            })}
        </div>

        {slot && (
          <div className="ai-hint" id="aiHint">
            <strong>AI gợi ý:</strong> Khung <strong>{slot}</strong>
            {facilityName ? ` tại cơ sở ${facilityName}` : ''} có xác suất chờ thấp.
          </div>
        )}

        <div className="book-nav">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            ← Quay lại
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!date || !slot}
            onClick={onNext}
          >
            Tiếp tục →
          </button>
        </div>
      </div>
    </div>
  );
}