export function Overlay({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      className="overlay open"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose?.()}
      role="presentation"
    />
  );
}

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="modal open"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="modal-head">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose} aria-label="Đóng" type="button">
          ×
        </button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && (
        <div className="modal-foot" onClick={(e) => e.stopPropagation()}>
          {footer}
        </div>
      )}
    </div>
  );
}