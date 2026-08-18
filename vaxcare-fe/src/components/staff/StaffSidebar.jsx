import { NavLink, Link } from 'react-router-dom';

const navItems = [
  {
    label: 'Vận hành',
    links: [
      {
        to: '/staff',
        end: true,
        text: 'Tổng quan',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
      {
        to: '/staff/appointments',
        text: 'Lịch hẹn & Check-in',
        count: 3,
        alert: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        ),
      },
      {
        to: '/staff/vaccination',
        text: 'Ghi nhận tiêm chủng',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 2 3 10l3 3 8-8-3-3ZM8.5 9.5 15 16M5 19l1.5-4L15 6.5 17.5 9 9 17.5 5 19Z" />
          </svg>
        ),
      },
      {
        to: '/staff/inventory',
        text: 'Kho vắc xin',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5m0-9L3 8m9 5v9M3 8v9l9 5" />
          </svg>
        ),
      },
      {
        to: '/staff/reactions',
        text: 'Theo dõi sau tiêm',
        count: 2,
        alert: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7.5-4.6-10-9.3C.6 8 2.4 4.5 6 4c2.1-.3 4 .8 6 3 2-2.2 3.9-3.3 6-3 3.6.5 5.4 4 4 7.7-2.5 4.7-10 9.3-10 9.3Z" />
          </svg>
        ),
      },
      {
        to: '/staff/reports',
        text: 'Báo cáo thống kê',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18M8 17V10M13 17V6M18 17v-4" />
          </svg>
        ),
      },
    ],
  },
];

export default function StaffSidebar() {
  return (
    <aside className="staff-sidebar">
      <Link to="/staff" className="staff-sidebar-brand">
        <span className="mark">
          <img src="/logo.png" alt="VaxCare logo" />
        </span>
        <span>
          <div className="name">VaxCare</div>
          <div className="tag">Staff Console</div>
        </span>
      </Link>

      <div className="facility-pill">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
        </svg>
        <div>
          <div className="fp-name">VaxCare Phú Nhuận</div>
          <div className="fp-sub">Ca làm việc: 07:30 – 17:00</div>
        </div>
      </div>

      <nav className="side-nav">
        {navItems.map((group) => (
          <div key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.icon}
                {link.text}
                {link.count != null && (
                  <span className={`count${link.alert ? ' alert' : ''}`}>{link.count}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="staff-chip">
          <div className="av">TM</div>
          <div className="who">
            <div className="n">BS. Trần Minh</div>
            <div className="r">Nhân viên y tế · STF-PN-001</div>
          </div>
        </div>
        <Link to="/login" className="logout-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Đăng xuất
        </Link>
      </div>
    </aside>
  );
}
