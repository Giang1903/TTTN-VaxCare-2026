import { useEffect, useState } from 'react';
import { createVnpayPayment, getPaymentByAppointment } from '../../services/appointmentService';

function statusVi(s) {
  const u = String(s || '').toUpperCase();
  if (u === 'SUCCESS' || u === 'PAID') return 'Đã thanh toán';
  if (u === 'PENDING') return 'Chờ thanh toán';
  if (u === 'FAILED') return 'Thất bại';
  if (u === 'CANCELLED') return 'Đã hủy';
  return s || '—';
}

function formatMoney(n) {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString('vi-VN') + ' đ';
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

export default function PaymentModal({ open, appointmentId, title, onClose }) {
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (!open || !appointmentId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    setPayment(null);
    getPaymentByAppointment(appointmentId)
      .then((data) => {
        if (!cancelled) setPayment(data || null);
      })
      .catch((err) => {
        if (!cancelled) {
          // Chưa có bản ghi payment vẫn cho thanh toán lại
          setPayment(null);
          setError(err.message || '');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, appointmentId]);

  async function handlePay() {
    if (!appointmentId) return;
    setPaying(true);
    setError('');
    try {
      const pay = await createVnpayPayment(appointmentId);
      if (pay?.paymentUrl) {
        window.location.href = pay.paymentUrl;
        return;
      }
      setError('Không nhận được link VNPay.');
    } catch (err) {
      setError(err.message || 'Không tạo được thanh toán.');
    } finally {
      setPaying(false);
    }
  }

  if (!open) return null;

  const st = String(payment?.status || '').toUpperCase();
  const canPay = !payment || st === 'PENDING' || st === 'FAILED' || st === '';

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
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Thanh toán / Hóa đơn</h3>
        {title && <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 16 }}>{title}</p>}

        {loading && <p style={{ color: '#64748b' }}>Đang tải…</p>}

        {!loading && payment && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 16,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <div>
              <strong>Trạng thái:</strong> {statusVi(payment.status)}
            </div>
            <div>
              <strong>Số tiền:</strong> {formatMoney(payment.amount)}
            </div>
            <div>
              <strong>Phương thức:</strong> {payment.paymentMethod || 'VNPay'}
            </div>
            {payment.transactionId && (
              <div style={{ wordBreak: 'break-all' }}>
                <strong>Mã GD:</strong> {payment.transactionId}
              </div>
            )}
            <div>
              <strong>Thời gian:</strong> {formatDt(payment.paymentTime || payment.createdAt)}
            </div>
            <div>
              <strong>Mã lịch:</strong> #{payment.appointmentId || appointmentId}
            </div>
          </div>
        )}

        {!loading && !payment && (
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
            Chưa có giao dịch thanh toán cho lịch này. Bạn có thể thanh toán qua VNPay.
          </p>
        )}

        {error && !payment && (
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{error}</p>
        )}
        {error && payment && <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {canPay && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={paying}
              onClick={handlePay}
            >
              {paying ? 'Đang chuyển…' : st === 'FAILED' ? 'Thanh toán lại' : 'Thanh toán VNPay'}
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
