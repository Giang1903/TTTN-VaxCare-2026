import { facilityOptions } from '../../mockdata/booking';

// ============ STEP 2: FACILITY ============
export default function StepFacility({ active, selectedId, onSelect, onBack, onNext }) {
  return (
    <div className={`book-step${active ? ' active' : ''}`} data-step="2">
      <div className="book-panel-head">Chọn cơ sở tiêm chủng</div>
      <div className="book-panel-body">
        <div className="opt-grid" id="facilityOptions">
          {facilityOptions.map((f) => (
            <button
              type="button"
              key={f.id}
              className={`opt-card${selectedId === f.id ? ' selected' : ''}`}
              onClick={() => onSelect(f)}
            >
              <h4>{f.name}</h4>
              <p>{f.desc}</p>
            </button>
          ))}
        </div>
        <div className="book-nav">
          <button type="button" className="btn btn-ghost" onClick={onBack}>← Quay lại</button>
          <button type="button" className="btn btn-primary" disabled={!selectedId} onClick={onNext}>Tiếp tục →</button>
        </div>
      </div>
    </div>
  );
}
