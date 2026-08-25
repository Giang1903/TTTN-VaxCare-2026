/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as staffService from '../../services/staffService';
import * as vaccineService from '../../services/vaccineService';
import { useAuth } from '../../context/AuthContext';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';

const EMPTY_BATCH_FORM = {
  vaccineId: '',
  batchNumber: '',
  importedQuantity: '',
  manufactureDate: '',
  expiryDate: '',
  importDate: '',
  importPrice: '',
};

export default function StaffInventoryPage() {
  const { toast, showToast } = useStaffToast();
  const { user } = useAuth();
  const facilityId = user?.facilityId;
  const facilityName = user?.facilityName || 'Cơ sở tiêm chủng';
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailBatch, setDetailBatch] = useState(null);
  const [detail, setDetail] = useState(null);

  const [vaccines, setVaccines] = useState([]);
  const [alertThreshold, setAlertThreshold] = useState(null);
  const [thresholdDraft, setThresholdDraft] = useState('');
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [savingThreshold, setSavingThreshold] = useState(false);

  const [showAddBatch, setShowAddBatch] = useState(false);
  const [batchForm, setBatchForm] = useState(EMPTY_BATCH_FORM);
  const [savingBatch, setSavingBatch] = useState(false);

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

  const loadThreshold = useCallback(async () => {
    if (!facilityId) return;
    try {
      const summary = await staffService.getStockSummary(facilityId);
      const first = (summary || [])[0];
      setAlertThreshold(first?.alertThreshold ?? null);
    } catch (err) {
      console.error(err);
    }
  }, [facilityId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBatches();
    loadThreshold();
  }, [loadBatches, loadThreshold]);

  useEffect(() => {
    let cancelled = false;
    vaccineService
      .searchVaccines({ facilityId })
      .then((list) => {
        if (!cancelled) setVaccines(list || []);
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [facilityId]);

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

  /** Cảnh báo thật từ tồn kho (không hardcode) */
  const realAlerts = useMemo(() => {
    const thr = alertThreshold != null ? Number(alertThreshold) : null;
    const items = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const r of rows) {
      const stock = r.stock ?? 0;
      const status = String(r.status || '').toUpperCase();
      // parse exp dd/mm/yyyy
      let daysLeft = null;
      if (r.exp && r.exp.includes('/')) {
        const [dd, mm, yyyy] = r.exp.split('/').map(Number);
        const expD = new Date(yyyy, mm - 1, dd);
        daysLeft = Math.ceil((expD - today) / (1000 * 60 * 60 * 24));
      }

      if (status === 'EXPIRED' || (daysLeft != null && daysLeft < 0)) {
        items.push({
          key: `exp-${r.id}`,
          cls: 'danger',
          t: `${r.batch || r.name} đã hết hạn`,
          d: `HSD ${r.exp || '—'} · còn ${stock} liều`,
          tag: 'Hết hạn',
          tagCls: 'danger',
          sort: 0,
        });
      } else if (status === 'NEAR_EXPIRY' || (daysLeft != null && daysLeft <= 90)) {
        items.push({
          key: `near-${r.id}`,
          cls: 'danger',
          t: `${r.batch || r.name} sắp hết hạn`,
          d: `HSD ${r.exp || '—'} · còn ${stock} liều · ưu tiên FEFO`,
          tag: 'Ưu tiên sử dụng trước',
          tagCls: 'danger',
          sort: 1,
          daysLeft: daysLeft ?? 999,
        });
      }

      const isLow =
        (thr != null && stock > 0 && stock < thr) ||
        r.fillClass === 'warn' ||
        r.fillClass === 'danger';
      if (isLow && stock > 0 && status !== 'EXPIRED') {
        items.push({
          key: `low-${r.id}`,
          cls: 'warn',
          t: `${r.name || r.vax} tồn kho thấp`,
          d: thr != null
            ? `Còn ${stock} liều · dưới ngưỡng ${thr}`
            : `Còn ${stock} liều · cần theo dõi`,
          tag: 'Cảnh báo tồn kho',
          tagCls: 'warn',
          sort: 2,
        });
      }
    }

    // Ưu tiên: hết hạn > sắp hết (gần nhất) > tồn thấp; tối đa 8
    items.sort((a, b) => {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
    });
    const seen = new Set();
    const unique = [];
    for (const it of items) {
      if (seen.has(it.key)) continue;
      seen.add(it.key);
      unique.push(it);
      if (unique.length >= 8) break;
    }
    return unique;
  }, [rows, alertThreshold]);

  const kpiFefo = realAlerts.filter((a) => a.sort <= 1).length;

  const openAddBatch = () => {
    setBatchForm(EMPTY_BATCH_FORM);
    setShowAddBatch(true);
  };
  const closeAddBatch = () => setShowAddBatch(false);

  const submitAddBatch = async () => {
    if (!facilityId) {
      showToast('Không xác định được cơ sở của bạn', 'warn');
      return;
    }
    if (!batchForm.vaccineId || !batchForm.batchNumber.trim() || !batchForm.expiryDate || !batchForm.importedQuantity) {
      showToast('Vui lòng nhập đủ vắc xin, số lô, số lượng và hạn dùng', 'warn');
      return;
    }
    setSavingBatch(true);
    try {
      await staffService.importBatch({
        facilityId,
        vaccineId: batchForm.vaccineId,
        batchNumber: batchForm.batchNumber.trim(),
        manufactureDate: batchForm.manufactureDate,
        expiryDate: batchForm.expiryDate,
        importedQuantity: batchForm.importedQuantity,
        importPrice: batchForm.importPrice,
        importDate: batchForm.importDate,
      });
      showToast('Đã nhập lô vắc xin mới', 'ok');
      setShowAddBatch(false);
      // Đồng bộ lại danh sách + tồn kho sau khi thêm lô
      await loadBatches();
      await loadThreshold();
    } catch (err) {
      showToast(err.message || 'Nhập lô vắc xin thất bại', 'warn');
    } finally {
      setSavingBatch(false);
    }
  };

  const startEditThreshold = () => {
    setThresholdDraft(alertThreshold != null ? String(alertThreshold) : '');
    setEditingThreshold(true);
  };
  const cancelEditThreshold = () => setEditingThreshold(false);

  const saveThreshold = async () => {
    if (!facilityId) return;
    const value = Number(thresholdDraft);
    if (thresholdDraft === '' || Number.isNaN(value) || value < 0) {
      showToast('Ngưỡng cảnh báo không hợp lệ', 'warn');
      return;
    }
    setSavingThreshold(true);
    try {
      await staffService.updateAlertThreshold(facilityId, value);
      setAlertThreshold(value);
      setEditingThreshold(false);
      showToast('Đã cập nhật ngưỡng cảnh báo tồn kho', 'ok');
      // Đồng bộ lại danh sách lô vì trạng thái "tồn thấp" phụ thuộc ngưỡng
      await loadBatches();
    } catch (err) {
      showToast(err.message || 'Cập nhật ngưỡng cảnh báo thất bại', 'warn');
    } finally {
      setSavingThreshold(false);
    }
  };


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
            <div className="num">{kpiFefo}</div>
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
<button type="button" className="btn primary" onClick={openAddBatch}>
              + Thêm lô vắc xin
            </button>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Danh sách lô vắc xin</h3>
                <div className="sub">
                  {kpiTotal} lô đang mở
                  {alertThreshold != null ? ` · Ngưỡng cảnh báo: ${alertThreshold} liều` : ''}
                </div>
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
                  <div className="sub">Từ tồn kho thực tế · {facilityName}</div>
                </div>
              </div>
              <div className="mini-body">
                {realAlerts.length === 0 ? (
                  <div style={{ padding: '12px 0', fontSize: 13.5, color: 'var(--gray-500)' }}>
                    Không có cảnh báo tồn thấp / hết hạn.
                  </div>
                ) : (
                  realAlerts.map((a) => (
                    <div className="alert-item" key={a.key}>
                      <span className={`alert-ic ${a.cls}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {a.cls === 'warn' ? (
                            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z M12 9v4M12 17h.01" />
                          ) : (
                            <>
                              <circle cx="12" cy="12" r="9" />
                              <path d="M12 7v5l3 3" />
                            </>
                          )}
                        </svg>
                      </span>
                      <div className="alert-txt">
                        <div className="t">{a.t}</div>
                        <div className="d">{a.d}</div>
                        <span className={`tag ${a.tagCls}`} style={{ marginTop: 6 }}>
                          {a.tag}
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
                  <h3>Ngưỡng &amp; cấu hình</h3>
                  <div className="sub">{facilityName}</div>
                </div>
              </div>
              <div className="mini-body">
                {!editingThreshold ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', fontSize: 13.5 }}>
                    <span style={{ color: 'var(--gray-500)' }}>Ngưỡng cảnh báo tồn</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong>{alertThreshold != null ? `${alertThreshold} liều` : '—'}</strong>
                      <button type="button" className="row-btn outline" onClick={startEditThreshold}>
                        Sửa
                      </button>
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
                    <input
                      type="number"
                      min="0"
                      value={thresholdDraft}
                      onChange={(e) => setThresholdDraft(e.target.value)}
                      style={{ width: 90 }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>liều</span>
                    <button type="button" className="row-btn outline" onClick={cancelEditThreshold} disabled={savingThreshold}>
                      Hủy
                    </button>
                    <button type="button" className="row-btn solid" onClick={saveThreshold} disabled={savingThreshold}>
                      {savingThreshold ? 'Đang lưu…' : 'Lưu'}
                    </button>
                  </div>
                )}
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
            <div className="sub">{detailBatch || '—'} · {facilityName}</div>
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
              <span className="val">{facilityName}</span>
            </div>
          </div>
        )}
        <div className="modal-foot">
          <button type="button" className="btn outline" onClick={closeDetail}>
            Đóng
          </button>
        </div>
      </div>

      <div className={`staff-overlay${showAddBatch ? ' open' : ''}`} onClick={closeAddBatch} />
      <div className={`staff-modal${showAddBatch ? ' open' : ''}`} role="dialog">
        <div className="modal-head">
          <div>
            <h3>Thêm lô vắc xin</h3>
            <div className="sub">Nhập lô mới vào kho của cơ sở</div>
          </div>
          <button type="button" className="modal-close" onClick={closeAddBatch} aria-label="Đóng">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Vắc xin <span className="req">*</span></label>
            <select
              value={batchForm.vaccineId}
              onChange={(e) => setBatchForm((f) => ({ ...f, vaccineId: e.target.value }))}
            >
              <option value="">-- Chọn vắc xin --</option>
              {vaccines.map((v) => (
                <option key={v.vaccineId} value={v.vaccineId}>
                  {v.vaccineName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Số lô <span className="req">*</span></label>
            <input
              type="text"
              value={batchForm.batchNumber}
              onChange={(e) => setBatchForm((f) => ({ ...f, batchNumber: e.target.value }))}
              placeholder="VD: BCG-2026-003"
            />
          </div>
          <div className="field">
            <label>Số lượng nhập <span className="req">*</span></label>
            <input
              type="number"
              min="1"
              value={batchForm.importedQuantity}
              onChange={(e) => setBatchForm((f) => ({ ...f, importedQuantity: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Ngày sản xuất</label>
            <input
              type="date"
              value={batchForm.manufactureDate}
              onChange={(e) => setBatchForm((f) => ({ ...f, manufactureDate: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Hạn dùng <span className="req">*</span></label>
            <input
              type="date"
              value={batchForm.expiryDate}
              onChange={(e) => setBatchForm((f) => ({ ...f, expiryDate: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Ngày nhập</label>
            <input
              type="date"
              value={batchForm.importDate}
              onChange={(e) => setBatchForm((f) => ({ ...f, importDate: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Giá nhập (mỗi liều)</label>
            <input
              type="number"
              min="0"
              value={batchForm.importPrice}
              onChange={(e) => setBatchForm((f) => ({ ...f, importPrice: e.target.value }))}
            />
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn outline" onClick={closeAddBatch} disabled={savingBatch}>
            Hủy
          </button>
          <button type="button" className="btn primary" onClick={submitAddBatch} disabled={savingBatch}>
            {savingBatch ? 'Đang lưu…' : 'Nhập lô'}
          </button>
        </div>
      </div>

      <div className={`staff-toast${toast.show ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>
        {toast.message}
      </div>
    </>
  );
}