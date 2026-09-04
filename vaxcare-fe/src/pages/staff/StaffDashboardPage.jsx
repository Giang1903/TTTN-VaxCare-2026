/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';
import * as staffService from '../../services/staffService';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/format';

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useStaffToast();
  const { user } = useAuth();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');


  const [weekData, setWeekData] = useState([]);
  const [overload, setOverload] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, checkedin: 0 });
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [aiNote, setAiNote] = useState('');
  const [openReactions, setOpenReactions] = useState([]);

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const loadToday = useCallback(async () => {
    setLoading(true);
    try {
      const today = staffService.formatDate(new Date());
      const facilityId = user?.facilityId;
      const [todayList, report, lowStock] = await Promise.all([
        staffService.searchAppointments({ date: today }),
        staffService.getStaffReport({ days: 7 }),
        facilityId
          ? staffService.getLowStockAlerts(facilityId).catch(() => [])
          : Promise.resolve([]),
      ]);
      const mapped = (todayList || []).map(staffService.mapAppointmentToUi);
      setAppts(mapped);
      setWeekData(
        (report?.weekSeries || []).map((d) => ({
          label: d.label,
          val: d.count,
          h: d.barHeight || 4,
          today: !!d.today,
        }))
      );
      const ov = (report?.todayOverload || []).map((o) => ({
        time: o.time,
        pct: o.pct,
        level: o.level,
        count: o.count,
      }));
      setOverload(ov);
      // AI note from busiest slot
      if (ov.length) {
        const top = [...ov].sort((a, b) => b.pct - a.pct)[0];
        if (top.pct >= 70) {
          setAiNote(
            `Khung ${top.time} đang tải cao ${top.pct}% (${top.count || 0} lịch). Gợi ý điều phối bớt ca sang khung thưa hơn.`
          );
        } else {
          setAiNote(`Hôm nay phân bố khá đều. Khung cao nhất ${top.time} (~${top.pct}%).`);
        }
      } else {
        setAiNote('Chưa có dữ liệu khung giờ cho hôm nay.');
      }
      setLowStockAlerts(
        (lowStock || []).slice(0, 5).map((s) => ({
          name: s.vaccineName || 'Vắc xin',
          total: s.totalStock ?? 0,
          threshold: s.alertThreshold,
        }))
      );
      try {
        const rx = await staffService.listReactions('PENDING');
        setOpenReactions((rx || []).slice(0, 3).map(staffService.mapReactionToUi));
      } catch {
        setOpenReactions([]);
      }
      setStats({
        total: mapped.length,
        completed: mapped.filter((a) => a.status === 'completed').length,
        pending: mapped.filter((a) => a.status === 'pending').length,
        checkedin: mapped.filter((a) => a.status === 'checkedin').length,
      });
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không tải được lịch hẹn hôm nay', 'warn');
      setAppts([]);
      setWeekData([]);
      setOverload([]);
      setLowStockAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, user?.facilityId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadToday();
  }, [loadToday]);

  const handleAction = async (appt) => {
    try {
      if (appt.status === 'pending') {
        await staffService.confirmAppointment(appt.id);
        setAppts((list) =>
          list.map((a) =>
            a.id === appt.id
              ? { ...a, status: 'confirmed', statusLabel: 'Đã xác nhận', action: 'Check-in', actionClass: 'outline' }
              : a
          )
        );
        showToast(`Đã xác nhận lịch của ${appt.name}`, 'ok');
        return;
      }
      if (appt.status === 'confirmed') {
        if (appt.qr) await staffService.checkin(appt.qr);
        setAppts((list) =>
          list.map((a) =>
            a.id === appt.id
              ? { ...a, status: 'checkedin', statusLabel: 'Đã check-in', action: 'Ghi nhận tiêm', actionClass: 'solid' }
              : a
          )
        );
        showToast(`Check-in thành công: ${appt.name}`, 'ok');
        return;
      }
      if (appt.status === 'checkedin') {
        await staffService.completeVaccination(appt.id);
        setAppts((list) =>
          list.map((a) =>
            a.id === appt.id
              ? { ...a, status: 'completed', statusLabel: 'Hoàn thành', action: 'Xem hồ sơ', actionClass: 'done' }
              : a
          )
        );
        showToast(`Đã ghi nhận tiêm cho ${appt.name}`, 'ok');
        return;
      }
      navigate('/staff/appointments');
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại', 'warn');
    }
  };

  const filtered = appts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'checkedin') return a.status === 'checkedin';
    if (filter === 'completed') return a.status === 'completed';
    return true;
  });

  const dateLabel = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const shiftOpen = user?.facilityOpeningTime ? formatTime(user.facilityOpeningTime) : '';
  const shiftClose = user?.facilityClosingTime ? formatTime(user.facilityClosingTime) : '';
  const shiftSuffix = shiftOpen && shiftClose ? ` · Ca ${shiftOpen} – ${shiftClose}` : '';

  return (
    <>
      <StaffTopbar
        title="Bảng điều khiển"
        subtitle={`${dateLabel}${shiftSuffix}`}
        searchPlaceholder="Tìm bệnh nhân, lịch hẹn..."
      />

      <div className="staff-content">
        <section className="welcome-banner">
          <div>
            <h2>
              {(() => {
                const h = new Date().getHours();
                const greet = h < 12 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
                return `${greet}, ${user?.fullName || 'đồng nghiệp'}`;
              })()}
            </h2>
            <p>
              Hôm nay có <strong>{stats.total} lịch hẹn</strong> ·{' '}
              <strong>{stats.checkedin} đã check-in</strong> ·{' '}
              <strong>{lowStockAlerts.length} cảnh báo kho</strong> cần xem.
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
            <div className="kpi-num">{stats.total}</div>
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
            <div className="kpi-num">{stats.checkedin}</div>
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
            <div className="kpi-num">{stats.completed}</div>
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
            <div className="kpi-num">{stats.pending}</div>
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
            <div className="kpi-num">{lowStockAlerts.length}</div>
            <div className="kpi-label">Lô vắc xin sắp hết hạn/tồn thấp</div>
          </div>
        </section>

        <section className="grid-2col">
          <div className="left-col">
            <div className="panel">
              <div className="panel-head" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div>
                  <h3>Lịch hẹn hôm nay</h3>
                  <div className="sub">{new Date().toLocaleDateString('vi-VN')} · {user?.facilityName || 'VaxCare'}</div>
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
                  { key: 'all', label: `Tất cả (${stats.total})` },
                  { key: 'pending', label: `Chờ xác nhận (${stats.pending})` },
                  { key: 'checkedin', label: `Đã check-in (${stats.checkedin})` },
                  { key: 'completed', label: `Hoàn thành (${stats.completed})` },
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
                  <div className="sub">7 ngày gần nhất</div>
                </div>
                <Link to="/staff/reports" className="panel-link">
                  Báo cáo chi tiết
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
              <div className="week-chart">
                {weekData.map((d) => (
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
                  {overload.map((o) => (
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
                  <span>{aiNote || 'Đang phân tích tải khung giờ…'}</span>
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
                {lowStockAlerts.length === 0 ? (
                  <div className="alert-item">
                    <span className="alert-ic" style={{ background: 'var(--ok-bg)', color: 'var(--ok-text)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <div className="alert-txt">
                      <div className="t">Không có cảnh báo tồn thấp</div>
                      <div className="d">Tồn kho trong ngưỡng an toàn</div>
                    </div>
                  </div>
                ) : (
                  lowStockAlerts.map((a) => (
                    <div key={a.name} className="alert-item">
                      <span className="alert-ic warn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                          <path d="M12 9v4M12 17h.01" />
                        </svg>
                      </span>
                      <div className="alert-txt">
                        <div className="t">{a.name} tồn thấp</div>
                        <div className="d">Còn {a.total} liều{a.threshold != null ? ` · ngưỡng ${a.threshold}` : ''}</div>
                        <span className="tag warn" style={{ marginTop: 6 }}>
                          Cảnh báo tồn kho
                        </span>
                      </div>
                    </div>
                  ))
                )}
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
                {openReactions.length === 0 ? (
                  <div className="reaction-item" style={{ opacity: 0.75 }}>
                    <div className="av">—</div>
                    <div>
                      <div className="n">Không có phản ứng cần xử lý</div>
                      <div className="m">Danh sách trống</div>
                    </div>
                  </div>
                ) : (
                  openReactions.map((r) => (
                    <div key={r.id} className="reaction-item">
                      <div className="av">{r.av}</div>
                      <div>
                        <div className="n">{r.name}</div>
                        <div className="m">{r.symptoms || r.vax}</div>
                      </div>
                      <span className={`sev-chip ${r.sev}`}>{r.sevLabel}</span>
                    </div>
                  ))
                )}
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