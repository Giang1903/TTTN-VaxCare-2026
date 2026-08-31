import { Link } from 'react-router-dom';

const items = [
  {
    to: '/booking',
    title: 'Đặt lịch tiêm',
    desc: 'Chọn cơ sở & khung giờ',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M12 14v4M10 16h4" /></svg>
    ),
  },
  {
    to: '/record',
    title: 'Hồ sơ điện tử',
    desc: 'Lịch sử & chứng nhận',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
    ),
  },
  {
    to: '/appointments',
    title: 'Lịch của tôi',
    desc: 'Xem / đổi ngày-giờ lịch hẹn',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
    ),
  },
  {
    to: '/reactions',
    title: 'Phản ứng sau tiêm',
    desc: 'Báo cáo 24–72 giờ sau tiêm',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" /></svg>
    ),
  },
];

// ============ QUICK ACTIONS ============
export default function QuickActions() {
  return (
    <div className="quick-grid">
      {items.map((it) => (
        <Link to={it.to} className="quick-card" key={it.to}>
          <div className="qi">{it.icon}</div>
          <h4>{it.title}</h4>
          <p>{it.desc}</p>
        </Link>
      ))}
    </div>
  );
}