/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Topbar from '../../components/layout/Topbar';
import { Overlay, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import * as adminService from '../../services/adminService';

export default function Facilities() {
  const showToast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getFacilitiesAdmin();
      setList((data || []).map(adminService.mapFacilityToUi));
    } catch (err) {
      showToast(err.message || 'Không tải được danh sách cơ sở', 'error');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', addr: '', phone: '', cap: 12, open: '07:30', close: '17:00', status: 'ACTIVE' });

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return list.filter((f) => {
      if (filter !== 'all' && f.status !== filter) return false;
      if (!qq) return true;
      return (f.name + f.addr + f.phone).toLowerCase().includes(qq);
    });
  }, [list, filter, q]);

  const kpiTotal = list.length;
  const kpiActive = list.filter((f) => f.status === 'ACTIVE').length;
  const kpiCapSum = list.reduce((sum, f) => sum + (Number(f.cap) || 0), 0);

  const openForm = (f) => {
    setEditId(f ? f.id : null);
    setForm(
      f
        ? { name: f.name, addr: f.addr, phone: f.phone, cap: f.cap, open: f.open, close: f.close, status: f.status }
        : { name: '', addr: '', phone: '', cap: 12, open: '07:30', close: '17:00', status: 'ACTIVE' }
    );
    setDetail(null);
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name?.trim()) {
      showToast('Vui lòng nhập tên cơ sở', 'error');
      return;
    }
    const body = {
      facilityName: form.name.trim(),
      address: form.addr || undefined,
      phone: form.phone || undefined,
      capacityPerSlot: Number(form.cap) || 12,
      openingTime: form.open ? (form.open.length === 5 ? form.open + ':00' : form.open) : undefined,
      closingTime: form.close ? (form.close.length === 5 ? form.close + ':00' : form.close) : undefined,
      status: form.status || 'ACTIVE',
    };
    try {
      if (editId) {
        await adminService.updateFacility(editId, body);
        showToast('Đã cập nhật ' + form.name, 'ok');
      } else {
        await adminService.createFacility(body);
        showToast('Đã thêm cơ sở ' + form.name, 'ok');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      showToast(err.message || 'Lưu thất bại', 'error');
    }
  };

  const toggle = async (f) => {
    try {
      if (String(f.status).toUpperCase() === 'ACTIVE') {
        await adminService.deactivateFacility(f.id);
        showToast('Đã vô hiệu hóa ' + f.name, 'ok');
      } else {
        await adminService.reactivateFacility(f.id);
        showToast('Đã kích hoạt lại ' + f.name, 'ok');
      }
      await load();
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  return (
    <>
      <Topbar title="Cơ sở tiêm chủng" subtitle="Thứ Ba, 18/08/2026 · vaccination_facilities" onSearch={setQ} searchPlaceholder="Tìm tên, địa chỉ, SĐT…" />
      <div className="content">
        <section className="kpi-row">
          <div className="kpi c1"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l7-4 7 4v14" /></svg></span></div><div className="num">{kpiTotal}</div><div className="lbl">Tổng cơ sở</div></div>
          <div className="kpi c2"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></span></div><div className="num">{kpiActive}</div><div className="lbl">Đang hoạt động</div></div>
          <div className="kpi c3"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></span></div><div className="num">{kpiTotal - kpiActive}</div><div className="lbl">Ngừng hoạt động</div></div>
          <div className="kpi c4"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l2 5 4-14 2 9h6" /></svg></span></div><div className="num">{kpiCapSum}</div><div className="lbl">Tổng capacity/slot</div></div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {[
              { f: 'all', label: `Tất cả (${kpiTotal})` },
              { f: 'ACTIVE', label: 'Đang hoạt động' },
              { f: 'INACTIVE', label: 'Ngừng' },
            ].map((t) => (
              <button key={t.f} type="button" className={filter === t.f ? 'active' : ''} onClick={() => setFilter(t.f)}>{t.label}</button>
            ))}
          </div>
          <div className="toolbar-right">
            <button className="btn primary" type="button" onClick={() => openForm(null)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
              Thêm cơ sở
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div><h3>Danh sách cơ sở</h3><div className="sub">vaccination_facilities · {rows.length} bản ghi</div></div></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Tên cơ sở</th><th>Địa chỉ</th><th>Giờ mở</th><th>Capacity</th><th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td className="mono">#{f.id}</td>
                    <td><div className="fname">{f.name}</div><div className="fmeta">{f.phone}</div></td>
                    <td style={{ maxWidth: 260 }}><div className="fmeta" style={{ color: 'var(--ink)', fontSize: 13 }}>{f.addr}</div></td>
                    <td className="mono">{f.open}–{f.close}</td>
                    <td className="mono">{f.cap}</td>
                    <td><span className={`tag ${f.status === 'ACTIVE' ? 'ok' : 'neutral'}`}>{f.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="row-btn outline" type="button" onClick={() => setDetail(f)}>Chi tiết</button>
                        <button className="row-btn solid" type="button" onClick={() => openForm(f)}>Sửa</button>
                        <button className="row-btn danger" type="button" onClick={() => toggle(f)}>{f.status === 'ACTIVE' ? 'Ngừng' : 'Bật'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Overlay open={!!detail || formOpen} onClose={() => { setDetail(null); setFormOpen(false); }} />
      <Modal
        open={!!detail}
        title={detail?.name || 'Chi tiết cơ sở'}
        onClose={() => setDetail(null)}
        footer={
          <>
            <button className="btn outline" type="button" onClick={() => setDetail(null)}>Đóng</button>
            <button className="btn primary" type="button" onClick={() => openForm(detail)}>Chỉnh sửa</button>
          </>
        }
      >
        {detail && (
          <>
            <div className="detail-row"><span className="lbl">ID</span><span className="val mono">#{detail.id}</span></div>
            <div className="detail-row"><span className="lbl">Địa chỉ</span><span className="val">{detail.addr}</span></div>
            <div className="detail-row"><span className="lbl">Điện thoại</span><span className="val">{detail.phone}</span></div>
            <div className="detail-row"><span className="lbl">Giờ hoạt động</span><span className="val">{detail.open} – {detail.close}</span></div>
            <div className="detail-row"><span className="lbl">Capacity / slot</span><span className="val">{detail.cap} người</span></div>
            <div className="detail-row"><span className="lbl">Trạng thái</span><span className="val"><span className={`tag ${detail.status === 'ACTIVE' ? 'ok' : 'neutral'}`}>{detail.status}</span></span></div>
          </>
        )}
      </Modal>

      <Modal
        open={formOpen}
        title={editId ? 'Sửa cơ sở' : 'Thêm cơ sở'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn outline" type="button" onClick={() => setFormOpen(false)}>Hủy</button>
            <button className="btn primary" type="button" onClick={save}>Lưu</button>
          </>
        }
      >
        <div className="field"><label>Tên cơ sở <span className="req">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VaxCare …" /></div>
        <div className="field"><label>Địa chỉ <span className="req">*</span></label><textarea rows={2} value={form.addr} onChange={(e) => setForm({ ...form, addr: e.target.value })} placeholder="Số nhà, đường, quận…" /></div>
        <div className="field-row">
          <div className="field"><label>Số điện thoại</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="028-xxxx-xxxx" /></div>
          <div className="field"><label>Capacity / slot <span className="req">*</span></label><input type="number" min={1} max={50} value={form.cap} onChange={(e) => setForm({ ...form, cap: e.target.value })} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Giờ mở</label><input type="time" value={form.open} onChange={(e) => setForm({ ...form, open: e.target.value })} /></div>
          <div className="field"><label>Giờ đóng</label><input type="time" value={form.close} onChange={(e) => setForm({ ...form, close: e.target.value })} /></div>
        </div>
        <div className="field">
          <label>Trạng thái</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">ACTIVE — Hoạt động</option>
            <option value="INACTIVE">INACTIVE — Ngừng</option>
          </select>
        </div>
      </Modal>
    </>
  );
}