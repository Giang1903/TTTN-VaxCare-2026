import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  createVnpayPayment,
  createZalopayPayment,
  getAppointmentQrCode,
  getPaymentByAppointment,
} from '../../services/appointmentService';
import PaymentMethodPicker from '../booking/PaymentMethodPicker';

function statusVi(s) {
  const u = String(s || '').toUpperCase();
  if (u === 'SUCCESS' || u === 'PAID') return 'Đã thanh toán';
  if (u === 'PENDING') return 'Chờ thanh toán';
  if (u === 'FAILED') return 'Thất bại';
  if (u === 'CANCELLED') return 'Đã hủy';
  if (u === 'REFUNDED') return 'Đã hoàn tiền';
  if (u === 'REFUNDING') return 'Đang hoàn tiền';
  return s || '—';
}

function statusColor(s) {
  const u = String(s || '').toUpperCase();
  if (u === 'SUCCESS' || u === 'PAID') return '#345fd6';
  if (u === 'PENDING') return '#b45309';
  if (u === 'FAILED' || u === 'CANCELLED') return '#b91c1c';
  if (u === 'REFUNDED' || u === 'REFUNDING') return '#234195';
  return '#64748b';
}

function methodLabel(m) {
  const u = String(m || '').toUpperCase();
  if (u === 'ZALOPAY') return 'ZaloPay';
  if (u === 'VNPAY') return 'VNPay';
  if (u === 'CASH') return 'Tiền mặt';
  return m || '—';
}

function formatMoney(n) {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return `${num.toLocaleString('vi-VN')} đ`;
}

function formatDt(d) {
  if (!d) return '—';
  const s = String(d);
  if (s.includes('T')) {
    const [date, time] = s.split('T');
    const [y, m, day] = date.split('-');
    return `${day}/${m}/${y} ${time?.slice(0, 8) || ''}`;
  }
  return s;
}

/**
 * Khung gộp Mã QR check-in + Hóa đơn / Thanh toán
 * Phong cách: giấy chứng nhận truyền thống + chi tiết hiện đại
 */
export default function QrInvoicePanel({ open, appointmentId, title, onClose }) {
  const [qrLoading, setQrLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [payError, setPayError] = useState('');
  const [token, setToken] = useState('');
  const [image, setImage] = useState('');
  const [payment, setPayment] = useState(null);
  const [method, setMethod] = useState('VNPAY');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!open || !appointmentId) return undefined;
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQrLoading(true);
    setPayLoading(true);
    setQrError('');
    setPayError('');
    setToken('');
    setImage('');
    setPayment(null);

    getAppointmentQrCode(appointmentId)
      .then((data) => {
        if (cancelled) return;
        setToken(data?.qrCodeToken || data?.qrCode || '');
        setImage(data?.qrCodeImageBase64 || data?.qrImage || '');
      })
      .catch((err) => {
        if (!cancelled) setQrError(err.message || 'Không tải được mã QR.');
      })
      .finally(() => {
        if (!cancelled) setQrLoading(false);
      });

    getPaymentByAppointment(appointmentId)
      .then((data) => {
        if (!cancelled) setPayment(data || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setPayment(null);
          setPayError(err.message || '');
        }
      })
      .finally(() => {
        if (!cancelled) setPayLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, appointmentId]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('vx-modal-open');
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('vx-modal-open');
    };
  }, [open]);

  if (!open) return null;

  const st = String(payment?.status || '').toUpperCase();
  const canPay = !payment || st === 'PENDING' || st === 'FAILED';
  const qrSrc = image
    ? image.startsWith('data:')
      ? image
      : `data:image/png;base64,${image}`
    : '';

  async function handlePay() {
    if (!appointmentId) return;
    setPaying(true);
    setPayError('');
    try {
      const pay =
        method === 'ZALOPAY'
          ? await createZalopayPayment(appointmentId)
          : await createVnpayPayment(appointmentId);
      const url = pay?.paymentUrl || pay?.orderUrl || pay?.order_url;
      if (url) {
        window.location.href = url;
        return;
      }
      setPayError(
        method === 'ZALOPAY' ? 'Không nhận được link ZaloPay.' : 'Không nhận được link VNPay.'
      );
    } catch (err) {
      setPayError(err.message || 'Không tạo được thanh toán.');
    } finally {
      setPaying(false);
    }
  }

  function copyToken() {
    if (!token) return;
    navigator.clipboard?.writeText(token).then(
      () => alert('Đã copy mã QR token.'),
      () => alert(token)
    );
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #f8faff 0%, #ffffff 40%)',
          borderRadius: 20,
          maxWidth: 640,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(15,23,42,0.18)',
          border: '1px solid rgba(37,99,235,0.18)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Viền trang trí kiểu chứng nhận */}
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 10,
            borderRadius: 14,
            border: '1px solid rgba(37,99,235,0.12)',
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: '22px 24px 14px',
            textAlign: 'center',
            borderBottom: '1px solid rgba(37,99,235,0.12)',
            position: 'relative',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: '#31549f',
              letterSpacing: '-0.02em',
            }}
          >
            Mã QR & Hóa đơn
          </h3>
          {title && (
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#31549f', lineHeight: 1.45 }}>
              {title}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1.5px solid rgba(37,99,235,0.25)',
              background: 'rgba(37,99,235,0.06)',
              color: '#31549f',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Body: 2 cột trên desktop */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0,
            padding: '0 8px 8px',
          }}
          className="qr-invoice-grid"
        >
          {/* Cột QR */}
          <section
            style={{
              padding: '20px 18px 22px',
              borderRight: '1px dashed rgba(37,99,235,0.2)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#31549f',
                letterSpacing: '0.04em',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: 'rgba(37,99,235,0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                }}
              >
                ⌘
              </span>
              MÃ QR CHECK-IN
            </div>

            <div
              style={{
                margin: '0 auto',
                width: 180,
                height: 180,
                borderRadius: 16,
                background: '#fff',
                border: '2px solid rgba(37,99,235,0.15)',
                boxShadow: '0 8px 24px rgba(37,99,235,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {qrLoading && (
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Đang tải…</span>
              )}
              {!qrLoading && qrError && (
                <span style={{ color: '#b91c1c', fontSize: 12.5, padding: 12 }}>{qrError}</span>
              )}
              {!qrLoading && !qrError && qrSrc && (
                <img
                  src={qrSrc}
                  alt="Mã QR check-in"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10 }}
                />
              )}
              {!qrLoading && !qrError && !qrSrc && (
                <span style={{ color: '#94a3b8', fontSize: 12.5, padding: 12 }}>
                  Chưa có mã QR
                </span>
              )}
            </div>

            <p style={{ margin: '12px 0 0', fontSize: 12.5, color: '#64748b', lineHeight: 1.45 }}>
              Đưa mã này tại quầy để check-in nhanh
            </p>
            {token ? (
              <div style={{ marginTop: 10 }}>
                <code
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0f172a',
                    letterSpacing: '0.03em',
                    wordBreak: 'break-all',
                    borderRadius: 10,
                    background: '#f8fafc',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                >
                  {token}
                </code>
                <button
                  type="button"
                  onClick={copyToken}
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#31549f',
                    background: 'rgba(49, 84, 159, 0.08)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Sao chép mã
                </button>
              </div>
            ) : (
              appointmentId && (
                <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  Lịch hẹn #{appointmentId}
                </p>
              )
            )}
          </section>

          {/* Cột Hóa đơn */}
          <section style={{ padding: '20px 18px 22px' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#31549f',
                letterSpacing: '0.04em',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: 'rgba(37,99,235,0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                }}
              >
                ₫
              </span>
              HÓA ĐƠN THANH TOÁN
            </div>

            {payLoading && (
              <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Đang tải hóa đơn…</p>
            )}

            {!payLoading && payment && (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'linear-gradient(90deg, rgba(49, 84, 159, 0.08), transparent)',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12.5, color: '#64748b' }}>Trạng thái</span>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: statusColor(payment.status),
                    }}
                  >
                    {statusVi(payment.status)}
                  </span>
                </div>
                <InfoRow label="Số tiền" value={formatMoney(payment.amount)} strong />
                <InfoRow label="Phương thức" value={methodLabel(payment.paymentMethod)} />
                {payment.transactionId && (
                  <InfoRow label="Mã GD" value={payment.transactionId} mono />
                )}
                <InfoRow
                  label="Thời gian"
                  value={formatDt(payment.paymentTime || payment.createdAt)}
                />
                <InfoRow
                  label="Mã lịch"
                  value={`#${payment.appointmentId || appointmentId}`}
                  last
                />
              </div>
            )}

            {!payLoading && !payment && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  fontSize: 13,
                  color: '#64748b',
                  lineHeight: 1.5,
                  marginBottom: 12,
                }}
              >
                Chưa có giao dịch. Chọn cổng thanh toán bên dưới để hoàn tất.
              </div>
            )}

            {canPay && !payLoading && (
              <div style={{ marginTop: payment ? 14 : 0 }}>
                <p
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#475569',
                    margin: '0 0 8px',
                  }}
                >
                  Chọn phương thức
                </p>
                <PaymentMethodPicker value={method} onChange={setMethod} disabled={paying} />
              </div>
            )}

            {payError && (
              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 12.5,
                  color: payment ? '#b91c1c' : '#64748b',
                }}
              >
                {payError}
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 22px 20px',
            borderTop: '1px solid rgba(49, 84, 159, 0.1)',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{
              color: '#31549f',
              borderColor: 'rgba(49, 84, 159, 0.35)',
            }}
          >
            Đóng
          </button>
          {canPay && !payLoading && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={paying}
              onClick={handlePay}
            >
              {paying
                ? 'Đang chuyển…'
                : st === 'FAILED'
                  ? `Thanh toán lại (${method === 'ZALOPAY' ? 'ZaloPay' : 'VNPay'})`
                  : `Thanh toán ${method === 'ZALOPAY' ? 'ZaloPay' : 'VNPay'}`}
            </button>
          )}
        </div>

        {/* Responsive: xếp dọc trên màn hẹp */}
        <style>{`
          @media (max-width: 560px) {
            .qr-invoice-grid {
              grid-template-columns: 1fr !important;
            }
            .qr-invoice-grid > section:first-child {
              border-right: none !important;
              border-bottom: 1px dashed rgba(37,99,235,0.2);
            }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
}

function InfoRow({ label, value, strong, mono, last }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '9px 14px',
        borderBottom: last ? 'none' : '1px solid #f1f5f9',
        fontSize: 13,
      }}
    >
      <span style={{ color: '#64748b', flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontWeight: strong ? 700 : 600,
          color: '#0f172a',
          textAlign: 'right',
          wordBreak: 'break-all',
          fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
          fontSize: mono ? 12 : 13,
        }}
      >
        {value}
      </span>
    </div>
  );
}
