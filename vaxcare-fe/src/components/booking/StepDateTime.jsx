import { buildBookingDates, timeSlots, fullSlots } from '../../mockdata/booking';

const DATES = buildBookingDates();

// ============ STEP 3: DATE & SLOT ============
export default function StepDateTime({ active, facilityName, date, slot, onSelectDate, onSelectSlot, onBack, onNext }) {
  return (
    <div className={`book-step${active ? ' active' : ''}`} data-step="3">
      <div className="book-panel-head">Chọn ngày và khung giờ</div>
      <div className="book-panel-body">
        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>Chọn ngày trong 14 ngày tới</p>
        <div className="date-row" id="dateRow">
          {DATES.map((d) => (
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

        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>Khung giờ còn chỗ</p>
        <div className="slot-grid" id="slotGrid">
          {!date && (
            <p style={{ gridColumn: '1/-1', fontSize: '13px', color: 'var(--gray-500)' }}>Chọn ngày để xem khung giờ</p>
          )}
          {date && timeSlots.map((t, i) => {
            const isFull = !!fullSlots[t];
            const left = isFull ? 0 : 3 + (t.charCodeAt(1) % 5);
            return (
              <button
                type="button"
                key={t}
                className={`slot-btn${slot === t ? ' selected' : ''}`}
                disabled={isFull}
                onClick={() => onSelectSlot(t)}
              >
                {t}
                <span className="cap">{isFull ? 'Hết chỗ' : `Còn ${left}`}</span>
              </button>
            );
          })}
        </div>

        {slot && (
          <div className="ai-hint" id="aiHint">
            <strong>AI gợi ý:</strong> Khung <strong>{slot}</strong> tại {facilityName ? `cơ sở ${facilityName}` : 'cơ sở bạn chọn'} có xác suất chờ thấp (~12 phút).
          </div>
        )}

        <div className="book-nav">
          <button type="button" className="btn btn-ghost" onClick={onBack}>← Quay lại</button>
          <button type="button" className="btn btn-primary" disabled={!slot} onClick={onNext}>Tiếp tục →</button>
        </div>
      </div>
    </div>
  );
}
