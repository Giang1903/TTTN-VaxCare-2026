import { useMemo, useState } from 'react';
import Topbar from '../../components/layout/Topbar';
import { Overlay, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const FAC = { 1: 'Phú Nhuận', 2: 'Thủ Đức', 3: 'Nowzone', 4: 'Củ Chi', 5: 'Trung Mỹ Tây', 6: 'Co.opmart QT', 7: 'Oriental', 9: 'Hiệp Bình', 10: 'Tân Định' };
const VNAMES = { 1: 'BCG', 2: 'Viêm gan B', 3: 'DTaP', 4: 'IPV', 5: 'Hib', 6: 'MMR', 7: 'Thủy đậu', 8: 'Phế cầu', 9: 'Viêm não NB', 10: 'Cúm mùa', 11: 'HPV', 12: 'COVID-19', 13: 'Zona' };

const INITIAL = [
  { id: 1, fac: 1, vax: 1, code: 'BCG-2026-001', stock: 280, exp: '01/11/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 2, fac: 3, vax: 1, code: 'BCG-2026-002', stock: 210, exp: '01/12/2027', status: 'AVAILABLE', low: false, expiring: true },
  { id: 3, fac: 1, vax: 2, code: 'HBV-2026-A1', stock: 420, exp: '15/10/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 4, fac: 5, vax: 2, code: 'HBV-2026-A2', stock: 310, exp: '20/11/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 5, fac: 10, vax: 2, code: 'HBV-2026-A3', stock: 290, exp: '10/12/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 6, fac: 1, vax: 3, code: 'DTAP-2026-01', stock: 240, exp: '01/09/2027', status: 'AVAILABLE', low: false, expiring: true },
  { id: 7, fac: 6, vax: 3, code: 'DTAP-2026-02', stock: 190, exp: '01/10/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 8, fac: 2, vax: 4, code: 'IPV-2026-X1', stock: 260, exp: '15/08/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 9, fac: 9, vax: 4, code: 'IPV-2026-X2', stock: 210, exp: '20/09/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 10, fac: 1, vax: 5, code: 'HIB-2026-01', stock: 230, exp: '20/09/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 12, fac: 1, vax: 6, code: 'MMR-2026-01', stock: 320, exp: '10/10/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 17, fac: 1, vax: 8, code: 'PCV-2026-01', stock: 130, exp: '01/08/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 19, fac: 10, vax: 8, code: 'PCV-2026-03', stock: 95, exp: '05/10/2027', status: 'AVAILABLE', low: true, expiring: false },
  { id: 30, fac: 1, vax: 11, code: 'HPV-2026-G9A', stock: 48, exp: '01/07/2027', status: 'AVAILABLE', low: true, expiring: false },
  { id: 31, fac: 3, vax: 11, code: 'HPV-2026-G9B', stock: 62, exp: '15/08/2027', status: 'AVAILABLE', low: false, expiring: false },
  { id: 32, fac: 7, vax: 10, code: 'FLU-2026-A', stock: 580, exp: '31/12/2026', status: 'AVAILABLE', low: false, expiring: true },
  { id: 33, fac: 1, vax: 13, code: 'ZONA-2026-01', stock: 85, exp: '01/06/2027', status: 'AVAILABLE', low: true, expiring: false },
];

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
  const [list, setList] = useState(INITIAL);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState({
    code: '', vax: 11, fac: 1, qty: 100, stock: 100, mfg: '', exp: '', importDate: '', status: 'AVAILABLE',
  });

  const rows = useMemo(() => {
    const qq = q.toLowerCase();
    return list.filter((b) => {
      if (filter === 'low' && !b.low) return false;
      if (filter === 'exp' && !b.expiring) return false;
      if (filter === 'AVAILABLE' && b.status !== 'AVAILABLE') return false;
      if (!qq) return true;
      return (b.code + (VNAMES[b.vax] || '') + (FAC[b.fac] || '')).toLowerCase().includes(qq);
    });
  }, [list, filter, q]);

  const openImport = () => {
    const today = new Date().toISOString().slice(0, 10);
    setForm({ code: '', vax: 11, fac: 1, qty: 100, stock: 100, mfg: '', exp: '', importDate: today, status: 'AVAILABLE' });
    setImportOpen(true);
  };

  const saveImport = () => {
    const code = form.code.trim();
    const qty = Number(form.qty) || 0;
    const stock = Number(form.stock) || 0;
    if (!code) { showToast('Vui lòng nhập mã lô', 'warn'); return; }
    if (qty <= 0) { showToast('Số lượng nhập phải > 0', 'warn'); return; }
    if (!form.exp) { showToast('Vui lòng chọn hạn sử dụng', 'warn'); return; }
    if (list.some((b) => b.code === code)) { showToast('Mã lô đã tồn tại', 'warn'); return; }

    const expVN = formatDateVN(form.exp);
    const newBatch = {
      id: Date.now(),
      fac: Number(form.fac),
      vax: Number(form.vax),
      code,
      stock,
      exp: expVN,
      status: form.status,
      low: stock < 50,
      expiring: isExpiringSoon(expVN),
    };
    setList((prev) => [newBatch, ...prev]);
    setImportOpen(false);
    showToast(`Đã nhập lô ${code} · ${stock} liều · ${FAC[newBatch.fac]}`, 'ok');
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
                      <td><div className="fname">{VNAMES[b.vax] || `#${b.vax}`}</div></td>
                      <td>{FAC[b.fac] || b.fac}</td>
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
            <div className="detail-row"><span className="lbl">Vắc xin</span><span className="val">{VNAMES[detail.vax] || detail.vax}</span></div>
            <div className="detail-row"><span className="lbl">Cơ sở</span><span className="val">{FAC[detail.fac] || detail.fac}</span></div>
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
              {Object.entries(VNAMES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Cơ sở (kho) <span className="req">*</span></label>
            <select value={form.fac} onChange={(e) => setForm({ ...form, fac: e.target.value })}>
              {Object.entries(FAC).map(([k, n]) => <option key={k} value={k}>VaxCare {n}</option>)}
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
