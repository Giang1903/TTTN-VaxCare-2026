import { useCallback, useEffect, useState } from 'react';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';
import { getMyNotifications, markAllNotificationsRead } from '../../services/notificationService';

function formatDt(d) {
  if (!d) return '';
  const s = String(d);
  if (s.includes('T')) {
    const [date, time] = s.split('T');
    const [y, m, day] = date.split('-');
    return `${day}/${m}/${y} ${time?.slice(0, 5) || ''}`;
  }
  return s;
}

function typeLabel(t) {
  const u = String(t || '').toUpperCase();
  if (u.includes('REMINDER') || u.includes('DOSE')) return 'Nhắc lịch';
  if (u.includes('PAYMENT')) return 'Thanh toán';
  if (u.includes('SYSTEM')) return 'Hệ thống';
  return t || 'Thông báo';
}

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Vào trang xem = đánh dấu đã đọc → badge chuông về 0
      await markAllNotificationsRead();
      const data = await getMyNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không tải được thông báo.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <>
      <SlimPageHero currentLabel="Thông báo" />

      <div className="wrap" style={{ margin: '0 auto', padding: '8px 20px 56px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>
            Thông báo & nhắc lịch
          </h1>
          <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.6 }}>
            Hệ thống tự gửi <strong style={{ color: '#1e293b' }}>email nhắc mũi tiêm</strong> (cron 8:00 mỗi
            ngày, trước ngày tiêm theo phác đồ). Dưới đây là thông báo trong ứng dụng.
          </p>
        </div>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #e8eef5',
            boxShadow: '0 8px 28px rgba(15,23,42,0.05)',
            padding: '8px 0',
            minHeight: 200,
          }}
        >
          {loading && <p style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>Đang tải…</p>}
          {!loading && items.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ fontWeight: 700, color: '#475569', marginBottom: 6 }}>Chưa có thông báo</p>
              <p style={{ fontSize: 13.5, color: '#94a3b8', maxWidth: 360, margin: '0 auto' }}>
                Khi gần đến ngày mũi tiếp theo hoặc có cập nhật thanh toán, thông báo sẽ hiện tại đây và
                email sẽ được gửi.
              </p>
            </div>
          )}
          {!loading &&
            items.map((n) => (
              <div
                key={n.notificationId}
                style={{
                  padding: '16px 22px',
                  borderBottom: '1px solid #f1f5f9',
                  opacity: n.isRead ? 0.75 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: '#0284c7',
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                    }}
                  >
                    {typeLabel(n.type)}
                  </span>
                  <span style={{ fontSize: 12.5, color: '#94a3b8' }}>{formatDt(n.sentAt)}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>
                  {n.title || 'Thông báo'}
                </div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{n.content}</div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}