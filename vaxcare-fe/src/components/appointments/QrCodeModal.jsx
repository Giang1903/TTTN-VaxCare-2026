import { useEffect, useState } from 'react';
import { getAppointmentQrCode } from '../../services/appointmentService';

export default function QrCodeModal({ open, appointmentId, title, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    if (!open || !appointmentId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    setToken('');
    setImage('');
    getAppointmentQrCode(appointmentId)
      .then((data) => {
        if (cancelled) return;
        setToken(data?.qrCodeToken || data?.qrCode || '');
        setImage(data?.qrCodeImageBase64 || data?.qrImage || '');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Không tải được mã QR.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, appointmentId]);

  if (!open) return null;

  function copyToken() {
    if (!token) return;
    navigator.clipboard?.writeText(token).then(
      () => alert('Đã copy mã QR token.'),
      () => alert(token),
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '28px 24px',
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Mã QR check-in</h3>
        {title && (
          <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>{title}</p>
        )}

        {loading && <p style={{ color: '#64748b' }}>Đang tải mã QR…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && image && (
          <img
            src={image}
            alt="QR check-in"
            style={{
              width: 220,
              height: 220,
              objectFit: 'contain',
              margin: '0 auto 14px',
              display: 'block',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 8,
            }}
          />
        )}

        {!loading && !error && token && (
          <div
            style={{
              fontSize: 12,
              wordBreak: 'break-all',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '10px 12px',
              marginBottom: 12,
              color: '#334155',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {token}
          </div>
        )}

        <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16 }}>
          Đưa mã này cho nhân viên tại quầy để check-in.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {token && (
            <button type="button" className="btn btn-primary btn-sm" onClick={copyToken}>
              Copy mã
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
