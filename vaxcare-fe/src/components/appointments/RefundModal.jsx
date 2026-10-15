import { useEffect, useState } from 'react';
import {
  createRefund,
  getPaymentByAppointment,
  getRefundsByAppointment,
} from '../../services/appointmentService';

function formatMoney(n) {
  if (n == null || n === '') return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return `${num.toLocaleString('vi-VN')} đ`;
}

function statusVi(s) {
  const u = String(s || '').toUpperCase();
  if (u === 'SUCCESS' || u === 'PAID') return 'Đã thanh toán';
  if (u === 'PENDING') return 'Chờ thanh toán';
  if (u === 'FAILED') return 'Thất bại';
  if (u === 'REFUNDED') return 'Đã hoàn tiền';
  if (u === 'REFUNDING') return 'Đang hoàn tiền';
  if (u === 'PARTIAL_REFUNDED') return 'Hoàn một phần';
  return s || '—';
}

function methodLabel(m) {
  const u = String(m || '').toUpperCase();
  if (u === 'ZALOPAY') return 'ZaloPay';
  if (u === 'VNPAY') return 'VNPay';
  if (u === 'CASH') return 'Tiền mặt';
  return m || '—';
}

/**
 * Modal hoàn tiền cho Staff / Admin.
 * Tự load payment theo appointmentId; gọi POST /payments/{paymentId}/refund.
 */
export default function RefundModal({
  open,
  appointmentId,
  patientName,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open || !appointmentId) return undefined;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    setPayment(null);
    setRefunds([]);
    setReason('');

    Promise.all([
      getPaymentByAppointment(appointmentId).catch(() => null),
      getRefundsByAppointment(appointmentId).catch(() => []),
    ])
      .then(([pay, list]) => {
        if (cancelled) return;
        setPayment(pay || null);
        setRefunds(Array.isArray(list) ? list : list?.content || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Không tải được thông tin thanh toán');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, appointmentId]);

  if (!open) return null;

  const st = String(payment?.status || '').toUpperCase();
  const canRefund = payment && (st === 'SUCCESS' || st === 'PARTIAL_REFUNDED');
  const alreadyRefunded = st === 'REFUNDED' || st === 'REFUNDING';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!payment?.paymentId) {
      setError('Không tìm thấy giao dịch thanh toán để hoàn tiền.');
      return;
    }
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hoàn tiền.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await createRefund(payment.paymentId, {
        amount: null, // full refund
        reason: reason.trim(),
      });
      onSuccess?.(result, payment);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Hoàn tiền thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        className={`staff-overlay${open ? ' open' : ''}`}
        onClick={() => !submitting && onClose?.()}
        role="presentation"
      />
      <div className={`staff-modal${open ? ' open' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h3>Hoàn tiền</h3>
            <div className="sub">
              Lịch hẹn #{appointmentId}
              {patientName ? ` · ${patientName}` : ''}
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Đóng"
            disabled={submitting}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading && <p style={{ color: 'var(--gray-500)', margin: 0 }}>Đang tải thông tin thanh toán…</p>}

          {!loading && !payment && (
            <p style={{ color: '#b91c1c', margin: 0 }}>
              Chưa có giao dịch thanh toán cho lịch hẹn này. Không thể hoàn tiền.
            </p>
          )}

          {!loading && payment && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px 16px',
                  marginBottom: 16,
                  padding: 14,
                  borderRadius: 12,
                  background: 'var(--gray-50, #f8fafc)',
                  border: '1px solid var(--gray-100, #e2e8f0)',
                  fontSize: 13.5,
                }}
              >
                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>Mã giao dịch</div>
                  <strong>#{payment.paymentId}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>Cổng</div>
                  <strong>{methodLabel(payment.paymentMethod)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>Số tiền</div>
                  <strong>{formatMoney(payment.amount)}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>Trạng thái</div>
                  <strong>{statusVi(payment.status)}</strong>
                </div>
                {payment.gatewayTransactionId && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>Mã cổng (txn)</div>
                    <code style={{ fontSize: 12 }}>{payment.gatewayTransactionId}</code>
                  </div>
                )}
              </div>

              {alreadyRefunded && (
                <p
                  style={{
                    margin: '0 0 12px',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'rgba(13,148,136,0.08)',
                    color: '#0f766e',
                    fontSize: 13.5,
                  }}
                >
                  Giao dịch này đã được hoàn tiền
                  {st === 'REFUNDING' ? ' (đang xử lý)' : ''}.
                </p>
              )}

              {canRefund && (
                <form id="refund-form" onSubmit={handleSubmit}>
                  <label
                    htmlFor="refund-reason"
                    style={{ display: 'block', fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}
                  >
                    Lý do hoàn tiền <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    id="refund-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                    required
                    disabled={submitting}
                    placeholder="Ví dụ: Khách hủy lịch trước giờ tiêm; vắc xin hết hạn; lỗi đặt trùng…"
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      minHeight: 88,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid var(--gray-200, #e2e8f0)',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4, textAlign: 'right' }}>
                    {reason.length}/500
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--gray-500)', margin: '8px 0 0' }}>
                    Hệ thống sẽ hoàn <strong>toàn bộ</strong> số tiền qua cổng{' '}
                    {methodLabel(payment.paymentMethod)} (sandbox hoặc production tùy cấu hình BE).
                  </p>
                </form>
              )}

              {refunds.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <h4 style={{ fontSize: 13.5, margin: '0 0 8px' }}>Lịch sử hoàn tiền</h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--gray-700)' }}>
                    {refunds.map((r) => (
                      <li key={r.refundId || r.id || `${r.createdAt}-${r.amount}`} style={{ marginBottom: 6 }}>
                        {formatMoney(r.amount)} · {statusVi(r.status)}
                        {r.reason ? ` — ${r.reason}` : ''}
                        {r.createdAt ? (
                          <span style={{ color: 'var(--gray-500)' }}>
                            {' '}
                            ({String(r.createdAt).replace('T', ' ').slice(0, 19)})
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="form-error" style={{ color: '#b91c1c', fontSize: 13.5, marginTop: 12, marginBottom: 0 }}>
              {error}
            </p>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn outline" disabled={submitting} onClick={onClose}>
            Đóng
          </button>
          {canRefund && (
            <button
              type="submit"
              form="refund-form"
              className="btn primary"
              disabled={submitting || loading}
              style={{ background: '#dc2626', borderColor: '#dc2626' }}
            >
              {submitting ? 'Đang hoàn tiền…' : 'Xác nhận hoàn tiền'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
