export function Overlay({ open, onClose }) {
  return <div className={`overlay${open ? ' open' : ''}`} onClick={onClose} />;
}

export function Modal({ open, title, onClose, children, footer }) {
  return (
    <div className={`modal${open ? ' open' : ''}`} role="dialog">
      <div className="modal-head">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose} aria-label="Đóng" type="button">
          ×
        </button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-foot">{footer}</div>}
    </div>
  );
}
