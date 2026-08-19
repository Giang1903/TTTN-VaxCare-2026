import { useMemo, useState } from 'react';
import Topbar from '../../components/layout/Topbar';
import { Overlay, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const INITIAL = [
  { id: 1, vaxId: 1, name: 'BCG', price: 250000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 2, vaxId: 2, name: 'Viêm gan B', price: 350000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 3, vaxId: 3, name: 'DTaP', price: 520000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 4, vaxId: 4, name: 'IPV', price: 390000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 5, vaxId: 5, name: 'Hib', price: 420000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 6, vaxId: 6, name: 'MMR', price: 350000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 7, vaxId: 7, name: 'Thủy đậu', price: 850000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 8, vaxId: 8, name: 'Phế cầu', price: 1150000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 9, vaxId: 9, name: 'Viêm não NB', price: 450000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 10, vaxId: 10, name: 'Cúm mùa', price: 450000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 11, vaxId: 11, name: 'HPV', price: 1790000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 12, vaxId: 12, name: 'COVID-19', price: 550000, from: '01/01/2026', to: null, status: 'ACTIVE' },
  { id: 13, vaxId: 13, name: 'Zona (Shingrix)', price: 3200000, from: '01/01/2026', to: null, status: 'ACTIVE' },
];

const fmt = (n) => n.toLocaleString('vi-VN') + '₫';

export default function Pricing() {
  const showToast = useToast();
  const [prices, setPrices] = useState(INITIAL);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [editId, setEditId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [fPrice, setFPrice] = useState(0);
  const [fStatus, setFStatus] = useState('ACTIVE');
  const [fVax, setFVax] = useState(1);

  const rows = useMemo(() => {
    const qq = q.toLowerCase();
    return prices.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (!qq) return true;
      return p.name.toLowerCase().includes(qq);
    });
  }, [prices, filter, q]);

  const openForm = (id) => {
    const p = id ? prices.find((x) => x.id === id) : null;
    setEditId(id);
    setFVax(p ? p.vaxId : prices[0]?.vaxId || 1);
    setFPrice(p ? p.price : 0);
    setFStatus(p ? p.status : 'ACTIVE');
    setFormOpen(true);
  };

  const save = () => {
    const price = Number(fPrice);
    if (!price) {
      showToast('Nhập giá hợp lệ', 'warn');
      return;
    }
    if (editId) {
      setPrices((prev) =>
        prev.map((p) => (p.id === editId ? { ...p, price, status: fStatus } : p))
      );
      const name = prices.find((x) => x.id === editId)?.name;
      showToast('Đã cập nhật giá ' + name, 'ok');
    }
    setFormOpen(false);
  };

  return (
    <>
      <Topbar title="Bảng giá" subtitle="Thứ Ba, 18/08/2026 · price_lists" onSearch={setQ} searchPlaceholder="Tìm kiếm…" />
      <div className="content">
        <section className="kpi-row">
          <div className="kpi c1">
            <div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span></div>
            <div className="num">13</div><div className="lbl">Mục giá ACTIVE</div>
          </div>
          <div className="kpi c2">
            <div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /></svg></span></div>
            <div className="num">250k–3.2tr</div><div className="lbl">Khoảng giá (₫)</div>
          </div>
          <div className="kpi c3">
            <div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></span></div>
            <div className="num">0</div><div className="lbl">Giá theo cơ sở</div>
          </div>
          <div className="kpi c4">
            <div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7V3m8 4V3M3 11h18" /></svg></span></div>
            <div className="num">01/01/26</div><div className="lbl">Hiệu lực chung</div>
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
              <div className="sub">price_lists · facility_id = NULL (áp dụng chung)</div>
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
                      onClick={() => showToast(`${p.name}: ${fmt(p.price)} · ${p.status}`, 'ok')}
                    >
                      {p.name}
                    </td>
                    <td className="mono">{fmt(p.price)}</td>
                    <td>{p.from}</td>
                    <td>{p.to || '—'}</td>
                    <td><span className="tag info">Toàn hệ thống</span></td>
                    <td><span className={`tag ${p.status === 'ACTIVE' ? 'ok' : 'neutral'}`}>{p.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="row-btn solid" type="button" onClick={() => openForm(p.id)}>Sửa giá</button>
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
        title={editId ? `Sửa giá · ${prices.find((x) => x.id === editId)?.name}` : 'Thêm giá'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn outline" type="button" onClick={() => setFormOpen(false)}>Hủy</button>
            <button className="btn primary" type="button" onClick={save}>Lưu</button>
          </>
        }
      >
        <div className="field">
          <label>Vắc xin</label>
          <select value={fVax} onChange={(e) => setFVax(Number(e.target.value))}>
            {prices.map((x) => (
              <option key={x.vaxId} value={x.vaxId}>{x.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Giá (₫) <span className="req">*</span></label>
          <input type="number" min={0} step={1000} value={fPrice} onChange={(e) => setFPrice(e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Hiệu lực từ</label>
            <input type="date" defaultValue="2026-01-01" />
          </div>
          <div className="field">
            <label>Hết hạn</label>
            <input type="date" />
          </div>
        </div>
        <div className="field">
          <label>Trạng thái</label>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </Modal>
    </>
  );
}
