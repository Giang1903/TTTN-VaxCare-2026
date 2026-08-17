import { vaccineOptions, formatPriceVND } from '../../mockdata/booking';

// ============ STEP 1: VACCINE ============
export default function StepVaccine({ active, selectedId, onSelect, onNext }) {
  return (
    <div className={`book-step${active ? ' active' : ''}`} data-step="1">
      <div className="book-panel-head">Chọn loại vắc xin</div>
      <div className="book-panel-body">
        <div className="opt-grid" id="vaccineOptions">
          {vaccineOptions.map((v) => (
            <button
              type="button"
              key={v.id}
              className={`opt-card${selectedId === v.id ? ' selected' : ''}`}
              onClick={() => onSelect(v)}
            >
              <h4>{v.title}</h4>
              <p>{v.desc}</p>
              <div className="price">{formatPriceVND(v.price)}</div>
            </button>
          ))}
        </div>
        <div className="book-nav">
          <span></span>
          <button type="button" className="btn btn-primary" disabled={!selectedId} onClick={onNext}>Tiếp tục →</button>
        </div>
      </div>
    </div>
  );
}
