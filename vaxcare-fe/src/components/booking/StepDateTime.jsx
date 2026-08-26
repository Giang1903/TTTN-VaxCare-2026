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
    const iso = `${yyyy}-${mm}-${dd}`;
    dates.push({
      key: iso,
      iso,
      label: `${dd}/${mm}/${yyyy}`,
      dow: DOWS[d.getDay()],
      dom: d.getDate(),
      moy: MONTHS[d.getMonth()],
    });
  }
  return dates;
}

function slotKey(s) {
  const t = s.timeSlot;
  if (!t) return '';
  if (typeof t === 'string') return t.slice(0, 5);
  return String(t).slice(0, 5);
}

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
        const list = Array.isArray(data) ? [...data] : [];
        list.sort((a, b) => {
          const ar = a.aiRecommended ? 0 : 1;
          const br = b.aiRecommended ? 0 : 1;
          if (ar !== br) return ar - br;
          return (a.aiOverloadProbability ?? 1) - (b.aiOverloadProbability ?? 1);
        });
        setSlots(list);
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

  const selectedSlotData = useMemo(
    () => (slot ? slots.find((s) => slotKey(s) === slot) : null),
    [slot, slots],
  );

  const recommendedSlots = useMemo(
    () =>
      slots.filter(
        (s) => s.aiRecommended && !(s.full || (s.availableCount != null && s.availableCount <= 0)),
      ),
    [slots],
  );

  return (
    <div className={`book-step${active ? ' active' : ''}`} data-step="3">
      <div className="book-panel-head">Chọn ngày và khung giờ</div>
      <div className="book-panel-body">
        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>
          Chọn ngày trong 14 ngày tới — AI xếp hạng khung giờ ít quá tải trước
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
              const isAi = !!s.aiRecommended;
              return (
                <button
                  type="button"
                  key={key}
                  className={`slot-btn${slot === key ? ' selected' : ''}${isAi && !isFull ? ' ai-rec' : ''}`}
                  disabled={isFull}
                  onClick={() => onSelectSlot(key)}
                  title={
                    isAi
                      ? `AI đề xuất · chờ ước tính ${s.aiEstimatedWaitMinutes ?? '—'} phút`
                      : s.aiEstimatedWaitMinutes != null
                        ? `Chờ ước tính ~${s.aiEstimatedWaitMinutes} phút`
                        : undefined
                  }
                >
                  {displayTime(s.timeSlot)}
                  {isAi && !isFull && (
                    <span className="ai-badge" style={{ fontSize: 10, color: 'var(--primary, #0d9488)' }}>
                      AI
                    </span>
                  )}
                  <span className="cap">
                    {isFull
                      ? 'Hết chỗ'
                      : left != null
                        ? `Còn ${left}`
                        : s.aiEstimatedWaitMinutes != null
                          ? `~${s.aiEstimatedWaitMinutes} phút`
                          : 'Còn chỗ'}
                  </span>
                </button>
              );
            })}
        </div>

        {selectedSlotData && (
          <div className="ai-hint" id="aiHint">
            {selectedSlotData.aiRecommended ? (
              <>
                <strong>AI đề xuất khung này:</strong> {displayTime(selectedSlotData.timeSlot)}
                {facilityName ? ` tại ${facilityName}` : ''}.
                {selectedSlotData.aiEstimatedWaitMinutes != null && (
                  <> Thời gian chờ ước tính ~{selectedSlotData.aiEstimatedWaitMinutes} phút.</>
                )}
                {selectedSlotData.aiOverloadProbability != null && (
                  <> Xác suất quá tải: {Math.round(Number(selectedSlotData.aiOverloadProbability) * 100)}%.</>
                )}
              </>
            ) : (
              <>
                <strong>Khung đã chọn:</strong> {displayTime(selectedSlotData.timeSlot)}
                {selectedSlotData.aiEstimatedWaitMinutes != null && (
                  <> · Chờ ước tính ~{selectedSlotData.aiEstimatedWaitMinutes} phút</>
                )}
                {recommendedSlots.length > 0 && (
                  <>
                    {' '}
                    · AI gợi ý thêm:{' '}
                    {recommendedSlots
                      .slice(0, 3)
                      .map((s) => displayTime(s.timeSlot))
                      .join(', ')}
                  </>
                )}
              </>
            )}
          </div>
        )}
        {!selectedSlotData && recommendedSlots.length > 0 && (
          <div className="ai-hint" id="aiHint">
            <strong>AI gợi ý:</strong> các khung{' '}
            {recommendedSlots
              .slice(0, 3)
              .map((s) => displayTime(s.timeSlot))
              .join(', ')}{' '}
            ít quá tải hơn.
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