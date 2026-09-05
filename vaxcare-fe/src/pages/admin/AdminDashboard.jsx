/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Topbar from "../../components/layout/Topbar";
import { useToast } from "../../components/ui/Toast";
import * as adminService from '../../services/adminService';

export default function Dashboard() {
  const showToast = useToast();
  const [kpi, setKpi] = useState({ appointments: 0, completed: 0, cancelled: 0, pending: 0, completionRate: 0 });
  const [facilities, setFacilities] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [facilityStats, setFacilityStats] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [activities, setActivities] = useState([]);
  const [openReactions, setOpenReactions] = useState(0);
  const [todayLabel, setTodayLabel] = useState('');

  const load = useCallback(async () => {
    try {
      const [report, facs, users, staff, audits] = await Promise.all([
        adminService.getReport({ days: 7 }),
        adminService.getFacilitiesAdmin().catch(() => []),
        adminService.listUsers().catch(() => []),
        adminService.listStaff().catch(() => []),
        adminService.listAuditLogs({ limit: 8 }).catch(() => []),
      ]);
      const k = report?.kpi || {};
      setKpi({
        appointments: k.appointments ?? 0,
        completed: k.completed ?? 0,
        cancelled: k.cancelled ?? 0,
        pending: k.pending ?? 0,
        completionRate: k.completionRate ?? 0,
      });
      setOpenReactions(report?.openReactions ?? 0);
      setFacilities((facs || []).map(adminService.mapFacilityToUi));
      setUsersCount((users || []).length);
      setStaffCount((staff || []).length);
      setFacilityStats(report?.facilityStats || []);
      setRanking((report?.vaccineRanking || []).slice(0, 5));
      setActivities(
        (audits || []).slice(0, 8).map((log) => {
          const ui = adminService.mapAuditToUi(log);
          const act = String(ui.action || '').toUpperCase();
          let cls = 'info';
          if (act.includes('DELETE') || act.includes('FAIL') || act.includes('ERROR')) cls = 'danger';
          else if (act.includes('UPDATE') || act.includes('CREATE') || act.includes('POST')) cls = 'ok';
          else if (act.includes('WARN') || act.includes('ALERT')) cls = 'warn';
          return {
            cls,
            t: `${ui.actor}: ${ui.action}`,
            d: [ui.target, ui.t].filter(Boolean).join(' · '),
            icon: 'M12 8v4l3 3M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
          };
        })
      );
      setTodayLabel(
        new Date().toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      );
    } catch (err) {
      showToast(err.message || 'Không tải được dashboard', 'error');
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <Topbar
        title="Bảng điều khiển"
        subtitle={`${todayLabel || 'Hôm nay'} · toàn hệ thống`}
        showSearch={false}
      />
      <div className="content">
        <div className="welcome-banner">
          <div>
            <h2>Xin chào, Quản trị viên</h2>
            <p>
              7 ngày gần nhất: <strong>{kpi.appointments} lịch hẹn</strong> ·{' '}
              <strong>{kpi.completed} hoàn thành</strong> ·{' '}
              <strong>{openReactions} phản ứng cần theo dõi</strong>.
            </p>
          </div>
          <div className="welcome-actions">
            <Link to="/admin/facilities" className="wb-btn primary">Thêm cơ sở</Link>
            <Link to="/admin/reports" className="wb-btn ghost">Xem báo cáo</Link>
          </div>
        </div>

        <section className="kpi-row" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {[
            { c: 'c1', num: String(facilities.filter((f) => f.status === 'ACTIVE').length), label: 'Cơ sở đang hoạt động', trend: 'ACTIVE', trendCls: 'flat', icon: 'M3 21h18M5 21V7l7-4 7 4v14' },
            { c: 'c2', num: String(staffCount), label: 'Nhân viên y tế', trend: 'LIVE', trendCls: 'up', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
            { c: 'c3', num: String(usersCount), label: 'Người dùng đăng ký', trend: 'LIVE', trendCls: 'up', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
            { c: 'c4', num: String(kpi.appointments), label: 'Lịch hẹn (7 ngày)', trend: 'LIVE', trendCls: 'up', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z' },
            { c: 'c5', num: String(kpi.completed), label: 'Hoàn thành (7 ngày)', trend: `${kpi.completionRate}%`, trendCls: 'up', icon: 'M20 6 9 17l-5-5' },
            { c: 'c6', num: String(kpi.pending), label: 'Chờ xử lý', trend: 'Cần duyệt', trendCls: 'warn', icon: 'M12 8v4l3 3M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
          ].map((k) => (
            <div className={`kpi-card ${k.c}`} key={k.label}>
              <div className="kpi-top">
                <span className="kpi-ic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={k.icon} />
                  </svg>
                </span>
                <span className={`kpi-trend ${k.trendCls}`}>{k.trend}</span>
              </div>
              <div className="kpi-num">{k.num}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </section>

        <div className="grid-2col">
          <div>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Hiệu suất cơ sở hôm nay</h3>
                  <div className="sub">Lịch hẹn · tỷ lệ hoàn thành · tải</div>
                </div>
                <Link to="/admin/facilities" className="panel-link">
                  Xem tất cả
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
              <div className="panel-body">
                <div className="fac-row" style={{ fontSize: '11.5px', color: 'var(--gray-500)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', paddingTop: 0 }}>
                  <span>Cơ sở</span><span>Lịch</span><span>Hoàn thành</span><span>Trạng thái</span>
                </div>
                {(facilityStats.length ? facilityStats : []).map((f) => {
                  const rate = f.completionRate ?? 0;
                  const bar = Math.min(100, Math.round(rate));
                  const tag = rate >= 75 ? 'ok' : rate >= 50 ? 'warn' : 'danger';
                  const tagLabel = rate >= 75 ? 'Ổn định' : rate >= 50 ? 'Theo dõi' : 'Thấp';
                  return (
                  <div className="fac-row" key={f.facilityId}>
                    <div>
                      <div className="fname">{f.facilityName}</div>
                      <div className="faddr">Lịch {f.appointments} · HT {f.completed}</div>
                    </div>
                    <span className="mono">{f.appointments}</span>
                    <span className="mono">{f.completed}/{f.appointments}</span>
                    <span className={`tag ${tag}`}>{tagLabel}</span>
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Top vắc xin toàn mạng (7 ngày)</h3>
                  <div className="sub">Theo số mũi hoàn thành</div>
                </div>
                <Link to="/admin/vaccines" className="panel-link">Danh mục</Link>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Vắc xin</th><th>Mũi</th><th>Tỷ lệ</th><th>Tag</th></tr>
                  </thead>
                  <tbody>
                    {ranking.length === 0 ? (
                      <tr><td colSpan={5} style={{ color: 'var(--gray-500)' }}>Chưa có dữ liệu</td></tr>
                    ) : (
                      ranking.map((v, i) => (
                        <tr key={v.vaccineId || v.rank || i}>
                          <td><strong>{v.rank ?? i + 1}</strong></td>
                          <td>{v.vaccineName || v.name}</td>
                          <td className="mono">{v.shots ?? 0}</td>
                          <td className="mono">{v.pct != null ? `${v.pct}%` : '—'}</td>
                          <td><span className={`tag ${v.tag === 'warn' ? 'warn' : 'ok'}`}>{v.tag || 'ACTIVE'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Sức khỏe hệ thống</h3>
                  <div className="sub"></div>
                </div>
              </div>
              <div className="panel-body">
                <div className="health-grid">
                  <div className="health-card"><div className="lbl">Cơ sở hoạt động</div><div className="val ok">{facilities.filter((f) => f.status === 'ACTIVE').length}</div></div>
                  <div className="health-card"><div className="lbl">Tỷ lệ hoàn thành (7 ngày)</div><div className="val ok">{kpi.completionRate ?? 0}%</div></div>
                  <div className="health-card"><div className="lbl">Lịch hẹn chờ xử lý</div><div className={`val ${kpi.pending ? 'warn' : 'ok'}`}>{kpi.pending}</div></div>
                  <div className="health-card"><div className="lbl">Phản ứng mở</div><div className={`val ${openReactions ? 'warn' : 'ok'}`}>{openReactions}</div></div>
                </div>
                <div style={{ marginTop: 14, fontSize: '12.5px', color: 'var(--gray-500)' }}>
                  Số liệu lấy từ báo cáo hệ thống và danh mục cơ sở (API).
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Hoạt động gần đây</h3>
                  <div className="sub">audit_logs (API)</div>
                </div>
                <Link to="/admin/audit" className="panel-link">Nhật ký</Link>
              </div>
              <div className="panel-body" style={{ paddingTop: 8 }}>
                {activities.length === 0 ? (
                  <div style={{ color: 'var(--gray-500)', fontSize: 13.5, padding: '8px 0' }}>Chưa có nhật ký gần đây.</div>
                ) : (
                  activities.map((a, i) => (
                    <div className="act-item" key={i}>
                      <span className={`act-ic ${a.cls}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d={a.icon} />
                        </svg>
                      </span>
                      <div className="act-txt">
                        <div className="t">{a.t}</div>
                        <div className="d">{a.d}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Thao tác nhanh</h3>
                  <div className="sub">Quản trị thường dùng</div>
                </div>
              </div>
              <div className="panel-body">
                <div className="quick-grid">
                  <Link to="/admin/facilities" className="quick-btn">
                    <span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></span>
                    Thêm cơ sở
                  </Link>
                  <Link to="/admin/staff" className="quick-btn">
                    <span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></span>
                    Thêm nhân viên
                  </Link>
                  <Link to="/admin/vaccines" className="quick-btn">
                    <span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 2 3 10l3 3 8-8-3-3Z" /></svg></span>
                    Quản lý vắc xin
                  </Link>
                  {/* <Link to="/admin/config" className="quick-btn">
                    <span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2" /></svg></span>
                    Cấu hình hệ thống
                  </Link> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}