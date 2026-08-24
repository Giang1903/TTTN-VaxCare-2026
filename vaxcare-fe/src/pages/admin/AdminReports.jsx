/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Topbar from '../../components/layout/Topbar';
import { Overlay, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import * as adminService from '../../services/adminService';

export default function Reports() {
  const showToast = useToast();
  const [range, setRange] = useState('30');
  const [detail, setDetail] = useState(null);
  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  })();
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(today);
  const [fac, setFac] = useState('all');
  const [facilities, setFacilities] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [facs, rep] = await Promise.all([
        adminService.getFacilitiesAdmin().catch(() => []),
        adminService.getReport({
          fromDate: dateFrom,
          toDate: dateTo,
          facilityId: fac === 'all' ? undefined : Number(fac),
        }),
      ]);
      setFacilities((facs || []).map(adminService.mapFacilityToUi));
      setReport(rep);
    } catch (err) {
      showToast(err.message || 'Không tải được báo cáo', 'error');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [showToast, dateFrom, dateTo, fac]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const k = report?.kpi || {};
  const series = report?.dailySeries || report?.weekSeries || [];
  const max = Math.max(1, ...series.map((d) => d.count || 0));
  const ranking = report?.vaccineRanking || [];

  const applyRange = (r) => {
    setRange(r);
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (Number(r) - 1));
    const fmt = (x) => x.toISOString().slice(0, 10);
    setDateFrom(fmt(from));
    setDateTo(fmt(to));
  };


  return (
    <>
      <Topbar title="Báo cáo hệ thống" subtitle="Thứ Ba, 18/08/2026 · analytics" showSearch={false} />
      <div className="content">
        <div className="filter-bar">
          <label>Từ</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <label>Đến</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <label>Cơ sở</label>
          <select value={fac} onChange={(e) => setFac(e.target.value)}>
            <option value="all">Tất cả cơ sở</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div className="seg-tabs" style={{ marginLeft: 8 }}>
            {[
              { r: '7', label: '7 ngày' },
              { r: '30', label: '30 ngày' },
              { r: '90', label: '90 ngày' },
            ].map((t) => (
              <button
                key={t.r}
                type="button"
                className={range === t.r ? 'active' : ''}
                onClick={() => applyRange(t.r)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button className="btn outline" type="button" onClick={() => { window.print(); showToast('Đã mở hộp thoại in', 'ok'); }}>
              In
            </button>
            <button className="btn primary" type="button" onClick={() => showToast('Đang xuất Excel báo cáo hệ thống…', 'ok')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Xuất Excel
            </button>
          </div>
        </div>

        <section className="kpi-row-5">
          <div className="kpi c1"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg></span></div><div className="num">{k.appointments ?? 0}</div><div className="lbl">Lịch hẹn</div></div>
          <div className="kpi c2"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></span></div><div className="num">{k.completed ?? 0}</div><div className="lbl">Hoàn thành</div></div>
          <div className="kpi c3"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l2 5 4-14 2 9h6" /></svg></span></div><div className="num">{(k.completionRate ?? 0) + '%'}</div><div className="lbl">Tỷ lệ hoàn thành</div></div>
          <div className="kpi c4"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span></div><div className="num">{'—'}</div><div className="lbl">Doanh thu (₫)</div></div>
          <div className="kpi c1"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7.5-4.6-10-9.3C.6 8 2.4 4.5 6 4c2.1-.3 4 .8 6 3" /></svg></span></div><div className="num">{report?.openReactions ?? 0}</div><div className="lbl">Phản ứng theo dõi</div></div>
        </section>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Lượt tiêm theo ngày</h3>
                <div className="sub">{dateFrom} → {dateTo}</div>
              </div>
            </div>
            <div className="week-chart">
              {(series.length ? series : []).map((pt, i) => {
                  const h = Math.round(((pt.count || 0) / max) * 100) || 4;
                  return (
                    <div key={pt.date || i} className="wc-col">
                      <div className="wc-val">{pt.count}</div>
                      <div className="wc-bar-wrap"><div className="wc-bar" style={{ height: `${h}%` }} /></div>
                      <div className="wc-label">{pt.label}</div>
                    </div>
                  );
                })}
            </div>
            <div className="insight">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4" />
              </svg>
              <span>
                Tổng <strong>{k.appointments ?? 0}</strong> lịch trong kỳ · hoàn thành <strong>{k.completed ?? 0}</strong> ({(k.completionRate ?? 0)}%).
              </span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Phễu trạng thái lịch hẹn</h3>
                <div className="sub">30 ngày · toàn mạng</div>
              </div>
            </div>
            <div className="funnel">
              {[
                { lbl: 'Đặt lịch', w: '100%', bg: 'var(--teal-500)', n: '2,486', pct: '100%' },
                { lbl: 'Đã xác nhận', w: '92%', bg: 'var(--info-text)', n: '2,287', pct: '92%' },
                { lbl: 'Check-in', w: '88%', bg: 'var(--teal-700)', n: '2,188', pct: '88%' },
                { lbl: 'Hoàn thành', w: '85%', bg: 'var(--ok-dot)', n: '2,112', pct: '85%' },
                { lbl: 'Hủy / Vắng', w: '5%', bg: 'var(--danger-dot)', n: '98', pct: '3.9%', min: 40 },
              ].map((row) => (
                <div className="funnel-row" key={row.lbl}>
                  <span className="lbl">{row.lbl}</span>
                  <div className="funnel-track">
                    <div className="funnel-fill" style={{ width: row.w, background: row.bg, minWidth: row.min }}>{row.n}</div>
                  </div>
                  <span className="n">{row.pct}</span>
                </div>
              ))}
            </div>
            <div className="insight">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4" />
              </svg>
              <span>
                Rớt chủ yếu ở <strong>xác nhận → check-in</strong>. Gợi ý: nhắc SMS/Zalo trước 2 giờ.
              </span>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Cơ cấu vắc xin</h3>
                <div className="sub">Theo số mũi · 30 ngày</div>
              </div>
            </div>
            <div className="mix-list">
              {[
                { name: 'Cúm mùa', pct: 22, color: '#5b8ae0' },
                { name: 'Viêm gan B', pct: 14, color: '#21b56e' },
                { name: 'HPV', pct: 12, color: '#6366f1' },
                { name: 'DTaP', pct: 11, color: '#e0a308' },
                { name: 'Phế cầu', pct: 10, color: '#e0473a' },
                { name: 'Khác', pct: 31, color: '#8b9bab' },
              ].map((m) => (
                <div className="mix-row" key={m.name}>
                  <div>
                    <div className="mix-label">
                      <span className="mix-dot" style={{ background: m.color }} />
                      {m.name}
                    </div>
                    <div className="mix-track">
                      <div className="mix-fill" style={{ width: `${m.pct}%`, background: m.color }} />
                    </div>
                  </div>
                  <div className="mix-pct">{m.pct}%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Phản ứng sau tiêm</h3>
                <div className="sub">Phân loại mức độ · 30 ngày</div>
              </div>
            </div>
            <div className="mix-list">
              {[
                { name: 'Không / Tự khỏi', pct: 78, color: 'var(--ok-dot)' },
                { name: 'Nhẹ', pct: 16, color: 'var(--warn-dot)' },
                { name: 'Trung bình', pct: 5, color: 'var(--danger-dot)' },
                { name: 'Nặng', pct: 1, color: '#3b0a0a' },
              ].map((m) => (
                <div className="mix-row" key={m.name}>
                  <div>
                    <div className="mix-label">
                      <span className="mix-dot" style={{ background: m.color }} />
                      {m.name}
                    </div>
                    <div className="mix-track">
                      <div className="mix-fill" style={{ width: `${m.pct}%`, background: m.color }} />
                    </div>
                  </div>
                  <div className="mix-pct">{m.pct}%</div>
                </div>
              ))}
            </div>
            <div className="insight">
              <span>28 case đang mở trên các cơ sở. Ưu tiên theo dõi mức Trung bình+.</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Hiệu suất theo cơ sở</h3>
              <div className="sub">Click dòng để xem chi tiết</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cơ sở</th><th>Lịch hẹn</th><th>Hoàn thành</th><th>Tỷ lệ</th><th>Doanh thu</th><th>Phản ứng</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                    <tr key={r.rank}>
                      <td className="fname">{r.vaccineName}</td>
                      <td className="mono">{r.shots}</td>
                      <td className="mono">{r.rank}</td>
                      <td><span className={`tag ${r.tag === 'info' ? 'ok' : r.tag || 'neutral'}`}>{r.pct}%</span></td>
                      <td className="mono">—</td>
                      <td className="mono">—</td>
                      <td>
                        <div className="row-actions">
                          <button className="row-btn outline" type="button" onClick={() => setDetail(r)}>Chi tiết</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Top nhân viên theo mũi tiêm</h3>
              <div className="sub">30 ngày</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Nhân viên</th><th>Mã</th><th>Cơ sở</th><th>Mũi tiêm</th><th>Check-in</th><th>Phản ứng xử lý</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { rank: 1, name: 'BS. Phạm Quốc Bảo', code: 'STF-NZ-001', fac: 'Nowzone', shots: 210, checkin: 98, rx: 5 },
                  { rank: 2, name: 'BS. Trần Minh', code: 'STF-PN-001', fac: 'Phú Nhuận', shots: 186, checkin: 94, rx: 8 },
                  { rank: 3, name: 'BS. Hoàng Đức', code: 'STF-OP-001', fac: 'Oriental', shots: 175, checkin: 82, rx: 3 },
                  { rank: 4, name: 'BS. Võ Minh Châu', code: 'STF-NZ-002', fac: 'Nowzone', shots: 156, checkin: 71, rx: 4 },
                  { rank: 5, name: 'BS. Lê Hoàng Anh', code: 'STF-PN-002', fac: 'Phú Nhuận', shots: 142, checkin: 68, rx: 2 },
                ].map((s) => (
                  <tr key={s.code}>
                    <td><strong>{s.rank}</strong></td>
                    <td className="fname">{s.name}</td>
                    <td className="mono">{s.code}</td>
                    <td>{s.fac}</td>
                    <td className="mono">{s.shots}</td>
                    <td className="mono">{s.checkin}</td>
                    <td className="mono">{s.rx}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Overlay open={!!detail} onClose={() => setDetail(null)} />
      <Modal
        open={!!detail}
        title={detail ? `VaxCare ${detail.fac}` : 'Chi tiết cơ sở'}
        onClose={() => setDetail(null)}
        footer={
          <>
            <button className="btn outline" type="button" onClick={() => setDetail(null)}>Đóng</button>
            <a className="btn primary" href="/admin/facilities">Quản lý cơ sở</a>
          </>
        }
      >
        {detail && (
          <>
            <div className="detail-row"><span className="lbl">Lịch hẹn (kỳ)</span><span className="val">{detail.appt}</span></div>
            <div className="detail-row"><span className="lbl">Hoàn thành</span><span className="val">{detail.done}</span></div>
            <div className="detail-row"><span className="lbl">Tỷ lệ</span><span className="val">{Math.round((detail.done / detail.appt) * 100)}%</span></div>
            <div className="detail-row"><span className="lbl">Doanh thu ước tính</span><span className="val">{detail.rev} triệu ₫</span></div>
            <div className="detail-row"><span className="lbl">Phản ứng cần theo dõi</span><span className="val">{detail.rx}</span></div>
            <div className="detail-row">
              <span className="lbl">Ghi chú</span>
              <span className="val" style={{ fontWeight: 500, textAlign: 'left', maxWidth: '60%' }}>
                Dữ liệu demo tổng hợp từ appointments + vaccination_details + payments.
              </span>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}