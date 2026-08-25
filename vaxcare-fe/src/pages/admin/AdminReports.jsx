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
  const facilityStats = report?.facilityStats || [];
  const reactionMix = report?.reactionMix || [];

  const funnelSteps = useMemo(() => {
    const kk = report?.kpi || {};
    const appts = kk.appointments ?? 0;
    const denom = appts > 0 ? appts : 1;
    const steps = [
      { lbl: 'Đặt lịch', n: appts, bg: 'var(--teal-500)' },
      { lbl: 'Đã xác nhận', n: kk.confirmed ?? 0, bg: 'var(--info-text)' },
      { lbl: 'Check-in', n: kk.checkedIn ?? 0, bg: 'var(--teal-700)' },
      { lbl: 'Hoàn thành', n: kk.completed ?? 0, bg: 'var(--ok-dot)' },
      { lbl: 'Hủy / Vắng', n: kk.cancelled ?? 0, bg: 'var(--danger-dot)' },
    ];
    return steps.map((s) => {
      const pct = Math.round((s.n / denom) * 1000) / 10;
      return { ...s, w: `${Math.min(pct, 100)}%`, pct: `${pct}%`, min: s.lbl === 'Hủy / Vắng' ? 40 : undefined };
    });
  }, [report]);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = async (kind) => {
    try {
      const opts = {
        fromDate: dateFrom,
        toDate: dateTo,
        facilityId: fac === 'all' ? undefined : Number(fac),
      };
      const blob = kind === 'summary'
        ? await adminService.exportReportSummary(opts)
        : await adminService.exportReportAppointments(opts);
      downloadBlob(blob, kind === 'summary' ? 'report-summary.csv' : 'report-appointments.csv');
      showToast('Đã xuất CSV', 'ok');
    } catch (err) {
      showToast(err.message || 'Export thất bại', 'error');
    }
  };

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
      <Topbar title="Báo cáo hệ thống" subtitle={`${dateFrom} → ${dateTo} · analytics`} showSearch={false} />
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
            <button type="button" className="btn outline" onClick={() => exportCsv('summary')}>Xuất CSV tổng hợp</button>
            <button type="button" className="btn primary" onClick={() => exportCsv('appointments')}>Xuất CSV lịch hẹn</button>
          </div>
        </div>

        <section className="kpi-row-5">
          <div className="kpi c1"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg></span></div><div className="num">{k.appointments ?? 0}</div><div className="lbl">Lịch hẹn</div></div>
          <div className="kpi c2"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></span></div><div className="num">{k.completed ?? 0}</div><div className="lbl">Hoàn thành</div></div>
          <div className="kpi c3"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l2 5 4-14 2 9h6" /></svg></span></div><div className="num">{(k.completionRate ?? 0) + '%'}</div><div className="lbl">Tỷ lệ hoàn thành</div></div>
          <div className="kpi c4"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span></div><div className="num">{(k.revenue != null ? Number(k.revenue).toLocaleString('vi-VN') + '₫' : '—')}</div><div className="lbl">Doanh thu (₫)</div></div>
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
                <div className="sub">{dateFrom} → {dateTo} · {fac === 'all' ? 'toàn mạng' : (facilities.find((f) => String(f.id) === String(fac))?.name || 'theo cơ sở')}</div>
              </div>
            </div>
            <div className="funnel">
              {funnelSteps.map((row) => (
                <div className="funnel-row" key={row.lbl}>
                  <span className="lbl">{row.lbl}</span>
                  <div className="funnel-track">
                    <div className="funnel-fill" style={{ width: row.w, background: row.bg, minWidth: row.min }}>{row.n.toLocaleString('vi-VN')}</div>
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
                Tỷ lệ hoàn thành kỳ này: <strong>{(k.completionRate ?? 0)}%</strong>. Theo dõi thêm bước có tỷ lệ rớt cao nhất để cải thiện quy trình.
              </span>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Cơ cấu vắc xin</h3>
                <div className="sub">Theo số mũi · {dateFrom} → {dateTo}</div>
              </div>
            </div>
            <div className="mix-list">
              {(ranking.length ? ranking : []).map((m, i) => {
                const palette = ['#5b8ae0', '#21b56e', '#6366f1', '#e0a308', '#e0473a', '#8b9bab', '#0ea5e9', '#a855f7', '#f97316', '#14b8a6'];
                const color = palette[i % palette.length];
                return (
                  <div className="mix-row" key={m.vaccineId ?? m.vaccineName}>
                    <div>
                      <div className="mix-label">
                        <span className="mix-dot" style={{ background: color }} />
                        {m.vaccineName}
                      </div>
                      <div className="mix-track">
                        <div className="mix-fill" style={{ width: `${m.pct}%`, background: color }} />
                      </div>
                    </div>
                    <div className="mix-pct">{m.pct}%</div>
                  </div>
                );
              })}
              {!ranking.length && <p style={{ color: 'var(--gray-500)' }}>Chưa có dữ liệu trong kỳ này.</p>}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Phản ứng sau tiêm</h3>
                <div className="sub">Phân loại mức độ · {dateFrom} → {dateTo}</div>
              </div>
            </div>
            <div className="mix-list">
              {(() => {
                const severityColor = {
                  NONE: 'var(--ok-dot)',
                  MILD: 'var(--warn-dot)',
                  MODERATE: 'var(--danger-dot)',
                  SEVERE: '#3b0a0a',
                };
                return reactionMix.map((m) => (
                  <div className="mix-row" key={m.severity}>
                    <div>
                      <div className="mix-label">
                        <span className="mix-dot" style={{ background: severityColor[m.severity] || '#8b9bab' }} />
                        {m.label}
                      </div>
                      <div className="mix-track">
                        <div className="mix-fill" style={{ width: `${m.pct}%`, background: severityColor[m.severity] || '#8b9bab' }} />
                      </div>
                    </div>
                    <div className="mix-pct">{m.pct}%</div>
                  </div>
                ));
              })()}
              {!reactionMix.length && <p style={{ color: 'var(--gray-500)' }}>Chưa có dữ liệu trong kỳ này.</p>}
            </div>
            <div className="insight">
              <span><strong>{report?.openReactions ?? 0}</strong> case đang mở trên các cơ sở. Ưu tiên theo dõi mức Trung bình+.</span>
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
                {(facilityStats.length ? facilityStats : []).map((r) => (
                    <tr key={r.facilityId}>
                      <td className="fname">{r.facilityName}</td>
                      <td className="mono">{r.appointments}</td>
                      <td className="mono">{r.completed}</td>
                      <td><span className={`tag ${r.completionRate >= 70 ? 'ok' : 'warn'}`}>{r.completionRate}%</span></td>
                      <td className="mono">{r.revenue != null ? Number(r.revenue).toLocaleString('vi-VN') : '—'}₫</td>
                      <td className="mono">{r.pending}</td>
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

      </div>

      <Overlay open={!!detail} onClose={() => setDetail(null)} />
      <Modal
        open={!!detail}
        title={detail ? `VaxCare ${detail.facilityName}` : 'Chi tiết cơ sở'}
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
            <div className="detail-row"><span className="lbl">Lịch hẹn (kỳ)</span><span className="val">{detail.appointments}</span></div>
            <div className="detail-row"><span className="lbl">Hoàn thành</span><span className="val">{detail.completed}</span></div>
            <div className="detail-row"><span className="lbl">Đang chờ</span><span className="val">{detail.pending}</span></div>
            <div className="detail-row"><span className="lbl">Tỷ lệ hoàn thành</span><span className="val">{detail.completionRate}%</span></div>
            <div className="detail-row"><span className="lbl">Doanh thu</span><span className="val">{detail.revenue != null ? Number(detail.revenue).toLocaleString('vi-VN') + '₫' : '—'}</span></div>
            <div className="detail-row">
              <span className="lbl">Ghi chú</span>
              <span className="val" style={{ fontWeight: 500, textAlign: 'left', maxWidth: '60%' }}>
                Tổng hợp từ appointments trong khoảng {dateFrom} → {dateTo}.
              </span>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}