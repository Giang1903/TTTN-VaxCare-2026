import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';
import { getAppointmentQrCode } from '../../services/appointmentService';

const STATUS_CONFIG = {
  success: {
    title: 'Thanh toán thành công',
    subtitle: '',
    icon: '✓',
    tone: 'success',
  },
  paid: {
    title: 'Thanh toán thành công',
    subtitle: '',
    icon: '✓',
    tone: 'success',
  },
  failed: {
    title: 'Thanh toán thất bại',
    subtitle: 'Giao dịch không thành công. Bạn có thể thử lại với VNPay hoặc ZaloPay.',
    icon: '✕',
    tone: 'danger',
  },
  cancel: {
    title: 'Bạn đã hủy thanh toán',
    subtitle: 'Không có khoản tiền nào bị trừ. Bạn có thể thanh toán lại bất cứ lúc nào.',
    icon: '—',
    tone: 'muted',
  },
  cancelled: {
    title: 'Bạn đã hủy thanh toán',
    subtitle: 'Không có khoản tiền nào bị trừ. Bạn có thể thanh toán lại bất cứ lúc nào.',
    icon: '—',
    tone: 'muted',
  },
  pending: {
    title: 'Đang xử lý thanh toán',
    subtitle: 'Hệ thống đang xác nhận với cổng thanh toán. Vui lòng đợi vài giây rồi kiểm tra lại lịch hẹn.',
    icon: '…',
    tone: 'warn',
  },
  refunded: {
    title: 'Hoàn tiền thành công',
    subtitle: 'Số tiền đã được hoàn về phương thức thanh toán ban đầu.',
    icon: '↩',
    tone: 'info',
  },
  refund_success: {
    title: 'Hoàn tiền thành công',
    subtitle: 'Số tiền đã được hoàn về phương thức thanh toán ban đầu.',
    icon: '↩',
    tone: 'info',
  },
  refund_failed: {
    title: 'Hoàn tiền thất bại',
    subtitle: 'Không hoàn được tiền qua cổng. Vui lòng liên hệ cơ sở hoặc thử lại sau.',
    icon: '!',
    tone: 'danger',
  },
  refunding: {
    title: 'Đang xử lý hoàn tiền',
    subtitle: 'Yêu cầu hoàn tiền đã được gửi. Kết quả sẽ cập nhật trong vài phút.',
    icon: '…',
    tone: 'warn',
  },
};

const TONE_STYLE = {
  success: {
    bg: 'rgba(13,148,136,0.08)',
    border: 'rgba(13,148,136,0.28)',
    iconBg: 'rgba(13,148,136,0.15)',
    iconColor: '#0f766e',
  },
  danger: {
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.28)',
    iconBg: 'rgba(239,68,68,0.12)',
    iconColor: '#b91c1c',
  },
  info: {
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.28)',
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: '#1d4ed8',
  },
  warn: {
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#b45309',
  },
  muted: {
    bg: 'rgba(100,116,139,0.08)',
    border: 'rgba(100,116,139,0.25)',
    iconBg: 'rgba(100,116,139,0.12)',
    iconColor: '#475569',
  },
};

function safeDecode(s) {
  if (!s) return '';
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

function gatewayLabel(g) {
  const u = String(g || '').toUpperCase();
  if (u === 'VNPAY' || u === 'VN') return 'VNPay';
  if (u === 'ZALOPAY' || u === 'ZALO') return 'ZaloPay';
  return g || null;
}

function Row({ label, value, mono }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '6px 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <span style={{ color: '#64748b' }}>{label}</span>
      <span
        style={{
          fontWeight: 600,
          color: '#0f172a',
          fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit',
          fontSize: mono ? 13 : 14,
          wordBreak: 'break-all',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const [qrImage, setQrImage] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const status = (params.get('status') || params.get('vnp_ResponseCode') || '').toLowerCase();
  const normalizedStatus = useMemo(() => {
    if (status === '00' || status === 'success' || status === 'paid') return 'success';
    if (status === '24' || status === 'cancel' || status === 'cancelled') return 'cancelled';
    if (['failed', 'fail', 'error', '99'].includes(status)) return 'failed';
    if (status === 'refunded' || status === 'refund_success') return 'refunded';
    if (status === 'refund_failed') return 'refund_failed';
    if (status === 'refunding') return 'refunding';
    if (status === 'pending' || status === 'processing') return 'pending';
    if (status) return status;
    return 'pending';
  }, [status]);

  const rawMessage = safeDecode(params.get('message') || params.get('vnp_OrderInfo') || '');
  const appointmentId = params.get('appointmentId') || params.get('appt') || null;
  const amount = params.get('amount') || params.get('vnp_Amount') || null;
  const txnRef = params.get('txnRef') || params.get('vnp_TxnRef') || params.get('apptransid') || null;
  const gateway = gatewayLabel(params.get('gateway') || params.get('method') || params.get('provider'));
  const paymentId = params.get('paymentId') || null;

  const cfg = STATUS_CONFIG[normalizedStatus] || {
    title: 'Kết quả thanh toán',
    subtitle: rawMessage || 'Vui lòng kiểm tra lại trạng thái lịch hẹn.',
    icon: '?',
    tone: 'muted',
  };
  const tone = TONE_STYLE[cfg.tone] || TONE_STYLE.muted;
  const isSuccess = cfg.tone === 'success';
  const ok = isSuccess || cfg.tone === 'info';

  // Ẩn subtitle nếu trùng tiêu đề (ví dụ "Thanh toán thành công" lặp lại)
  const subtitle = useMemo(() => {
    const msg = (rawMessage || cfg.subtitle || '').trim();
    if (!msg) return '';
    if (msg.toLowerCase() === (cfg.title || '').toLowerCase()) return '';
    return msg;
  }, [rawMessage, cfg.subtitle, cfg.title]);

  const amountDisplay = useMemo(() => {
    if (!amount) return null;
    const n = Number(amount);
    if (Number.isNaN(n)) return String(amount);
    return `${n.toLocaleString('vi-VN')} đ`;
  }, [amount]);

  // Success: tải ảnh QR lịch hẹn
  useEffect(() => {
    if (!isSuccess || !appointmentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQrImage('');
      return undefined;
    }
    let cancelled = false;
    setQrLoading(true);
    getAppointmentQrCode(appointmentId)
      .then((data) => {
        if (cancelled) return;
        const img = data?.qrCodeImageBase64 || data?.qrImage || '';
        setQrImage(img);
      })
      .catch(() => {
        if (!cancelled) setQrImage('');
      })
      .finally(() => {
        if (!cancelled) setQrLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSuccess, appointmentId]);

  const qrSrc = qrImage
    ? qrImage.startsWith('data:')
      ? qrImage
      : `data:image/png;base64,${qrImage}`
    : '';

  return (
    <>
      <SlimPageHero currentLabel="Kết quả thanh toán" />
      <div className="wrap" style={{ maxWidth: 520, margin: '36px auto 64px', padding: '0 16px' }}>
        <div
          style={{
            position: 'relative',
            padding: isSuccess ? '40px 28px 32px' : '36px 28px 28px',
            borderRadius: 20,
            background: tone.bg,
            border: `1px solid ${tone.border}`,
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
          }}
        >
          {/* Mũi tên về trang chủ */}
          <Link
            to="/"
            aria-label="Về trang chủ"
            title="Về trang chủ"
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f766e',
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(13,148,136,0.2)',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>

          <div
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: tone.iconBg,
              color: tone.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
            }}
            aria-hidden
          >
            {cfg.icon}
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>
            {cfg.title}
          </h1>

          {/* Chỉ hiện subtitle khi khác tiêu đề và không phải success rỗng */}
          {subtitle && (
            <p style={{ color: '#64748b', margin: '0 0 20px', lineHeight: 1.55, fontSize: 15 }}>
              {subtitle}
            </p>
          )}

          {/* Success: hiện QR thay cho ô mã lịch hẹn */}
          {isSuccess && appointmentId && (
            <div
              style={{
                margin: subtitle ? '0 auto 8px' : '12px auto 8px',
                padding: 16,
                maxWidth: 240,
                background: '#fff',
                borderRadius: 16,
                border: '1px solid rgba(15,23,42,0.06)',
                boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
              }}
            >
              {qrLoading && (
                <p style={{ color: '#64748b', fontSize: 13, margin: '24px 0' }}>Đang tải mã QR…</p>
              )}
              {!qrLoading && qrSrc && (
                <img
                  src={qrSrc}
                  alt={`Mã QR lịch hẹn #${appointmentId}`}
                  style={{ width: '100%', maxWidth: 200, height: 'auto', display: 'block', margin: '0 auto' }}
                />
              )}
              {!qrLoading && !qrSrc && (
                <p style={{ color: '#64748b', fontSize: 13, margin: '16px 0' }}>
                  Lịch hẹn <strong>#{appointmentId}</strong>
                  <br />
                  (Chưa có ảnh QR — mở mục Lịch hẹn để xem)
                </p>
              )}
              <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                Lịch hẹn #{appointmentId}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                Quét mã để check-in tại cơ sở
              </p>
            </div>
          )}

          {/* Không success: giữ card thông tin + nút như trước */}
          {!isSuccess && (appointmentId || amountDisplay || txnRef || gateway || paymentId) && (
            <div
              style={{
                textAlign: 'left',
                background: '#fff',
                borderRadius: 14,
                border: '1px solid rgba(15,23,42,0.06)',
                padding: '14px 16px',
                marginTop: subtitle ? 0 : 12,
                marginBottom: 22,
                fontSize: 14,
              }}
            >
              {appointmentId && <Row label="Mã lịch hẹn" value={`#${appointmentId}`} />}
              {paymentId && <Row label="Mã thanh toán" value={`#${paymentId}`} />}
              {gateway && <Row label="Cổng thanh toán" value={gateway} />}
              {amountDisplay && <Row label="Số tiền" value={amountDisplay} />}
              {txnRef && <Row label="Mã giao dịch" value={txnRef} mono />}
            </div>
          )}

          {!isSuccess && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
              <Link to="/appointments" className="btn btn-primary">
                Xem lịch hẹn
              </Link>
              <Link to="/dashboard" className="btn btn-ghost">
                Về dashboard
              </Link>
              {!ok && (
                <Link to="/booking" className="btn outline">
                  Đặt lịch / thanh toán lại
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
