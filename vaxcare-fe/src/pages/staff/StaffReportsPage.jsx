import { useState } from 'react';
import { Link } from 'react-router-dom';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';

const WEEK = [
  { label: 'T2', val: 18, h: 55 },
  { label: 'T3', val: 22, h: 68 },
  { label: 'T4', val: 19, h: 58 },
  { label: 'T5', val: 25, h: 78 },
  { label: 'T6', val: 21, h: 65 },
  { label: 'T7', val: 16, h: 50 },
  { label: 'CN', val: 14, h: 43, today: true },
];

const MIX = [
  { name: 'Cúm mùa', pct: 22, color: '#5b8ae0' },
  { name: 'Viêm gan B', pct: 14, color: '#21b56e' },
  { name: 'HPV', pct: 12, color: '#6366f1' },
  { name: 'DTaP', pct: 11, color: '#e0a308' },
  { name: 'Phế cầu', pct: 10, color: '#e0473a' },
  { name: 'MMR', pct: 9, color: '#74b4ff' },
  { name: 'Khác', pct: 22, color: '#8b9bab' },
];

const TOP = [
  { rank: 1, name: 'Cúm mùa (Influenza)', shots: 91, pct: '22%', tag: 'info' },
  { rank: 2, name: 'Viêm gan B', shots: 58, pct: '14%', tag: 'ok' },
  { rank: 3, name: 'HPV', shots: 49, pct: '12%', tag: 'ok' },
  { rank: 4, name: 'DTaP', shots: 45, pct: '11%', tag: '' },
  { rank: 5, name: 'Phế cầu', shots: 41, pct: '10%', tag: '' },
  { rank: 6, name: 'MMR', shots: 37, pct: '9%', tag: '' },
];

export default function StaffReportsPage() {
  const { toast, showToast } = useStaffToast();
  const [range, setRange] = useState('30');

  return (
    <>
      <StaffTopbar title="Báo cáo thống kê" subtitle="Vận hành tiêm chủng · VaxCare Phú Nhuận" showSearch={false} />

      <div className="staff-content">
        <div className="filter-bar">
          <label>Khoảng</label>
          <div className="seg-tabs">
            {['7', '30', '90'].map((r) => (
              <button
                key={r}
                type="button"
                className={range === r ? 'active' : ''}
                onClick={() => {
                  setRange(r);
                  showToast(`Đã áp dụng khoảng ${r} ngày (demo tĩnh)`, 'ok');
                }}
              >
                {r} ngày
              </button>
            ))}
          </div>
          <div className="filter-right">
            <button type="button" className="btn outline" onClick={() => showToast('Chuẩn bị bản in báo cáo…', 'ok')}>
              In
            </button>
            <button type="button" className="btn primary" onClick={() => showToast('Đang xuất Excel báo cáo vận hành…', 'ok')}>
              Xuất Excel
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
              <span className="trend up">+12%</span>
            </div>
            <div className="num">486</div>
            <div className="lbl">Lịch hẹn trong kỳ</div>
          </div>
          <div className="kpi c2">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <span className="trend up">+8%</span>
            </div>
            <div className="num">412</div>
            <div className="lbl">Mũi tiêm hoàn thành</div>
          </div>
          <div className="kpi c3">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h4l2 5 4-14 2 9h6" />
                </svg>
              </span>
              <span className="trend flat">≈</span>
            </div>
            <div className="num">84.8%</div>
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
              <span className="trend down">-2%</span>
            </div>
            <div className="num">18</div>
            <div className="lbl">Hủy / Vắng mặt</div>
          </div>
          <div className="kpi c5">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-7.5-4.6-10-9.3C.6 8 2.4 4.5 6 4c2.1-.3 4 .8 6 3 2-2.2 3.9-3.3 6-3 3.6.5 5.4 4 4 7.7-2.5 4.7-10 9.3-10 9.3Z" />
                </svg>
              </span>
              <span className="trend flat">5</span>
            </div>
            <div className="num">5</div>
            <div className="lbl">Phản ứng cần theo dõi</div>
          </div>
        </section>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Lượt tiêm theo ngày</h3>
                <div className="sub">11/08 – 17/08/2026 (tuần gần nhất)</div>
              </div>
            </div>
            <div className="week-chart">
              {WEEK.map((d) => (
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
              <span>
                Trung bình <strong>19.3 mũi/ngày</strong>. Thứ Năm cao điểm (25). Cuối tuần thấp hơn — có thể mở slot
                chiều T7 nếu nhu cầu tăng.
              </span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Phễu trạng thái lịch hẹn</h3>
                <div className="sub">30 ngày gần nhất · 486 lịch</div>
              </div>
            </div>
            <div className="funnel">
              {[
                { lbl: 'Đặt lịch', w: 100, bg: 'var(--teal-500)', n: 486, p: '100%' },
                { lbl: 'Đã xác nhận', w: 92, bg: 'var(--info-dot)', n: 447, p: '92%' },
                { lbl: 'Check-in', w: 88, bg: 'var(--teal-700)', n: 428, p: '88%' },
                { lbl: 'Hoàn thành', w: 85, bg: 'var(--ok-dot)', n: 412, p: '85%' },
                { lbl: 'Hủy / Vắng', w: 4, bg: 'var(--danger-dot)', n: 18, p: '3.7%', min: 36 },
              ].map((f) => (
                <div key={f.lbl} className="funnel-row">
                  <span className="lbl">{f.lbl}</span>
                  <div className="funnel-track">
                    <div
                      className="funnel-fill"
                      style={{ width: `${f.w}%`, background: f.bg, minWidth: f.min }}
                    >
                      {f.n}
                    </div>
                  </div>
                  <span className="n">{f.p}</span>
                </div>
              ))}
            </div>
            <div className="insight">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
              </svg>
              <span>
                Rớt chủ yếu ở bước <strong>xác nhận → check-in</strong> (19 ca). Gợi ý: nhắc SMS/Zalo trước 2 giờ.
              </span>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Cơ cấu vắc xin đã tiêm</h3>
                <div className="sub">Top theo số mũi · 30 ngày</div>
              </div>
            </div>
            <div className="mix-list">
              {MIX.map((m) => (
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
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Top vắc xin theo lượt</h3>
                <div className="sub">Hoàn thành · 30 ngày</div>
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
                  {TOP.map((t) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Hiệu suất nhân viên</h3>
                <div className="sub">Số mũi ghi nhận · 30 ngày</div>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Mã</th>
                    <th>Mũi tiêm</th>
                    <th>Check-in</th>
                    <th>Phản ứng xử lý</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>BS. Trần Minh</strong>
                    </td>
                    <td className="mono">STF-PN-001</td>
                    <td className="mono">186</td>
                    <td className="mono">94</td>
                    <td className="mono">8</td>
                  </tr>
                </tbody>
              </table>
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
                { name: 'Không có / Tự khỏi', pct: 78, color: 'var(--ok-dot)' },
                { name: 'Nhẹ', pct: 16, color: 'var(--warn-dot)' },
                { name: 'Trung bình', pct: 5, color: 'var(--danger-dot)' },
                { name: 'Nặng', pct: 1, color: '#3b0a0a' },
              ].map((m) => (
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
                Tỷ lệ phản ứng cần can thiệp thấp. 2 case đang mở trên trang{' '}
                <Link to="/staff/reactions" style={{ color: 'var(--teal-700)', fontWeight: 700 }}>
                  Theo dõi sau tiêm
                </Link>
                .
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`staff-toast${toast.show ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>
        {toast.message}
      </div>
    </>
  );
}
