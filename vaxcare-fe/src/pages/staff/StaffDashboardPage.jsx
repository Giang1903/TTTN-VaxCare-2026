import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';

const INITIAL_APPTS = [
  {
    id: 1,
    time: '08:00',
    initials: 'NA',
    name: 'Nguyễn An',
    ai: true,
    meta: 'Viêm gan B · Mũi 2/3 · 28 tuổi',
    status: 'completed',
    statusLabel: 'Hoàn thành',
    action: 'Xem hồ sơ',
    actionClass: 'done',
  },
  {
    id: 2,
    time: '08:30',
    initials: 'LT',
    name: 'Lê Thị Thu',
    meta: 'MMR · Mũi 1/2 · 3 tuổi',
    status: 'completed',
    statusLabel: 'Hoàn thành',
    action: 'Xem hồ sơ',
    actionClass: 'done',
  },
  {
    id: 3,
    time: '09:15',
    initials: 'PH',
    name: 'Phạm Gia Huy',
    meta: 'DTaP · Mũi 3/5 · 8 tháng',
    status: 'checkedin',
    statusLabel: 'Đã check-in',
    action: 'Ghi nhận tiêm',
    actionClass: 'solid',
  },
  {
    id: 4,
    time: '09:45',
    initials: 'TV',
    name: 'Trần Văn Khoa',
    meta: 'IPV · Mũi 2/4 · 15 tuổi',
    status: 'checkedin',
    statusLabel: 'Đã check-in',
    action: 'Ghi nhận tiêm',
    actionClass: 'solid',
  },
  {
    id: 5,
    time: '10:30',
    initials: 'HN',
    name: 'Hoàng Ngọc Mai',
    ai: true,
    meta: 'HPV · Mũi 1/2 · 16 tuổi',
    status: 'confirmed',
    statusLabel: 'Đã xác nhận',
    action: 'Check-in',
    actionClass: 'outline',
  },
  {
    id: 6,
    time: '11:00',
    initials: 'VD',
    name: 'Vũ Đình Đạt',
    meta: 'Phế cầu · Mũi 2/2 · 2 tuổi',
    status: 'pending',
    statusLabel: 'Chờ xác nhận',
    action: 'Xác nhận',
    actionClass: 'outline',
  },
  {
    id: 7,
    time: '13:30',
    initials: 'ĐL',
    name: 'Đỗ Lan Anh',
    meta: 'Thủy đậu · Mũi 1/2 · 5 tuổi',
    status: 'pending',
    statusLabel: 'Chờ xác nhận',
    action: 'Xác nhận',
    actionClass: 'outline',
  },
];

const WEEK_DATA = [
  { label: 'T2', val: 18, h: 60 },
  { label: 'T3', val: 22, h: 74 },
  { label: 'T4', val: 19, h: 63 },
  { label: 'T5', val: 25, h: 83 },
  { label: 'T6', val: 21, h: 70 },
  { label: 'T7', val: 16, h: 53 },
  { label: 'CN', val: 14, h: 47, today: true },
];

const OVERLOAD = [
  { time: '08:00', pct: 52, level: 'mid' },
  { time: '09:30', pct: 86, level: 'high' },
  { time: '11:00', pct: 31, level: 'low' },
  { time: '14:00', pct: 58, level: 'mid' },
  { time: '16:00', pct: 79, level: 'high' },
];

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useStaffToast();
  const [appts, setAppts] = useState(INITIAL_APPTS);
  const [filter, setFilter] = useState('all');

  const handleAction = (appt) => {
    if (appt.action === 'Ghi nhận tiêm') {
      navigate(`/staff/vaccination?id=${appt.id}`);
      return;
    }
    if (appt.action === 'Check-in') {
      setAppts((list) =>
        list.map((a) =>
          a.id === appt.id
            ? {
                ...a,
                status: 'checkedin',
                statusLabel: 'Đã check-in',
                action: 'Ghi nhận tiêm',
                actionClass: 'solid',
              }
            : a
        )
      );
      showToast(`Check-in thành công: ${appt.name}`, 'ok');
      return;
    }
    if (appt.action === 'Xác nhận') {
      setAppts((list) =>
        list.map((a) =>
          a.id === appt.id
            ? {
                ...a,
                status: 'confirmed',
                statusLabel: 'Đã xác nhận',
                action: 'Check-in',
                actionClass: 'outline',
              }
            : a
        )
      );
      showToast(`Đã xác nhận lịch của ${appt.name}`, 'ok');
      return;
    }
    if (appt.action === 'Xem hồ sơ') {
      navigate('/staff/appointments');
    }
  };

  const filtered = appts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'checkedin') return a.status === 'checkedin';
    if (filter === 'completed') return a.status === 'completed';
    return true;
  });

  return (
    <>
      <StaffTopbar
        title="Bảng điều khiển"
        subtitle="Thứ Ba, 17/08/2026 · Ca 07:30 – 17:00"
        searchPlaceholder="Tìm bệnh nhân, lịch hẹn..."
      />

      <div className="staff-content">
        <section className="welcome-banner">
          <div>
            <h2>Chào buổi sáng, BS. Trần Minh</h2>
            <p>
              Hôm nay có <strong>24 lịch hẹn</strong> · <strong>9 đã check-in</strong> ·{' '}
              <strong>2 cảnh báo kho</strong> cần xem.
            </p>
          </div>
          <div className="welcome-actions">
            <Link to="/staff/vaccination" className="wb-btn primary">
              Ghi nhận tiêm
            </Link>
            <Link to="/staff/appointments" className="wb-btn ghost">
              Xem lịch hẹn
            </Link>
          </div>
        </section>

        <section className="kpi-row cols-5">
          <div className="kpi-card c1">
            <div className="kpi-top">
              <span className="kpi-ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </span>
              <span className="kpi-trend up">+4</span>
            </div>
            <div className="kpi-num">24</div>
            <div className="kpi-label">Lịch hẹn hôm nay</div>
          </div>
          <div className="kpi-card c2">
            <div className="kpi-top">
              <span className="kpi-ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span className="kpi-trend flat">—</span>
            </div>
            <div className="kpi-num">9</div>
            <div className="kpi-label">Đã check-in</div>
          </div>
          <div className="kpi-card c3">
            <div className="kpi-top">
              <span className="kpi-ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="kpi-trend up">58%</span>
            </div>
            <div className="kpi-num">14</div>
            <div className="kpi-label">Đã hoàn thành mũi tiêm</div>
          </div>
          <div className="kpi-card c4">
            <div className="kpi-top">
              <span className="kpi-ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </span>
              <span className="kpi-trend warn">Cần duyệt</span>
            </div>
            <div className="kpi-num">3</div>
            <div className="kpi-label">Chờ xác nhận lịch</div>
          </div>
          <div className="kpi-card c5">
            <div className="kpi-top">
              <span className="kpi-ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </span>
              <span className="kpi-trend warn">Cảnh báo</span>
            </div>
            <div className="kpi-num">2</div>
            <div className="kpi-label">Lô vắc xin sắp hết hạn/tồn thấp</div>
          </div>
        </section>

        <section className="grid-2col">
          <div className="left-col">
            <div className="panel">
              <div className="panel-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div>
                  <h3>Lịch hẹn hôm nay</h3>
                  <div className="sub">17/08/2026 · VaxCare Phú Nhuận</div>
                </div>
                <Link to="/staff/appointments" className="panel-link">
                  Xem tất cả
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
              <div className="seg-tabs" style={{ margin: '16px 22px 0' }}>
                {[
                  { key: 'all', label: 'Tất cả (24)' },
                  { key: 'pending', label: 'Chờ xác nhận (3)' },
                  { key: 'checkedin', label: 'Đã check-in (9)' },
                  { key: 'completed', label: 'Hoàn thành (14)' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={filter === t.key ? 'active' : ''}
                    onClick={() => setFilter(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="appt-list">
                {filtered.map((a) => (
                  <div key={a.id} className="appt-row">
                    <div className="appt-time">{a.time}</div>
                    <div className="appt-who">
                      <div className="appt-av">{a.initials}</div>
                      <div className="appt-info">
                        <div className="name">
                          {a.name}
                          {a.ai && <span className="ai-tag">AI gợi ý</span>}
                        </div>
                        <div className="meta">{a.meta}</div>
                      </div>
                    </div>
                    <span className={`status-badge ${a.status}`}>
                      <span className="d" />
                      {a.statusLabel}
                    </span>
                    <button
                      type="button"
                      className={`row-action ${a.actionClass}`}
                      onClick={() => handleAction(a)}
                    >
                      {a.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Lượt tiêm trong tuần</h3>
                  <div className="sub">11/08 – 17/08/2026</div>
                </div>
                <Link to="/staff/reports" className="panel-link">
                  Báo cáo chi tiết
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
              <div className="week-chart">
                {WEEK_DATA.map((d) => (
                  <div key={d.label} className={`wc-col${d.today ? ' is-today' : ''}`}>
                    <div className="wc-val">{d.val}</div>
                    <div className="wc-bar-wrap">
                      <div
                        className={`wc-bar${d.today ? ' today' : ''}`}
                        style={{ height: `${d.h}%` }}
                      />
                    </div>
                    <div className="wc-label">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="right-col">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Dự báo quá tải (AI)</h3>
                  <div className="sub">Khung giờ hôm nay</div>
                </div>
              </div>
              <div className="mini-body">
                <div className="overload-bars">
                  {OVERLOAD.map((o) => (
                    <div key={o.time} className="ob-row">
                      <span className="ob-time">{o.time}</span>
                      <div className="ob-track">
                        <div className={`ob-fill ${o.level}`} style={{ width: `${o.pct}%` }} />
                      </div>
                      <span className="ob-pct">{o.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="ai-note">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
                  </svg>
                  <span>
                    Khung <strong>09:30</strong> dự báo quá tải 86%, thời gian chờ ước tính{' '}
                    <strong>+22 phút</strong>. Gợi ý: điều phối bớt 3–4 ca sang khung 11:00.
                  </span>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Cảnh báo kho vắc xin</h3>
                  <div className="sub">Cần xử lý sớm</div>
                </div>
                <Link to="/staff/inventory" className="panel-link">
                  Xem kho
                </Link>
              </div>
              <div className="mini-body">
                <div className="alert-item">
                  <span className="alert-ic danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  </span>
                  <div className="alert-txt">
                    <div className="t">BCG-2026-002 sắp hết hạn</div>
                    <div className="d">Hạn dùng 01/12/2027 · còn 210 liều</div>
                    <span className="tag danger" style={{ marginTop: 6 }}>
                      Ưu tiên sử dụng trước
                    </span>
                  </div>
                </div>
                <div className="alert-item">
                  <span className="alert-ic warn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5m0-9L3 8m9 5v9M3 8v9l9 5" />
                    </svg>
                  </span>
                  <div className="alert-txt">
                    <div className="t">Vắc xin HPV tồn kho thấp</div>
                    <div className="d">Dự báo nhu cầu AI: cần nhập thêm trong 5 ngày</div>
                    <span className="tag warn" style={{ marginTop: 6 }}>
                      Cảnh báo tồn kho
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Theo dõi sau tiêm</h3>
                  <div className="sub">Phản hồi cần xử lý</div>
                </div>
                <Link to="/staff/reactions" className="panel-link">
                  Xem tất cả
                </Link>
              </div>
              <div className="mini-body">
                <div className="reaction-item">
                  <div className="av">NA</div>
                  <div>
                    <div className="n">Nguyễn An</div>
                    <div className="m">Sốt nhẹ, sưng tại chỗ tiêm</div>
                  </div>
                  <span className="sev-chip mild">Nhẹ</span>
                </div>
                <div className="reaction-item">
                  <div className="av">LT</div>
                  <div>
                    <div className="n">Lê Thị Thu</div>
                    <div className="m">Phát ban, cần liên hệ theo dõi</div>
                  </div>
                  <span className="sev-chip moderate">Trung bình</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className={`staff-toast${toast.show ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>
        {toast.message}
      </div>
    </>
  );
}
