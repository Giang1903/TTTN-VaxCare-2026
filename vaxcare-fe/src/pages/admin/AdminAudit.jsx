/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Topbar from "../../components/layout/Topbar";
import { Overlay, Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import * as adminService from "../../services/adminService";

const tagMap = { VACCINATION: 'ok', INVENTORY: 'warn', USER: 'info', CONFIG: 'neutral', SECURITY: 'danger' };
const TABS = [
  { f: 'all', label: 'Tất cả' },
  { f: 'VACCINATION', label: 'Tiêm chủng' },
  { f: 'INVENTORY', label: 'Kho' },
  { f: 'USER', label: 'Tài khoản' },
  { f: 'CONFIG', label: 'Cấu hình' },
  { f: 'SECURITY', label: 'Bảo mật' },
];

export default function Audit() {
  const showToast = useToast();
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.listAuditLogs({ limit: 300 });
      setLogs((data || []).map(adminService.mapAuditToUi));
    } catch (err) {
      showToast(err.message || 'Không tải được nhật ký', 'error');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const qq = q.toLowerCase();
    return logs.filter((l) => {
      if (filter !== 'all' && l.cat !== filter) return false;
      if (!qq) return true;
      return (l.actor + l.action + l.target + l.scope).toLowerCase().includes(qq);
    });
  }, [filter, q, logs]);

  const kpiTotal = logs.length;
  const kpiVaccination = logs.filter((l) => l.cat === 'VACCINATION').length;
  const kpiConfig = logs.filter((l) => l.cat === 'CONFIG').length;
  const kpiSecurity = logs.filter((l) => l.cat === 'SECURITY').length;

  return (
    <>
      <Topbar
        title="Nhật ký audit"
        subtitle="Thứ Ba, 18/08/2026 · audit_logs"
        showSearch={false}
      />
      <div className="content">
        <section className="kpi-row">
          <div className="kpi c1">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16h12V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </span>
            </div>
            <div className="num">{kpiTotal}</div>
            <div className="lbl">Tổng sự kiện</div>
          </div>
          <div className="kpi c2">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </div>
            <div className="num">{kpiVaccination}</div>
            <div className="lbl">Ghi nhận tiêm</div>
          </div>
          <div className="kpi c3">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
            </div>
            <div className="num">{kpiConfig}</div>
            <div className="lbl">Cấu hình / giá</div>
          </div>
          <div className="kpi c4">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17" />
                </svg>
              </span>
            </div>
            <div className="num">{kpiSecurity}</div>
            <div className="lbl">Sự kiện bảo mật</div>
          </div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {TABS.map((t) => (
              <button
                key={t.f}
                type="button"
                className={filter === t.f ? 'active' : ''}
                onClick={() => setFilter(t.f)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <div className="search-box" style={{ width: 240 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Tìm action, actor…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button className="btn outline" type="button" onClick={() => showToast('Xuất nhật ký audit…', 'ok')}>
              Xuất
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Nhật ký audit</h3>
              <div className="sub">audit_logs · {rows.length} bản ghi</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người thực hiện</th>
                  <th>Hành động</th>
                  <th>Đối tượng</th>
                  <th>Phạm vi</th>
                  <th>Loại</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setDetail(l)}>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{l.t}</td>
                    <td className="fname">{l.actor}</td>
                    <td>{l.action}</td>
                    <td style={{ maxWidth: 220 }}>{l.target}</td>
                    <td>{l.scope}</td>
                    <td>
                      <span className={`tag ${tagMap[l.cat] || 'neutral'}`}>{l.cat}</span>
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
        title={detail?.action || 'Chi tiết sự kiện'}
        onClose={() => setDetail(null)}
        footer={
          <button className="btn outline" type="button" onClick={() => setDetail(null)}>
            Đóng
          </button>
        }
      >
        {detail && (
          <>
            <div className="detail-row"><span className="lbl">Thời gian</span><span className="val">{detail.t}</span></div>
            <div className="detail-row"><span className="lbl">Người thực hiện</span><span className="val">{detail.actor}</span></div>
            <div className="detail-row"><span className="lbl">Hành động</span><span className="val">{detail.action}</span></div>
            <div className="detail-row"><span className="lbl">Đối tượng</span><span className="val">{detail.target}</span></div>
            <div className="detail-row"><span className="lbl">Phạm vi</span><span className="val">{detail.scope}</span></div>
            <div className="detail-row">
              <span className="lbl">Loại</span>
              <span className="val">
                <span className={`tag ${tagMap[detail.cat] || 'neutral'}`}>{detail.cat}</span>
              </span>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}