/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Topbar from '../../components/layout/Topbar';
import { Overlay, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import * as adminService from '../../services/adminService';

function formatDateVN(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function isExpiringSoon(expStr) {
  if (!expStr || expStr === '—') return false;
  const parts = expStr.split('/');
  if (parts.length !== 3) return false;
  const exp = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  const now = new Date();
  const diff = (exp - now) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 180;
}



export default function Inventory() {
  const showToast = useToast();
  const [list, setList] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [facFilter, setFacFilter] = useState('all');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState({ code: '', vax: '', fac: '', qty: 100, mfg: '', exp: '', importDate: '', status: 'AVAILABLE' });
  const [vaccines, setVaccines] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [facs, vaxList] = await Promise.all([
        adminService.getFacilitiesAdmin(),
        adminService.getVaccinesAdmin().catch(() => []),
      ]);
      setVaccines((vaxList || []).map(adminService.mapVaccineToUi));
      const facUi = (facs || []).map(adminService.mapFacilityToUi);
      setFacilities(facUi);
      const nameMap = Object.fromEntries(facUi.map((f) => [f.id, f.name]));
      const targets = facFilter === 'all' ? facUi : facUi.filter((f) => String(f.id) === String(facFilter));
      const batchLists = await Promise.all(
        targets.map((f) => adminService.getBatches(f.id).catch(() => []))
      );
      const merged = batchLists.flat().map((b) => adminService.mapBatchAdminToUi(b, nameMap));
      setList(merged);
    } catch (err) {
      showToast(err.message || 'Không tải được tồn kho', 'error');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, facFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const qq = q.toLowerCase();
    return list.filter((b) => {
      if (filter === 'low' && !b.low) return false;
      if (filter === 'exp' && !b.expiring) return false;
      if (filter === 'AVAILABLE' && b.status !== 'AVAILABLE') return false;
      if (!qq) return true;
      return `${b.code} ${b.vaxName || ''} ${b.facName || ''}`.toLowerCase().includes(qq);
    });
  }, [list, filter, q]);

  const openImport = () => {
    const today = new Date().toISOString().slice(0, 10);
    setForm({ code: '', vax: 11, fac: 1, qty: 100, stock: 100, mfg: '', exp: '', importDate: today, status: 'AVAILABLE' });
    setImportOpen(true);
  };

  const saveImport = async () => {
    const code = form.code.trim();
    const qty = Number(form.qty) || 0;
    if (!code) { showToast('Vui lòng nhập mã lô', 'warn'); return; }
    if (!form.fac) { showToast('Chọn cơ sở', 'warn'); return; }
    if (!form.vax) { showToast('Chọn vắc xin', 'warn'); return; }
    if (qty <= 0) { showToast('Số lượng nhập phải > 0', 'warn'); return; }
    if (!form.exp) { showToast('Vui lòng chọn hạn sử dụng', 'warn'); return; }
    try {
      await adminService.importBatch({
        facilityId: Number(form.fac),
        vaccineId: Number(form.vax),
        batchNumber: code,
        manufactureDate: form.mfg || undefined,
        expiryDate: form.exp,
        importedQuantity: qty,
        importDate: form.importDate || undefined,
      });
      setImportOpen(false);
      showToast(`Đã nhập lô ${code}`, 'ok');
      await load();
    } catch (err) {
      showToast(err.message || 'Nhập lô thất bại', 'error');
    }
  };

  return (
    <>
      <Topbar title="Kho & lô toàn mạng" subtitle="Thứ Ba, 18/08/2026 · vaccine_batches" onSearch={setQ} />
      <div className="content">
        <section className="kpi-row">
          <div className="kpi c1"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8 12 3 3 8m18 0-9 5" /></svg></span></div><div className="num">48</div><div className="lbl">Lô toàn mạng</div></div>
          <div className="kpi c2"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></span></div><div className="num">~8.4k</div><div className="lbl">Tổng liều còn</div></div>
          <div className="kpi c3"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17" /></svg></span></div><div className="num">5</div><div className="lbl">Cảnh báo tồn/HSD</div></div>
          <div className="kpi c4"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l7-4 7 4v14" /></svg></span></div><div className="num">12</div><div className="lbl">Cơ sở có kho</div></div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {[
              { f: 'all', label: 'Tất cả lô' },
              { f: 'low', label: 'Tồn thấp' },
              { f: 'exp', label: 'Sắp HSD' },
              { f: 'AVAILABLE', label: 'AVAILABLE' },
            ].map((t) => (
              <button key={t.f} type="button" className={filter === t.f ? 'active' : ''} onClick={() => setFilter(t.f)}>{t.label}</button>
            ))}
          </div>
          <div className="toolbar-right">
            <button className="btn outline" type="button" onClick={() => showToast('Xuất báo cáo kho mạng…', 'ok')}>Xuất</button>
            <button className="btn primary" type="button" onClick={openImport}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
              Nhập lô
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div><h3>Lô vắc xin toàn mạng</h3><div className="sub">vaccine_batches · FEFO</div></div></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã lô</th><th>Vắc xin</th><th>Cơ sở</th><th>Tồn</th><th>HSD</th><th>TT</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const tag = b.low ? <span className="tag warn">Tồn thấp</span> : b.expiring ? <span className="tag danger">Ưu tiên FEFO</span> : <span className="tag ok">OK</span>;
                  return (
                    <tr key={b.id} className={b.low ? 'alert-row' : b.expiring ? 'danger-row' : ''}>
                      <td className="mono">{b.code}</td>
                      <td><div className="fname">{b.vaxName || `#${b.vax}`}</div></td>
                      <td>{(facilities.find(f=>f.id===b.fac)?.name || ('CS #'+b.fac)) || b.fac}</td>
                      <td className="mono">{b.stock}</td>
                      <td>{b.exp}</td>
                      <td>{tag}</td>
                      <td>
                        <div className="row-actions">
                          <button className="row-btn outline" type="button" onClick={() => setDetail(b)}>Chi tiết</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Overlay open={!!detail || importOpen} onClose={() => { setDetail(null); setImportOpen(false); }} />
      <Modal
        open={!!detail}
        title={detail?.code || 'Chi tiết lô'}
        onClose={() => setDetail(null)}
        footer={<button className="btn outline" type="button" onClick={() => setDetail(null)}>Đóng</button>}
      >
        {detail && (
          <>
            <div className="detail-row"><span className="lbl">Vắc xin</span><span className="val">{detail.vaxName || detail.vax}</span></div>
            <div className="detail-row"><span className="lbl">Cơ sở</span><span className="val">{(facilities.find(f=>f.id===detail.fac)?.name || ('CS #'+detail.fac)) || detail.fac}</span></div>
            <div className="detail-row"><span className="lbl">Tồn kho</span><span className="val">{detail.stock} liều</span></div>
            <div className="detail-row"><span className="lbl">Hạn dùng</span><span className="val">{detail.exp}</span></div>
            <div className="detail-row"><span className="lbl">Trạng thái</span><span className="val">{detail.low ? 'Tồn thấp' : detail.expiring ? 'Ưu tiên FEFO' : 'OK'}</span></div>
          </>
        )}
      </Modal>

      <Modal
        open={importOpen}
        title="Nhập lô vắc xin"
        onClose={() => setImportOpen(false)}
        footer={
          <>
            <button className="btn outline" type="button" onClick={() => setImportOpen(false)}>Hủy</button>
            <button className="btn primary" type="button" onClick={saveImport}>Lưu lô</button>
          </>
        }
      >
        <div className="field">
          <label>Mã lô <span className="req">*</span></label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="VD: HPV-2026-G9C" />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Vắc xin <span className="req">*</span></label>
            <select value={form.vax} onChange={(e) => setForm({ ...form, vax: e.target.value })}>
              {vaccines.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Cơ sở (kho) <span className="req">*</span></label>
            <select value={form.fac} onChange={(e) => setForm({ ...form, fac: e.target.value })}>
              {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Số lượng nhập <span className="req">*</span></label>
            <input type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value, stock: e.target.value })} />
          </div>
          <div className="field">
            <label>Tồn ban đầu</label>
            <input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
        </div>
        <div className="field-row">
          <div className="field"><label>Ngày sản xuất</label><input type="date" value={form.mfg} onChange={(e) => setForm({ ...form, mfg: e.target.value })} /></div>
          <div className="field"><label>Hạn sử dụng <span className="req">*</span></label><input type="date" value={form.exp} onChange={(e) => setForm({ ...form, exp: e.target.value })} /></div>
        </div>
        <div className="field"><label>Ngày nhập kho</label><input type="date" value={form.importDate} onChange={(e) => setForm({ ...form, importDate: e.target.value })} /></div>
        <div className="field">
          <label>Trạng thái</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="AVAILABLE">AVAILABLE — Còn hàng</option>
            <option value="EXPIRED">EXPIRED — Hết hạn</option>
            <option value="DEPLETED">DEPLETED — Đã hết</option>
          </select>
        </div>
      </Modal>
    </>
  );
}