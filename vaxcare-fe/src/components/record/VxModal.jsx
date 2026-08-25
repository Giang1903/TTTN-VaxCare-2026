
export default function VxModal({ open, onClose, titleId, title, large, children, footer }) {
  return (
    <div
      className={`vx-modal-overlay${open ? ' open' : ''}`}
      aria-hidden={!open}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`vx-modal${large ? ' vx-modal-lg' : ''}`} role="dialog" aria-labelledby={titleId}>
        <div className="vx-modal-head">
          <h3 id={titleId}>{title}</h3>
          <button type="button" className="vx-modal-close" onClick={onClose} aria-label="Đóng">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="vx-modal-body">{children}</div>
        {footer && <div className="vx-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
