import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';

const STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checkedin: 'Đã check-in',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  noshow: 'Vắng mặt',
};

const INITIAL = [
  {
    id: 1,
    time: '08:00',
    slotNote: 'Đã xong',
    name: 'Nguyễn An',
    initials: 'NA',
    age: '28 tuổi · Nam',
    phone: '0901234567',
    vaccine: 'Viêm gan B',
    dose: 'Mũi 2/3',
    price: '250.000₫',
    qr: 'VXC-20260817-001',
    status: 'completed',
    ai: true,
    note: 'Đã tiêm thành công, không phản ứng bất thường.',
  },
  {
    id: 2,
    time: '08:30',
    slotNote: 'Đã xong',
    name: 'Lê Thị Thu',
    initials: 'LT',
    age: '3 tuổi · Nữ',
    phone: 'Phụ huynh: 0912345678',
    vaccine: 'MMR',
    dose: 'Mũi 1/2',
    price: '350.000₫',
    qr: 'VXC-20260817-002',
    status: 'completed',
    ai: false,
    note: '',
  },
  {
    id: 3,
    time: '09:15',
    slotNote: 'Đang chờ tiêm',
    name: 'Phạm Gia Huy',
    initials: 'PH',
    age: '8 tháng · Nam',
    phone: 'Phụ huynh: 0987654321',
    vaccine: 'DTaP',
    dose: 'Mũi 3/5',
    price: '520.000₫',
    qr: 'VXC-20260817-003',
    status: 'checkedin',
    ai: false,
    note: 'Đã check-in lúc 09:08. Chờ gọi vào phòng tiêm.',
    highlight: true,
  },
  {
    id: 4,
    time: '09:45',
    slotNote: 'Đang chờ tiêm',
    name: 'Trần Văn Khoa',
    initials: 'TV',
    age: '15 tuổi · Nam',
    phone: '0933111222',
    vaccine: 'IPV',
    dose: 'Mũi 2/4',
    price: '390.000₫',
    qr: 'VXC-20260817-004',
    status: 'checkedin',
    ai: false,
    note: '',
    highlight: true,
  },
  {
    id: 5,
    time: '10:30',
    slotNote: 'Sắp tới',
    name: 'Hoàng Ngọc Mai',
    initials: 'HN',
    age: '16 tuổi · Nữ',
    phone: '0909888777',
    vaccine: 'HPV',
    dose: 'Mũi 1/2',
    price: '1.790.000₫',
    qr: 'VXC-20260817-005',
    status: 'confirmed',
    ai: true,
    note: 'AI gợi ý theo độ tuổi và lịch tiêm quốc gia.',
  },
  {
    id: 6,
    time: '11:00',
    slotNote: 'Chờ duyệt',
    name: 'Vũ Đình Đạt',
    initials: 'VD',
    age: '2 tuổi · Nam',
    phone: 'Phụ huynh: 0911222333',
    vaccine: 'Phế cầu',
    dose: 'Mũi 2/2',
    price: '1.150.000₫',
    qr: 'VXC-20260817-006',
    status: 'pending',
    ai: false,
    note: 'Đặt online, chờ nhân viên xác nhận.',
  },
  {
    id: 7,
    time: '13:30',
    slotNote: 'Chờ duyệt',
    name: 'Đỗ Lan Anh',
    initials: 'ĐL',
    age: '5 tuổi · Nữ',
    phone: 'Phụ huynh: 0977444555',
    vaccine: 'Thủy đậu',
    dose: 'Mũi 1/2',
    price: '850.000₫',
    qr: 'VXC-20260817-007',
    status: 'pending',
    ai: false,
    note: '',
  },
  {
    id: 8,
    time: '14:00',
    slotNote: 'Đã xác nhận',
    name: 'Nguyễn Minh Quân',
    initials: 'NM',
    age: '42 tuổi · Nam',
    phone: '0905555666',
    vaccine: 'Cúm mùa',
    dose: 'Mũi 1/1',
    price: '450.000₫',
    qr: 'VXC-20260817-008',
    status: 'confirmed',
    ai: false,
    note: '',
  },
  {
    id: 9,
    time: '14:45',
    slotNote: 'Chờ duyệt',
    name: 'Huỳnh Thị Bình',
    initials: 'HT',
    age: '55 tuổi · Nữ',
    phone: '0922333444',
    vaccine: 'Zona (Shingrix)',
    dose: 'Mũi 1/2',
    price: '3.200.000₫',
    qr: 'VXC-20260817-009',
    status: 'pending',
    ai: false,
    note: 'Người cao tuổi – ưu tiên slot chiều.',
  },
  {
    id: 10,
    time: '15:30',
    slotNote: 'Đã hủy',
    name: 'Phan Thành Đạt',
    initials: 'PT',
    age: '31 tuổi · Nam',
    phone: '0944555666',
    vaccine: 'COVID-19',
    dose: 'Mũi 2/2',
    price: '550.000₫',
    qr: 'VXC-20260817-010',
    status: 'cancelled',
    ai: false,
    note: 'Lý do hủy: bận công việc đột xuất.',
  },
];

function countsOf(list) {
  return {
    all: list.length,
    pending: list.filter((a) => a.status === 'pending').length,
    confirmed: list.filter((a) => a.status === 'confirmed').length,
    checkedin: list.filter((a) => a.status === 'checkedin').length,
    completed: list.filter((a) => a.status === 'completed').length,
    cancelled: list.filter((a) => a.status === 'cancelled' || a.status === 'noshow').length,
  };
}

function RowActions({ status, onAction }) {
  if (status === 'pending') {
    return (
      <div className="row-actions">
        <button type="button" className="row-action solid" onClick={() => onAction('confirm')}>
          Xác nhận
        </button>
        <button type="button" className="row-action danger" onClick={() => onAction('cancel')}>
          Từ chối
        </button>
      </div>
    );
  }
  if (status === 'confirmed') {
    return (
      <div className="row-actions">
        <button type="button" className="row-action solid" onClick={() => onAction('checkin')}>
          Check-in
        </button>
        <button type="button" className="row-action outline" onClick={() => onAction('view')}>
          Chi tiết
        </button>
      </div>
    );
  }
  if (status === 'checkedin') {
    return (
      <div className="row-actions">
        <button type="button" className="row-action solid" onClick={() => onAction('vaccinate')}>
          Ghi nhận tiêm
        </button>
        <button type="button" className="row-action outline" onClick={() => onAction('view')}>
          Chi tiết
        </button>
      </div>
    );
  }
  if (status === 'cancelled' || status === 'noshow') {
    return (
      <div className="row-actions">
        <button type="button" className="row-action done" onClick={() => onAction('view')}>
          Xem lý do
        </button>
      </div>
    );
  }
  return (
    <div className="row-actions">
      <button type="button" className="row-action done" onClick={() => onAction('view')}>
        Xem hồ sơ
      </button>
    </div>
  );
}

export default function StaffAppointmentsPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useStaffToast();
  const [appts, setAppts] = useState(INITIAL);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [date, setDate] = useState('2026-08-17');
  const [drawer, setDrawer] = useState({ open: false, mode: 'view', apptId: null });
  const [manualQr, setManualQr] = useState('');
  const [noteDraft, setNoteDraft] = useState('');

  const counts = useMemo(() => countsOf(appts), [appts]);

  const filtered = useMemo(() => {
    return appts.filter((a) => {
      if (tab === 'cancelled') {
        if (!(a.status === 'cancelled' || a.status === 'noshow')) return false;
      } else if (tab !== 'all' && a.status !== tab) return false;
      if (q) {
        const hay = `${a.name} ${a.vaccine} ${a.qr} ${a.phone} ${a.time}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [appts, tab, q]);

  const updateStatus = (id, status) => {
    setAppts((list) =>
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              highlight: status === 'checkedin',
              slotNote:
                status === 'checkedin'
                  ? 'Đang chờ tiêm'
                  : status === 'confirmed'
                    ? 'Đã xác nhận'
                    : status === 'completed'
                      ? 'Đã xong'
                      : status === 'cancelled'
                        ? 'Đã hủy'
                        : status === 'pending'
                          ? 'Chờ duyệt'
                          : a.slotNote,
            }
          : a
      )
    );
  };

  const openView = (appt) => {
    setNoteDraft(appt.note || '');
    setDrawer({ open: true, mode: 'view', apptId: appt.id });
  };

  const openScan = () => {
    setManualQr('');
    setDrawer({ open: true, mode: 'scan', apptId: null });
  };

  const closeDrawer = () => setDrawer({ open: false, mode: 'view', apptId: null });

  const handleAction = (appt, action) => {
    if (action === 'view') {
      openView(appt);
      return;
    }
    if (action === 'confirm') {
      updateStatus(appt.id, 'confirmed');
      showToast(`Đã xác nhận lịch của ${appt.name}`, 'ok');
      return;
    }
    if (action === 'checkin') {
      updateStatus(appt.id, 'checkedin');
      showToast(`Check-in thành công: ${appt.name}`, 'ok');
      return;
    }
    if (action === 'cancel') {
      updateStatus(appt.id, 'cancelled');
      showToast(`Đã từ chối / hủy lịch của ${appt.name}`, 'warn');
      return;
    }
    if (action === 'vaccinate') {
      showToast('Chuyển sang trang Ghi nhận tiêm chủng…', 'ok');
      setTimeout(() => navigate(`/staff/vaccination?id=${appt.id}`), 400);
    }
  };

  const doScan = () => {
    const code = manualQr.trim().toUpperCase();
    const found = appts.find((a) => a.qr === code);
    if (!found) {
      showToast('Không tìm thấy lịch hẹn với mã QR này.', 'warn');
      return;
    }
    if (found.status === 'confirmed') {
      updateStatus(found.id, 'checkedin');
      showToast(`Đã check-in: ${found.name}`, 'ok');
      setNoteDraft(found.note || '');
      setDrawer({ open: true, mode: 'view', apptId: found.id });
    } else if (found.status === 'checkedin') {
      showToast(`${found.name} đã check-in rồi.`, 'warn');
      setNoteDraft(found.note || '');
      setDrawer({ open: true, mode: 'view', apptId: found.id });
    } else {
      showToast(
        `Trạng thái hiện tại không cho phép check-in (${STATUS_LABEL[found.status]}).`,
        'warn'
      );
      setNoteDraft(found.note || '');
      setDrawer({ open: true, mode: 'view', apptId: found.id });
    }
  };

  const drawerAppt = drawer.apptId ? appts.find((a) => a.id === drawer.apptId) : null;

  const tabs = [
    { key: 'all', label: 'Tất cả', n: counts.all },
    { key: 'pending', label: 'Chờ xác nhận', n: counts.pending },
    { key: 'confirmed', label: 'Đã xác nhận', n: counts.confirmed },
    { key: 'checkedin', label: 'Đã check-in', n: counts.checkedin },
    { key: 'completed', label: 'Hoàn thành', n: counts.completed },
    { key: 'cancelled', label: 'Hủy / Vắng', n: counts.cancelled },
  ];

  return (
    <>
      <StaffTopbar
        title="Lịch hẹn & Check-in"
        subtitle="Danh sách đầy đủ · VaxCare Phú Nhuận"
        searchPlaceholder="Tìm lịch hẹn, bệnh nhân..."
        searchValue={q}
        onSearchChange={setQ}
      />

      <div className="staff-content">
        <div className="page-toolbar">
          <div className="filter-group">
            <label className="date-picker">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <div className="seg-tabs">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={tab === t.key ? 'active' : ''}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                  <span className="n">({t.n})</span>
                </button>
              ))}
            </div>
          </div>
          <div className="toolbar-actions">
            <button
              type="button"
              className="btn outline"
              onClick={() => showToast('Đã làm mới danh sách lịch hẹn', 'ok')}
            >
              Làm mới
            </button>
            <button type="button" className="btn primary" onClick={openScan}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <path d="M14 14h3v3h-3zM20 14v6M14 20h6" />
              </svg>
              Quét QR Check-in
            </button>
          </div>
        </div>

        <div className="stats-strip">
          {[
            { cls: 's-all', num: counts.all, lbl: 'Tổng lịch', icon: 'calendar' },
            { cls: 's-pending', num: counts.pending, lbl: 'Chờ xác nhận', icon: 'clock' },
            { cls: 's-confirmed', num: counts.confirmed, lbl: 'Đã xác nhận', icon: 'check' },
            { cls: 's-checkedin', num: counts.checkedin, lbl: 'Đã check-in', icon: 'user' },
            { cls: 's-done', num: counts.completed, lbl: 'Hoàn thành', icon: 'done' },
            { cls: 's-cancel', num: counts.cancelled, lbl: 'Hủy / Vắng', icon: 'x' },
          ].map((s) => (
            <div key={s.cls} className={`stat-pill ${s.cls}`}>
              <span className="ic">
                {s.icon === 'calendar' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                )}
                {s.icon === 'clock' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                )}
                {s.icon === 'check' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
                {s.icon === 'user' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                )}
                {s.icon === 'done' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
                {s.icon === 'x' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                )}
              </span>
              <div>
                <div className="num">{s.num}</div>
                <div className="lbl">{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Danh sách lịch hẹn</h3>
              <div className="sub">
                Ngày {date.split('-').reverse().join('/')} · {filtered.length} kết quả
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="appt-table">
              <thead>
                <tr>
                  <th>Giờ</th>
                  <th>Người dân</th>
                  <th>Vắc xin</th>
                  <th>Mã QR</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className={a.highlight || a.status === 'checkedin' ? 'highlight' : ''}
                  >
                    <td className="time-cell">
                      {a.time}
                      <span className="slot-note">{a.slotNote}</span>
                    </td>
                    <td>
                      <div className="who-cell">
                        <div className="who-av">{a.initials}</div>
                        <div className="who-info">
                          <div className="name">
                            {a.name}
                            {a.ai && <span className="ai-tag">AI gợi ý</span>}
                          </div>
                          <div className="meta">
                            {a.age} · {a.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="vax-cell">
                      <div className="vname">{a.vaccine}</div>
                      <div className="vdose">
                        {a.dose} · {a.price}
                      </div>
                    </td>
                    <td>
                      <span className="qr-code">{a.qr}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${a.status}`}>
                        <span className="d" />
                        {STATUS_LABEL[a.status]}
                      </span>
                    </td>
                    <td>
                      <RowActions status={a.status} onAction={(act) => handleAction(a, act)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              Hiển thị <strong>1–{filtered.length}</strong> trên tổng <strong>{appts.length}</strong>{' '}
              lịch hẹn
            </span>
            <div className="pagination">
              <button type="button" aria-label="Trước">
                ‹
              </button>
              <button type="button" className="active">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button" aria-label="Sau">
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`overlay${drawer.open ? ' open' : ''}`} onClick={closeDrawer} />
      <aside className={`drawer${drawer.open ? ' open' : ''}`} role="dialog">
        <div className="drawer-head">
          <div>
            <h3>{drawer.mode === 'scan' ? 'Quét QR Check-in' : 'Chi tiết lịch hẹn'}</h3>
            <div className="sub">
              {drawer.mode === 'scan'
                ? 'Nhập hoặc quét mã QR của người dân'
                : drawerAppt
                  ? `${drawerAppt.qr} · ${STATUS_LABEL[drawerAppt.status]}`
                  : '—'}
            </div>
          </div>
          <button type="button" className="drawer-close" onClick={closeDrawer} aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {drawer.mode === 'scan' && (
          <>
            <div className="drawer-body">
              <div className="scan-zone">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <path d="M14 14h3v3h-3zM20 14v6M14 20h6" />
                </svg>
                <p>
                  <strong>Đưa mã QR trên điện thoại / phiếu hẹn</strong>
                  <br />
                  vào vùng camera (demo: nhập mã thủ công bên dưới)
                </p>
              </div>
              <div className="drawer-section">
                <h4>Nhập mã QR</h4>
                <input
                  type="text"
                  className="note-box"
                  style={{ minHeight: 'auto', height: 44 }}
                  placeholder="Ví dụ: VXC-20260817-005"
                  value={manualQr}
                  onChange={(e) => setManualQr(e.target.value)}
                />
              </div>
            </div>
            <div className="drawer-foot">
              <button type="button" className="btn outline" onClick={closeDrawer}>
                Hủy
              </button>
              <button type="button" className="btn primary" onClick={doScan}>
                Tìm &amp; Check-in
              </button>
            </div>
          </>
        )}

        {drawer.mode === 'view' && drawerAppt && (
          <>
            <div className="drawer-body">
              <div className="patient-card">
                <div className="av">{drawerAppt.initials}</div>
                <div>
                  <div className="n">
                    {drawerAppt.name}
                    {drawerAppt.ai && (
                      <>
                        {' '}
                        <span className="ai-tag">AI gợi ý</span>
                      </>
                    )}
                  </div>
                  <div className="m">
                    {drawerAppt.age} · {drawerAppt.phone}
                  </div>
                </div>
              </div>
              <div className="drawer-section">
                <h4>Thông tin lịch hẹn</h4>
                <div className="detail-row">
                  <span className="lbl">Giờ hẹn</span>
                  <span className="val">{drawerAppt.time}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Vắc xin</span>
                  <span className="val">{drawerAppt.vaccine}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Mũi tiêm</span>
                  <span className="val">{drawerAppt.dose}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Giá</span>
                  <span className="val">{drawerAppt.price}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Mã QR</span>
                  <span className="val">
                    <span className="qr-code">{drawerAppt.qr}</span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Trạng thái</span>
                  <span className="val">{STATUS_LABEL[drawerAppt.status]}</span>
                </div>
              </div>
              <div className="drawer-section">
                <h4>Ghi chú</h4>
                <textarea
                  className="note-box"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Ghi chú của nhân viên..."
                />
              </div>
            </div>
            <div className="drawer-foot">
              {drawerAppt.status === 'pending' && (
                <>
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => {
                      handleAction(drawerAppt, 'cancel');
                      closeDrawer();
                    }}
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      handleAction(drawerAppt, 'confirm');
                      closeDrawer();
                    }}
                  >
                    Xác nhận lịch
                  </button>
                </>
              )}
              {drawerAppt.status === 'confirmed' && (
                <>
                  <button type="button" className="btn outline" onClick={closeDrawer}>
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      handleAction(drawerAppt, 'checkin');
                      closeDrawer();
                    }}
                  >
                    Check-in ngay
                  </button>
                </>
              )}
              {drawerAppt.status === 'checkedin' && (
                <>
                  <button type="button" className="btn outline" onClick={closeDrawer}>
                    Đóng
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => {
                      handleAction(drawerAppt, 'vaccinate');
                      closeDrawer();
                    }}
                  >
                    Ghi nhận tiêm
                  </button>
                </>
              )}
              {(drawerAppt.status === 'completed' ||
                drawerAppt.status === 'cancelled' ||
                drawerAppt.status === 'noshow') && (
                <button type="button" className="btn outline" style={{ flex: 1 }} onClick={closeDrawer}>
                  Đóng
                </button>
              )}
            </div>
          </>
        )}
      </aside>

      <div className={`staff-toast${toast.show ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>
        {toast.message}
      </div>
    </>
  );
}
