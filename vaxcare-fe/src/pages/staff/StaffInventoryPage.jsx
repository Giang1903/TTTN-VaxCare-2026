/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as staffService from '../../services/staffService';
import { useAuth } from '../../context/AuthContext';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';

export default function StaffInventoryPage() {
  const { toast, showToast } = useStaffToast();
  const { user } = useAuth();
  const facilityId = user?.facilityId;
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailBatch, setDetailBatch] = useState(null);
  const [detail, setDetail] = useState(null);

  const loadBatches = useCallback(async () => {
    if (!facilityId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await staffService.getBatches(facilityId);
      setRows((list || []).map(staffService.mapBatchToUi));
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không tải được tồn kho', 'warn');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, facilityId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBatches();
  }, [loadBatches]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab === 'low' || tab === 'expiring') {
        if (!r.f.includes(tab) && !r.f.includes('danger') && !r.f.includes('warn')) return false;
        if (tab === 'low' && !(r.fillClass === 'warn' || r.fillClass === 'danger')) return false;
        if (tab === 'expiring' && r.tag !== 'danger' && r.tag !== 'warn') return false;
      } else if (tab !== 'all' && r.f && !r.f.includes(tab)) {
        return false;
      }
      if (q && !`${r.name} ${r.batch} ${r.cat}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [tab, q, rows]);

  const openDetail = (batchCode) => {
    setDetailBatch(batchCode);
    const row = rows.find((r) => r.batch === batchCode);
    if (row) {
      setDetail({
        vax: row.vax || row.name,
        stock: row.stockLabel || `${row.stock} liều`,
        mfg: row.mfg || '',
        exp: row.exp || '',
        imp: row.imp || '',
        price: row.price || '',
        status: row.status || 'AVAILABLE',
      });
    } else {
      setDetail(null);
    }
  };
  const closeDetail = () => {
    setDetailBatch(null);
    setDetail(null);
  };

  const kpiTotal = rows.length;
  const kpiLow = rows.filter((r) => r.fillClass === 'warn' || r.fillClass === 'danger').length;
  const kpiStock = rows.reduce((s, r) => s + (r.stock || 0), 0);


  return (
    <>
      <StaffTopbar
        title="Kho vắc xin"
        subtitle="Tồn kho · Lô · Cảnh báo hết hạn"
        searchPlaceholder="Tìm vắc xin, mã lô..."
        searchValue={q}
        onSearchChange={setQ}
      />

      <div className="staff-content">
        <section className="kpi-row cols-4">
          <div className="kpi c1">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5m0-9L3 8m9 5v9M3 8v9l9 5" />
                </svg>
              </span>
            </div>
            <div className="num">{kpiStock.toLocaleString("vi-VN")}</div>
            <div className="lbl">Tổng liều tồn</div>
          </div>
          <div className="kpi c2">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </span>
            </div>
            <div className="num">{kpiLow}</div>
            <div className="lbl">Tồn thấp</div>
          </div>
          <div className="kpi c3">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </span>
            </div>
            <div className="num">{kpiLow}</div>
            <div className="lbl">Ưu tiên FEFO</div>
          </div>
          <div className="kpi c4">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18M8 17V10M13 17V6M18 17v-4" />
                </svg>
              </span>
            </div>
            <div className="num">{kpiTotal}</div>
            <div className="lbl">Số lô đang mở</div>
          </div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'low', label: 'Tồn thấp' },
              { key: 'expiring', label: 'Sắp hết hạn' },
              { key: 'ok', label: 'Đủ hàng' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={tab === t.key ? 'active' : ''}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <button type="button" className="btn outline" onClick={() => showToast('Đang xuất báo cáo tồn kho (CSV/Excel demo)…', 'ok')}>
              Xuất báo cáo
            </button>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Danh sách lô vắc xin</h3>
                <div className="sub">inventory_id = 1 · Ngưỡng cảnh báo: 50 liều</div>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vắc xin</th>
                    <th>Mã lô</th>
                    <th>Tồn</th>
                    <th>Hạn dùng</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.batch}
                      className={r.rowClass || ''}
                      style={{ cursor: 'pointer' }}
                      onDoubleClick={() => openDetail(r.batch)}
                    >
                      <td>
                        <div className="vax-name">{r.name}</div>
                        <div className="vax-cat">{r.cat}</div>
                      </td>
                      <td>
                        <span className="mono">{r.batch}</span>
                      </td>
                      <td>
                        <div className="stock-bar">
                          <div className="stock-track">
                            <div className={`stock-fill ${r.fillClass}`} style={{ width: `${r.fill}%` }} />
                          </div>
                          <span className="stock-num">{r.stock}</span>
                        </div>
                      </td>
                      <td>{r.exp}</td>
                      <td>
                        <span className={`tag ${r.tag}`}>{r.tagLabel}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="row-btn outline" onClick={() => openDetail(r.batch)}>
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Cảnh báo cần xử lý</h3>
                  <div className="sub">Từ dashboard &amp; AI dự báo</div>
                </div>
              </div>
              <div className="mini-body">
                <div className="alert-item">
                  <span className="alert-ic danger">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  </span>
                  <div className="alert-txt">
                    <div className="t">BCG-2026-002 sắp hết hạn tương đối</div>
                    <div className="d">HSD 01/12/2027 · còn 210 liều · ưu tiên FEFO</div>
                    <span className="tag danger" style={{ marginTop: 6 }}>
                      Ưu tiên sử dụng trước
                    </span>
                  </div>
                </div>
                <div className="alert-item">
                  <span className="alert-ic warn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 8 12 3 3 8m18 0-9 5m9-5v9l-9 5m0-9L3 8m9 5v9M3 8v9l9 5" />
                    </svg>
                  </span>
                  <div className="alert-txt">
                    <div className="t">HPV tồn kho thấp</div>
                    <div className="d">Còn 48 liều · AI dự báo cần nhập trong 5 ngày</div>
                    <span className="tag warn" style={{ marginTop: 6 }}>
                      Cảnh báo tồn kho
                    </span>
                  </div>
                </div>
                <div className="alert-item">
                  <span className="alert-ic info">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3v18h18M8 17V10M13 17V6M18 17v-4" />
                    </svg>
                  </span>
                  <div className="alert-txt">
                    <div className="t">Cúm mùa — mùa cao điểm</div>
                    <div className="d">Dự báo nhu cầu tăng 25% 2 tuần tới</div>
                    <span className="tag info" style={{ marginTop: 6 }}>
                      AI forecast
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Ngưỡng &amp; cấu hình</h3>
                  <div className="sub">Cơ sở Phú Nhuận</div>
                </div>
              </div>
              <div className="mini-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 13.5 }}>
                  <span style={{ color: 'var(--gray-500)' }}>Ngưỡng cảnh báo tồn</span>
                  <strong>50 liều</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`staff-overlay${detailBatch ? ' open' : ''}`} onClick={closeDetail} />
      <div className={`staff-modal${detailBatch ? ' open' : ''}`} role="dialog">
        <div className="modal-head">
          <div>
            <h3>Chi tiết lô vắc xin</h3>
            <div className="sub">{detailBatch || '—'} · VaxCare Phú Nhuận</div>
          </div>
          <button type="button" className="modal-close" onClick={closeDetail} aria-label="Đóng">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {detail && (
          <div className="modal-body">
            <div className="d-row">
              <span className="lbl">Vắc xin</span>
              <span className="val">{detail.vax}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Mã lô</span>
              <span className="val mono">{detailBatch}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Tồn kho</span>
              <span className="val">{detail.stock}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Ngày sản xuất</span>
              <span className="val">{detail.mfg}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Hạn dùng</span>
              <span className="val">{detail.exp}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Ngày nhập</span>
              <span className="val">{detail.imp}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Giá nhập (ước tính)</span>
              <span className="val">{detail.price}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Trạng thái</span>
              <span className="val">{detail.status}</span>
            </div>
            <div className="d-row">
              <span className="lbl">Cơ sở</span>
              <span className="val">VaxCare Phú Nhuận</span>
            </div>
          </div>
        )}
        <div className="modal-foot">
          <button type="button" className="btn outline" onClick={closeDetail}>
            Đóng
          </button>
        </div>
      </div>

      <div className={`staff-toast${toast.show ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>
        {toast.message}
      </div>
    </>
  );
}
