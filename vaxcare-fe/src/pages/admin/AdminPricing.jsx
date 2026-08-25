/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Topbar from '../../components/layout/Topbar';
import { Overlay, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import * as adminService from '../../services/adminService';

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function Pricing() {
  const showToast = useToast();
  const [prices, setPrices] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plist, vlist, flist] = await Promise.all([
        adminService.getAllPricesAdmin(),
        adminService.getVaccinesAdmin().catch(() => []),
        adminService.getFacilitiesAdmin().catch(() => []),
      ]);
      setPrices((plist || []).map(adminService.mapPriceToUi));
      setVaccines((vlist || []).map(adminService.mapVaccineToUi));
      setFacilities((flist || []).map(adminService.mapFacilityToUi));
    } catch (err) {
      showToast(err.message || 'Không tải được bảng giá', 'error');
      setPrices([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [editId, setEditId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [fPrice, setFPrice] = useState(0);
  const [fStatus, setFStatus] = useState('ACTIVE');
  const [fVax, setFVax] = useState('');
  const [fFac, setFFac] = useState('');
  const [fEff, setFEff] = useState(todayIso());
  const [fExp, setFExp] = useState('');

  const rows = useMemo(() => {
    const qq = q.toLowerCase();
    return prices.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (!qq) return true;
      return p.vaccine.toLowerCase().includes(qq);
    });
  }, [prices, filter, q]);

  const kpiActive = prices.filter((p) => p.status === 'ACTIVE').length;
  const kpiByFacility = prices.filter((p) => p.facilityId != null).length;
  const priceRange = useMemo(() => {
    const nums = prices.map((p) => Number(p.priceRaw)).filter((n) => Number.isFinite(n) && n > 0);
    if (!nums.length) return '—';
    const fmtShort = (n) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}tr` : `${Math.round(n / 1000)}k`);
    return `${fmtShort(Math.min(...nums))}–${fmtShort(Math.max(...nums))}`;
  }, [prices]);

  const openForm = (id) => {
    const p = id ? prices.find((x) => x.id === id) : null;
    setEditId(id);
    setFVax(p ? String(p.vaccineId) : String(vaccines[0]?.id || ''));
    setFFac(p ? (p.facilityId != null ? String(p.facilityId) : '') : '');
    setFPrice(p ? p.priceRaw : 0);
    setFStatus(p ? p.status : 'ACTIVE');
    setFEff(p?._raw?.effectiveDate || todayIso());
    setFExp(p?._raw?.expiryDate || '');
    setFormOpen(true);
  };

  const save = async () => {
    const priceNum = Number(fPrice) || 0;
    if (!fVax) {
      showToast('Chọn vắc xin', 'warn');
      return;
    }
    if (priceNum <= 0) {
      showToast('Giá phải > 0', 'warn');
      return;
    }
    if (editId) {
      // BE chưa có PUT giá — vô hiệu hóa cái cũ rồi tạo mới nếu cần; ở đây chỉ thông báo
      showToast('Chỉ hỗ trợ tạo giá mới / vô hiệu hóa. Dùng thêm giá hoặc tắt giá cũ.', 'warn');
      setFormOpen(false);
      return;
    }
    try {
      await adminService.createPrice({
        vaccineId: Number(fVax),
        facilityId: fFac ? Number(fFac) : null,
        price: priceNum,
        effectiveDate: fEff || todayIso(),
        expiryDate: fExp || undefined,
        status: fStatus || 'ACTIVE',
      });
      showToast('Đã thêm bảng giá', 'ok');
      setFormOpen(false);
      await load();
    } catch (err) {
      showToast(err.message || 'Lưu giá thất bại', 'error');
    }
  };

  const deactivate = async (p) => {
    try {
      await adminService.deactivatePrice(p.id);
      showToast('Đã vô hiệu hóa giá ' + p.vaccine, 'ok');
      await load();
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  return (
    <>
      <Topbar title="Bảng giá" subtitle="Thứ Ba, 18/08/2026 · price_lists" onSearch={setQ} searchPlaceholder="Tìm kiếm…" />
      <div className="content">
        <section className="kpi-row">
          <div className="kpi c1">
            <div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span></div>
            <div className="num">{kpiActive}</div><div className="lbl">Mục giá ACTIVE</div>
          </div>
          <div className="kpi c2">
            <div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /></svg></span></div>
            <div className="num">{priceRange}</div><div className="lbl">Khoảng giá (₫)</div>
          </div>
          <div className="kpi c3">
            <div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></span></div>
            <div className="num">{kpiByFacility}</div><div className="lbl">Giá theo cơ sở</div>
          </div>
          <div className="kpi c4">
            <div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7V3m8 4V3M3 11h18" /></svg></span></div>
            <div className="num">{prices.length}</div><div className="lbl">Tổng mục giá</div>
          </div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {['all', 'ACTIVE', 'INACTIVE'].map((f) => (
              <button key={f} type="button" className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Tất cả' : f}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <button className="btn outline" type="button" onClick={() => showToast('Xuất bảng giá…', 'ok')}>Xuất</button>
            <button className="btn primary" type="button" onClick={() => openForm(null)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
              Thêm / cập nhật giá
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Bảng giá toàn hệ thống</h3>
              <div className="sub">price_lists · {rows.length} bản ghi</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Vắc xin</th><th>Giá (₫)</th><th>Hiệu lực</th><th>Hết hạn</th><th>Phạm vi</th><th>TT</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">#{p.id}</td>
                    <td
                      className="fname"
                      style={{ cursor: 'pointer' }}
                      onClick={() => showToast(`${p.vaccine}: ${p.price} · ${p.status}`, 'ok')}
                    >
                      {p.vaccine}
                    </td>
                    <td className="mono">{p.price}</td>
                    <td>{p.effective}</td>
                    <td>{p.expiry || '—'}</td>
                    <td><span className="tag info">{p.facilityId != null ? p.facility : 'Toàn hệ thống'}</span></td>
                    <td><span className={`tag ${p.status === 'ACTIVE' ? 'ok' : 'neutral'}`}>{p.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="row-btn solid" type="button" onClick={() => openForm(p.id)}>Sửa giá</button>
                        {p.status === 'ACTIVE' && (
                          <button className="row-btn danger" type="button" onClick={() => deactivate(p)}>Vô hiệu hóa</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Overlay open={formOpen} onClose={() => setFormOpen(false)} />
      <Modal
        open={formOpen}
        title={editId ? `Sửa giá · ${prices.find((x) => x.id === editId)?.vaccine}` : 'Thêm giá'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn outline" type="button" onClick={() => setFormOpen(false)}>Hủy</button>
            <button className="btn primary" type="button" onClick={save}>Lưu</button>
          </>
        }
      >
        <div className="field">
          <label>Vắc xin <span className="req">*</span></label>
          <select value={fVax} onChange={(e) => setFVax(e.target.value)} disabled={!!editId}>
            <option value="">— Chọn vắc xin —</option>
            {vaccines.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Cơ sở áp dụng</label>
          <select value={fFac} onChange={(e) => setFFac(e.target.value)} disabled={!!editId}>
            <option value="">Toàn hệ thống</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Giá (₫) <span className="req">*</span></label>
          <input type="number" min={0} step={1000} value={fPrice} onChange={(e) => setFPrice(e.target.value)} disabled={!!editId} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Hiệu lực từ</label>
            <input type="date" value={fEff} onChange={(e) => setFEff(e.target.value)} disabled={!!editId} />
          </div>
          <div className="field">
            <label>Hết hạn</label>
            <input type="date" value={fExp} onChange={(e) => setFExp(e.target.value)} disabled={!!editId} />
          </div>
        </div>
        <div className="field">
          <label>Trạng thái</label>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} disabled={!!editId}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
        {editId && (
          <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>
            Backend hiện chưa hỗ trợ sửa giá đã tạo — vô hiệu hóa mục này rồi tạo giá mới nếu cần thay đổi.
          </p>
        )}
      </Modal>
    </>
  );
}
