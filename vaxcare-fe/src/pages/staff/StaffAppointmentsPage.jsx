import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';
import { useAuth } from '../../context/AuthContext';
import * as staffService from '../../services/staffService';

const STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  checkedin: 'Đã check-in',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  noshow: 'Vắng mặt',
};

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
  const { user } = useAuth();
  const facilityName = user?.facilityName || 'Cơ sở tiêm chủng';
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const { toast, showToast } = useStaffToast();
  const [appts, setAppts] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [drawer, setDrawer] = useState({ open: false, mode: 'view', apptId: null });
  const [manualQr, setManualQr] = useState('');
  const [noteDraft, setNoteDraft] = useState('');

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const list = await staffService.searchAppointments({ date });
      setAppts((list || []).map(staffService.mapAppointmentToUi));
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không tải được danh sách lịch hẹn', 'warn');
      setAppts([]);
    } finally {
      setLoading(false);
    }
  }, [date, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAppointments();
  }, [loadAppointments]);

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

  const updateLocal = (id, status) => {
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

  const handleAction = async (appt, action) => {
    if (action === 'view') {
      openView(appt);
      return;
    }
    try {
      if (action === 'confirm') {
        await staffService.confirmAppointment(appt.id);
        updateLocal(appt.id, 'confirmed');
        showToast(`Đã xác nhận lịch của ${appt.name}`, 'ok');
        return;
      }
      if (action === 'checkin') {
        if (appt.qr) {
          await staffService.checkin(appt.qr);
        }
        updateLocal(appt.id, 'checkedin');
        showToast(`Check-in thành công: ${appt.name}`, 'ok');
        return;
      }
      if (action === 'cancel') {
        // Dùng ghi chú nhân viên đã nhập (nếu có, và cùng lịch hẹn đang mở) làm lý do hủy;
        // nếu không có thì dùng lý do mặc định — đồng bộ với ô "Ghi chú" trên drawer chi tiết.
        const reason =
          drawer.apptId === appt.id && noteDraft.trim() ? noteDraft.trim() : 'Từ chối bởi nhân viên';
        await staffService.cancelAppointment(appt.id, reason);
        updateLocal(appt.id, 'cancelled');
        showToast(`Đã từ chối / hủy lịch của ${appt.name}`, 'warn');
        return;
      }
      if (action === 'vaccinate') {
        await staffService.completeVaccination(appt.id);
        updateLocal(appt.id, 'completed');
        showToast(`Đã ghi nhận tiêm cho ${appt.name}`, 'ok');
        return;
      }
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại', 'warn');
    }
  };

  const handleManualCheckin = async () => {
    const code = (manualQr || '').trim();
    if (!code) {
      showToast('Vui lòng nhập mã QR.', 'warn');
      return;
    }
    try {
      const res = await staffService.checkin(code);
      const mapped = staffService.mapAppointmentToUi(res);
      setAppts((list) => {
        const idx = list.findIndex((a) => a.id === mapped.id);
        if (idx >= 0) {
          const next = [...list];
          next[idx] = { ...mapped, highlight: true };
          return next;
        }
        return [mapped, ...list];
      });
      showToast(`Đã check-in: ${mapped.name}`, 'ok');
      setNoteDraft(mapped.note || '');
      setDrawer({ open: true, mode: 'view', apptId: mapped.id });
    } catch (err) {
      showToast(err.message || 'Check-in thất bại', 'warn');
    }
  };

  const doScan = handleManualCheckin;


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
        subtitle={`Danh sách đầy đủ · ${facilityName}`}
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
