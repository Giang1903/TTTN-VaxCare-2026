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

  const load = useCallback(async () => {
    try {
      const [report, facs, users, staff] = await Promise.all([
        adminService.getReport({ days: 7 }),
        adminService.getFacilitiesAdmin().catch(() => []),
        adminService.listUsers().catch(() => []),
        adminService.listStaff().catch(() => []),
      ]);
      const k = report?.kpi || {};
      setKpi({
        appointments: k.appointments ?? 0,
        completed: k.completed ?? 0,
        cancelled: k.cancelled ?? 0,
        pending: k.pending ?? 0,
        completionRate: k.completionRate ?? 0,
      });
      setFacilities((facs || []).map(adminService.mapFacilityToUi));
      setUsersCount((users || []).length);
      setStaffCount((staff || []).length);
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
        subtitle="Thứ Ba, 18/08/2026 · toàn hệ thống"
        searchPlaceholder="Tìm cơ sở, nhân viên, user…"
        onSearch={(v) => {
          if (v) showToast('Tìm kiếm: ' + v + ' (demo)', 'ok');
        }}
      />
      <div className="content">
        <div className="welcome-banner">
          <div>
            <h2>Xin chào, Quản trị viên</h2>
            <p>
              Hệ thống đang hoạt động ổn định. Hôm nay có <strong>186 lịch hẹn</strong> toàn mạng và{' '}
              <strong>5 cảnh báo kho</strong> cần xử lý.
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
                {[
                  { name: 'VaxCare Phú Nhuận', addr: '198 Hoàng Văn Thụ · capacity 15/slot', bar: 78, appt: 24, done: '14/24', tag: 'warn', tagLabel: 'Cao tải' },
                  { name: 'VaxCare Nowzone', addr: '235 Nguyễn Văn Cừ · capacity 18/slot', bar: 62, appt: 31, done: '22/31', tag: 'ok', tagLabel: 'Ổn định' },
                  { name: 'VaxCare Thủ Đức', addr: 'Bình Chiểu · capacity 12/slot', bar: 45, appt: 18, done: '11/18', tag: 'ok', tagLabel: 'Ổn định' },
                  { name: 'VaxCare Oriental Plaza', addr: '685 Âu Cơ, Tân Phú · capacity 14/slot', bar: 55, appt: 21, done: '15/21', tag: 'ok', tagLabel: 'Ổn định' },
                  { name: 'VaxCare Hóc Môn', addr: 'Đông Thạnh · capacity 10/slot', bar: 30, appt: 9, done: '6/9', tag: 'info', tagLabel: 'Thấp tải' },
                ].map((f) => (
                  <div className="fac-row" key={f.name}>
                    <div>
                      <div className="fname">{f.name}</div>
                      <div className="faddr">{f.addr}</div>
                      <div className="bar-mini"><span style={{ width: `${f.bar}%` }} /></div>
                    </div>
                    <span className="mono">{f.appt}</span>
                    <span className="mono">{f.done}</span>
                    <span className={`tag ${f.tag}`}>{f.tagLabel}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Top vắc xin toàn mạng (30 ngày)</h3>
                  <div className="sub">Theo số mũi hoàn thành</div>
                </div>
                <Link to="/admin/vaccines" className="panel-link">Danh mục</Link>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Vắc xin</th><th>Mũi</th><th>Doanh thu</th><th>Trạng thái</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { rank: 1, name: 'Cúm mùa (Influenza)', shots: 412, rev: '185.4tr', tag: 'ok', status: 'ACTIVE' },
                      { rank: 2, name: 'Viêm gan B', shots: 286, rev: '71.5tr', tag: 'ok', status: 'ACTIVE' },
                      { rank: 3, name: 'HPV (Gardasil 9)', shots: 198, rev: '354.4tr', tag: 'warn', status: 'Tồn thấp' },
                      { rank: 4, name: 'DTaP', shots: 175, rev: '91.0tr', tag: 'ok', status: 'ACTIVE' },
                      { rank: 5, name: 'Zona (Shingrix)', shots: 64, rev: '204.8tr', tag: 'ok', status: 'ACTIVE' },
                    ].map((v) => (
                      <tr key={v.rank}>
                        <td><strong>{v.rank}</strong></td>
                        <td>{v.name}</td>
                        <td className="mono">{v.shots}</td>
                        <td className="mono">{v.rev}</td>
                        <td><span className={`tag ${v.tag}`}>{v.status}</span></td>
                      </tr>
                    ))}
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
                  <div className="sub">system_configs · realtime</div>
                </div>
              </div>
              <div className="panel-body">
                <div className="health-grid">
                  <div className="health-card"><div className="lbl">API / Backend</div><div className="val ok">99.8%</div></div>
                  <div className="health-card"><div className="lbl">Thời gian phản hồi</div><div className="val ok">142ms</div></div>
                  <div className="health-card"><div className="lbl">Lịch hẹn chờ duyệt</div><div className="val warn">27</div></div>
                  <div className="health-card"><div className="lbl">Phản ứng mở</div><div className="val warn">8</div></div>
                </div>
                <div style={{ marginTop: 14, fontSize: '12.5px', color: 'var(--gray-500)' }}>
                  Cấu hình: đặt lịch trước tối đa <strong>30 ngày</strong> · QR prefix <strong>VXC</strong> · tiền tệ <strong>VND</strong>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Hoạt động gần đây</h3>
                  <div className="sub">audit_logs (demo)</div>
                </div>
                <Link to="/admin/audit" className="panel-link">Nhật ký</Link>
              </div>
              <div className="panel-body" style={{ paddingTop: 8 }}>
                {[
                  { cls: 'ok', t: 'BS. Trần Minh ghi nhận tiêm DTaP', d: 'Phú Nhuận · 09:22 · vaccination_details', icon: 'M20 6 9 17l-5-5' },
                  { cls: 'warn', t: 'Yêu cầu nhập kho HPV — Phú Nhuận', d: '48 liều còn lại · ưu tiên CAO · 08:45', icon: 'M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5' },
                  { cls: 'info', t: 'Tài khoản staff mới: STF-NZ-004', d: 'VaxCare Nowzone · 08:10', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
                  { cls: 'danger', t: 'Cảnh báo HSD: BCG-2026-002', d: 'Ưu tiên FEFO · còn 210 liều', icon: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01' },
                  { cls: 'ok', t: 'Cập nhật bảng giá HPV', d: '1.790.000₫ · hiệu lực 01/08/2026', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
                ].map((a, i) => (
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
                ))}
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
                  <Link to="/admin/config" className="quick-btn">
                    <span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2" /></svg></span>
                    Cấu hình hệ thống
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}