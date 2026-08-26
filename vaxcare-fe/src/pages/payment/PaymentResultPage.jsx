import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const status = (params.get('status') || '').toLowerCase();
  const message = params.get('message') || '';
  const appointmentId = params.get('appointmentId');

  const ok = status === 'success';

  const title = useMemo(() => {
    if (ok) return 'Thanh toán thành công';
    if (status === 'failed') return 'Thanh toán thất bại';
    return 'Kết quả thanh toán';
  }, [ok, status]);

  return (
    <>
      <SlimPageHero currentLabel="Thanh toán" />
      <div className="wrap" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
        <div
          style={{
            padding: 32,
            borderRadius: 16,
            background: ok ? 'rgba(13,148,136,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${ok ? 'rgba(13,148,136,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>{ok ? '✓' : '✕'}</div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>{title}</h1>
          {message && (
            <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>{decodeURIComponent(message)}</p>
          )}
          {appointmentId && (
            <p style={{ fontSize: 14, marginBottom: 24 }}>
              Mã lịch hẹn: <strong>#{appointmentId}</strong>
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/appointments" className="btn btn-primary">
              Xem lịch hẹn
            </Link>
            <Link to="/dashboard" className="btn btn-ghost">
              Về dashboard
            </Link>
            {!ok && (
              <Link to="/booking" className="btn outline">
                Đặt lịch lại
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
