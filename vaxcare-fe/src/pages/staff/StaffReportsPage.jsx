import { useCallback, useEffect, useState } from 'react';
import * as staffService from '../../services/staffService';
import { Link } from 'react-router-dom';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';
import { useAuth } from '../../context/AuthContext';

export default function StaffReportsPage() {
  const { user } = useAuth();
  const facilityName = user?.facilityName || 'Cơ sở tiêm chủng';
  const { toast, showToast } = useStaffToast();
  const [range, setRange] = useState('30');
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  })();
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(todayStr);
  const [customMode, setCustomMode] = useState(false);
  const [kpi, setKpi] = useState({
    appointments: 0,
    completed: 0,
    cancelled: 0,
    checkedin: 0,
    pending: 0,
    confirmed: 0,
    completionRate: 0,
  });
  const [periodLabel, setPeriodLabel] = useState('30 ngày');
  const [weekLabel, setWeekLabel] = useState('7 ngày gần nhất');
  const [weekInsight, setWeekInsight] = useState('Chưa có dữ liệu lượt tiêm theo ngày.');
  const [funnelInsight, setFunnelInsight] = useState('Chưa có dữ liệu phễu trạng thái.');

  const [week, setWeek] = useState([]);
  const [mix, setMix] = useState([]);
  const [top, setTop] = useState([]);
  const [reactionMix, setReactionMix] = useState([]);
  const [openReactions, setOpenReactions] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      let report;
      if (customMode) {
        report = await staffService.getStaffReport({ fromDate, toDate });
      } else {
        const days = Number(range) || 30;
        report = await staffService.getStaffReport({ days });
      }
      const k = report?.kpi || {};
      const appts = Number(k.appointments ?? 0);
      const completed = Number(k.completed ?? 0);
      const cancelled = Number(k.cancelled ?? 0);
      const checkedIn = Number(k.checkedIn ?? 0);
      const pending = Number(k.pending ?? 0);
      const confirmed = Number(k.confirmed ?? 0);
      const completionRate =
        k.completionRate != null
          ? Number(k.completionRate)
          : appts
            ? Math.round((completed / appts) * 1000) / 10
            : 0;
      setKpi({
        appointments: appts,
        completed,
        cancelled,
        checkedin: checkedIn,
        pending,
        confirmed,
        completionRate,
      });

      // Period labels from API or filter
      const fmt = (s) => {
        if (!s) return '';
        const str = String(s);
        if (str.includes('-')) {
          const [y, m, d] = str.slice(0, 10).split('-');
          return `${d}/${m}/${y}`;
        }
        return str;
      };
      if (report?.fromDate && report?.toDate) {
        setPeriodLabel(`${fmt(report.fromDate)} – ${fmt(report.toDate)}`);
      } else if (customMode) {
        setPeriodLabel(`${fmt(fromDate)} – ${fmt(toDate)}`);
      } else {
        setPeriodLabel(`${Number(range) || 30} ngày gần nhất`);
      }

      const weekSeries = report?.weekSeries || [];
      setWeek(
        weekSeries.map((d) => ({
          label: d.label,
          val: d.count,
          h: d.barHeight || 4,
          today: !!d.today,
        }))
      );
      if (weekSeries.length) {
        const first = weekSeries[0];
        const last = weekSeries[weekSeries.length - 1];
        setWeekLabel(
          first?.date && last?.date
            ? `${fmt(first.date)} – ${fmt(last.date)}`
            : '7 ngày gần nhất'
        );
        const total = weekSeries.reduce((s, d) => s + Number(d.count || 0), 0);
        const avg = Math.round((total / weekSeries.length) * 10) / 10;
        const peak = [...weekSeries].sort((a, b) => Number(b.count) - Number(a.count))[0];
        setWeekInsight(
          total
            ? `Trung bình ${avg} mũi/ngày. Cao nhất ${peak?.label || ''} (${peak?.count ?? 0}).`
            : 'Chưa có lượt tiêm trong 7 ngày gần nhất.'
        );
      } else {
        setWeekLabel('7 ngày gần nhất');
        setWeekInsight('Chưa có dữ liệu lượt tiêm theo ngày.');
      }

      // Funnel insight from real KPI
      const dropConfirmToCheckin = Math.max(0, confirmed - checkedIn);
      const dropCheckinToDone = Math.max(0, checkedIn - completed);
      if (appts === 0) {
        setFunnelInsight('Chưa có lịch hẹn trong khoảng đã chọn.');
      } else if (dropConfirmToCheckin >= dropCheckinToDone && dropConfirmToCheckin > 0) {
        setFunnelInsight(
          `Rớt chủ yếu ở bước xác nhận → check-in (${dropConfirmToCheckin} ca). Gợi ý nhắc lịch trước giờ tiêm.`
        );
      } else if (dropCheckinToDone > 0) {
        setFunnelInsight(
          `Rớt chủ yếu ở bước check-in → hoàn thành (${dropCheckinToDone} ca). Kiểm tra quy trình ghi nhận tiêm.`
        );
      } else {
        setFunnelInsight(
          `Tỷ lệ hoàn thành ${completionRate}%. Hủy/vắng: ${cancelled} ca.`
        );
      }

      const ranking = report?.vaccineRanking || [];
      const colors = ['#5b8ae0', '#21b56e', '#6366f1', '#e0a308', '#e0473a', '#74b4ff', '#8b9bab'];
      setMix(
        ranking.map((x, i) => ({
          name: x.vaccineName,
          pct: x.pct,
          color: colors[i % colors.length],
        }))
      );
      setTop(
        ranking.map((x) => ({
          rank: x.rank,
          name: x.vaccineName,
          shots: x.shots,
          pct: `${x.pct}%`,
          tag: x.tag || '',
        }))
      );
      const rMix = report?.reactionMix || [];
      const colorBySev = {
        NONE: 'var(--ok-dot)',
        MILD: 'var(--warn-dot)',
        MODERATE: 'var(--danger-dot)',
        SEVERE: '#3b0a0a',
      };
      setReactionMix(
        rMix.map((r) => ({
          name: r.label,
          pct: r.pct,
          color: colorBySev[r.severity] || 'var(--ok-dot)',
        }))
      );
      setOpenReactions(report?.openReactions ?? 0);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không tải được số liệu báo cáo', 'warn');
    }
  }, [showToast, range, customMode, fromDate, toDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
  }, [loadStats]);


  return (
    <>
      <StaffTopbar title="Báo cáo thống kê" subtitle={`Vận hành tiêm chủng · ${facilityName}`} showSearch={false} />

      <div className="staff-content">
        <div className="filter-bar">
          <label>Khoảng</label>
          <div className="seg-tabs">
            {['7', '30', '90'].map((r) => (
              <button
                key={r}
                type="button"
                className={!customMode && range === r ? 'active' : ''}
                onClick={() => {
                  setCustomMode(false);
                  setRange(r);
                  showToast(`Đã áp dụng khoảng ${r} ngày`, 'ok');
                }}
              >
                {r} ngày
              </button>
            ))}
            <button
              type="button"
              className={customMode ? 'active' : ''}
              onClick={() => setCustomMode(true)}
            >
              Tùy chọn
            </button>
          </div>
          {customMode && (
            <div className="filter-group" style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
              <label className="date-picker">
                <input
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </label>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>→</span>
              <label className="date-picker">
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  max={todayStr}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn primary"
                style={{ height: 36 }}
                onClick={() => {
                  loadStats();
                  showToast(`Báo cáo ${fromDate} → ${toDate}`, 'ok');
                }}
              >
                Áp dụng
              </button>
            </div>
          )}
          <div className="filter-right">
            <button
              type="button"
              className="btn outline"
              onClick={async () => {
                try {
                  const opts = customMode
                    ? { fromDate, toDate }
                    : { days: Number(range) || 30 };
                  await staffService.exportSummaryCsv(opts);
                  showToast('Đã tải CSV tổng hợp', 'ok');
                } catch (err) {
                  showToast(err.message || 'Xuất CSV thất bại', 'warn');
                }
              }}
            >
              Xuất tổng hợp
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={async () => {
                try {
                  const opts = customMode
                    ? { fromDate, toDate }
                    : { days: Number(range) || 30 };
                  await staffService.exportAppointmentsCsv(opts);
                  showToast('Đã tải CSV lịch hẹn', 'ok');
                } catch (err) {
                  showToast(err.message || 'Xuất CSV thất bại', 'warn');
                }
              }}
            >
              Xuất lịch hẹn CSV
            </button>
          </div>
        </div>

        <section className="kpi-row cols-5">
          <div className="kpi c1">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </span>
            </div>
            <div className="num">{kpi.appointments}</div>
            <div className="lbl">Tổng lịch hẹn</div>
          </div>
          <div className="kpi c2">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </div>
            <div className="num">{kpi.completed}</div>
            <div className="lbl">Mũi tiêm hoàn thành</div>
          </div>
          <div className="kpi c3">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h4l2 5 4-14 2 9h6" />
                </svg>
              </span>
            </div>
            <div className="num">{kpi.completionRate}%</div>
            <div className="lbl">Tỷ lệ hoàn thành</div>
          </div>
          <div className="kpi c4">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </span>
            </div>
            <div className="num">{kpi.cancelled}</div>
            <div className="lbl">Hủy / Vắng mặt</div>
          </div>
          <div className="kpi c5">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-7.5-4.6-10-9.3C.6 8 2.4 4.5 6 4c2.1-.3 4 .8 6 3 2-2.2 3.9-3.3 6-3 3.6.5 5.4 4 4 7.7-2.5 4.7-10 9.3-10 9.3Z" />
                </svg>
              </span>
            </div>
            <div className="num">{openReactions}</div>
            <div className="lbl">Phản ứng cần theo dõi</div>
          </div>
        </section>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Lượt tiêm theo ngày</h3>
                <div className="sub">{weekLabel}</div>
              </div>
            </div>
            <div className="week-chart">
              {week.map((d) => (
                <div key={d.label} className={`wc-col${d.today ? ' is-today' : ''}`}>
                  <div className="wc-val">{d.val}</div>
                  <div className="wc-bar-wrap">
                    <div className={`wc-bar${d.today ? ' today' : ''}`} style={{ height: `${d.h}%` }} />
                  </div>
                  <div className="wc-label">{d.label}</div>
                </div>
              ))}
            </div>
            <div className="insight">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
              </svg>
              <span>{weekInsight}</span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Phễu trạng thái lịch hẹn</h3>
                <div className="sub">{periodLabel} · {kpi.appointments} lịch</div>
              </div>
            </div>
            <div className="funnel">
              {(() => {
                const total = kpi.appointments || 0;
                const pct = (n) => (total ? Math.round((n / total) * 1000) / 10 : 0);
                const w = (n) => (total ? Math.max(4, Math.round((n / total) * 100)) : 0);
                const rows = [
                  { lbl: 'Đặt lịch', n: total, bg: 'var(--teal-500)' },
                  { lbl: 'Đã xác nhận', n: kpi.confirmed || 0, bg: 'var(--info-dot)' },
                  { lbl: 'Check-in', n: kpi.checkedin || 0, bg: 'var(--teal-700)' },
                  { lbl: 'Hoàn thành', n: kpi.completed || 0, bg: 'var(--ok-dot)' },
                  { lbl: 'Hủy / Vắng', n: kpi.cancelled || 0, bg: 'var(--danger-dot)' },
                ];
                return rows.map((f) => (
                  <div key={f.lbl} className="funnel-row">
                    <span className="lbl">{f.lbl}</span>
                    <div className="funnel-track">
                      <div
                        className="funnel-fill"
                        style={{ width: `${w(f.n)}%`, background: f.bg, minWidth: f.n ? 28 : 0 }}
                      >
                        {f.n}
                      </div>
                    </div>
                    <span className="n">{pct(f.n)}%</span>
                  </div>
                ));
              })()}
            </div>
            <div className="insight">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
              </svg>
              <span>{funnelInsight}</span>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Cơ cấu vắc xin đã tiêm</h3>
                <div className="sub">Top theo số mũi · {periodLabel}</div>
              </div>
            </div>
            <div className="mix-list">
              {mix.length === 0 ? (
                <div className="sub" style={{ padding: '12px 0' }}>Chưa có dữ liệu vắc xin trong khoảng này.</div>
              ) : (
                mix.map((m) => (
                  <div key={m.name} className="mix-row">
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
                ))
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Top vắc xin theo lượt</h3>
                <div className="sub">Hoàn thành · {periodLabel}</div>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Vắc xin</th>
                    <th>Mũi</th>
                    <th>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {top.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ color: 'var(--gray-500)' }}>
                        Chưa có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    top.map((t) => (
                      <tr key={t.rank}>
                        <td>
                          <span className={`rank${t.rank <= 3 ? ' top' : ''}`}>{t.rank}</span>
                        </td>
                        <td>{t.name}</td>
                        <td className="mono">{t.shots}</td>
                        <td>
                          <span className={`tag ${t.tag}`}>{t.pct}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Phản ứng sau tiêm</h3>
              <div className="sub">Phân loại mức độ · {periodLabel}</div>
            </div>
          </div>
          <div className="mix-list">
            {(reactionMix.length
              ? reactionMix
              : [
                  { name: 'Không có / Tự khỏi', pct: 0, color: 'var(--ok-dot)' },
                  { name: 'Nhẹ', pct: 0, color: 'var(--warn-dot)' },
                  { name: 'Trung bình', pct: 0, color: 'var(--danger-dot)' },
                  { name: 'Nặng', pct: 0, color: '#3b0a0a' },
                ]
            ).map((m) => (
              <div key={m.name} className="mix-row">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
            </svg>
            <span>
              Tỷ lệ phản ứng cần can thiệp. {openReactions} case đang mở trên trang{' '}
              <Link to="/staff/reactions" style={{ color: 'var(--teal-700)', fontWeight: 700 }}>
                Theo dõi sau tiêm
              </Link>
              .
            </span>
          </div>
        </div>
      </div>

      <div className={`staff-toast${toast.show ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>
        {toast.message}
      </div>
    </>
  );
}
