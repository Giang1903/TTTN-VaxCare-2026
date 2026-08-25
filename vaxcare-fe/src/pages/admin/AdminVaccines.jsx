/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import Topbar from '../../components/layout/Topbar';
import { Overlay, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import * as adminService from '../../services/adminService';

const CATS = {
  1: 'Trẻ sơ sinh & Trẻ nhỏ',
  2: 'Trẻ em & Thanh thiếu niên',
  3: 'Người trưởng thành',
  4: 'Người cao tuổi',
  5: 'Mùa vụ & Định kỳ',
  6: 'Phối hợp & Đặc biệt',
};

export default function Vaccines() {
  const showToast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        adminService.getVaccinesAdmin(),
        adminService.getVaccineCategories().catch(() => []),
      ]);
      setList((data || []).map(adminService.mapVaccineToUi));
      const catList = (cats || []).map((c) => ({
        id: c.categoryId ?? c.id,
        name: c.categoryName || c.name || `Danh mục ${c.categoryId ?? c.id}`,
      }));
      // eslint-disable-next-line react-hooks/immutability
      setCategories(catList);
    } catch (err) {
      showToast(err.message || 'Không tải được danh sách vắc xin', 'error');
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
  const [form, setForm] = useState({ name: '', full: '', disease: '', cat: '', doses: 1, interval: '', proto: '', status: 'ACTIVE' });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const qq = q.toLowerCase();
    return list.filter((v) => {
      if (filter !== 'all' && String(v.cat) !== filter) return false;
      if (!qq) return true;
      return (v.name + v.full + v.disease).toLowerCase().includes(qq);
    });
  }, [list, filter, q]);

  const kpiTotal = list.length;
  const kpiActive = list.filter((v) => v.status === 'ACTIVE').length;
  const kpiCatCount = new Set(list.map((v) => v.cat).filter((c) => c !== '' && c != null)).size;

  const openForm = (v) => {
    setEditId(v ? v.id : null);
    setForm(
      v
        ? { name: v.name, full: v.full, disease: v.disease, cat: v.cat, doses: v.doses, interval: v.interval ?? '', proto: v.proto, status: v.status }
        : { name: '', full: '', disease: '', cat: '', doses: 1, interval: '', proto: '', status: 'ACTIVE' }
    );
    setDetail(null);
    setFormOpen(true);
  };

  const save = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (saving) return;
    if (!form.name?.trim()) {
      showToast('Nhập tên vắc xin', 'warn');
      return;
    }
    const doses = form.doses === '' || form.doses == null ? 1 : Number(form.doses);
    if (!Number.isFinite(doses) || doses < 1) {
      showToast('Số mũi phải ≥ 1', 'warn');
      return;
    }
    let doseIntervalDays;
    if (form.interval !== '' && form.interval != null) {
      doseIntervalDays = Number(form.interval);
      if (!Number.isFinite(doseIntervalDays) || doseIntervalDays < 1) {
        showToast('Khoảng cách (ngày) phải ≥ 1 hoặc để trống', 'warn');
        return;
      }
    }
    const body = {
      categoryId: form.cat ? Number(form.cat) : undefined,
      vaccineName: form.name.trim(),
      manufacturer: form.full?.trim() || undefined,
      targetDisease: form.disease?.trim() || undefined,
      requiredDoses: doses,
      doseIntervalDays,
      description: form.proto?.trim() || undefined,
      status: form.status || 'ACTIVE',
    };
    setSaving(true);
    try {
      if (editId) {
        await adminService.updateVaccine(editId, body);
        showToast('Đã cập nhật ' + form.name, 'ok');
      } else {
        await adminService.createVaccine(body);
        showToast('Đã thêm vắc xin ' + form.name, 'ok');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      const fe = err.fieldErrors;
      const detail = fe
        ? Object.values(fe).flat().filter(Boolean).join('; ')
        : null;
      showToast(detail || err.message || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Vắc xin & phác đồ" subtitle="Thứ Ba, 18/08/2026 · vaccines + vaccination_protocols" onSearch={setQ} />
      <div className="content">
        <section className="kpi-row">
          <div className="kpi c1"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 2 3 10l3 3 8-8-3-3Z" /></svg></span></div><div className="num">{kpiTotal}</div><div className="lbl">Loại vắc xin</div></div>
          <div className="kpi c2"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></span></div><div className="num">{kpiActive}</div><div className="lbl">ACTIVE</div></div>
          <div className="kpi c3"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16h12V8z" /></svg></span></div><div className="num">{list.filter((v) => v.proto).length}</div><div className="lbl">Có phác đồ</div></div>
          <div className="kpi c4"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></span></div><div className="num">{kpiCatCount}</div><div className="lbl">Nhóm danh mục</div></div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {[
              { f: 'all', label: 'Tất cả' },
              { f: '1', label: 'Trẻ sơ sinh' },
              { f: '2', label: 'Trẻ em' },
              { f: '3', label: 'Người lớn' },
              { f: '5', label: 'Mùa vụ' },
            ].map((t) => (
              <button key={t.f} type="button" className={filter === t.f ? 'active' : ''} onClick={() => setFilter(t.f)}>{t.label}</button>
            ))}
          </div>
          <div className="toolbar-right">
            <button className="btn primary" type="button" onClick={() => openForm(null)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
              Thêm vắc xin
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div><h3>Danh mục vắc xin</h3><div className="sub">vaccines · vaccination_protocols · {rows.length} bản ghi</div></div></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Tên vắc xin</th><th>Phòng bệnh</th><th>Số mũi</th><th>Phác đồ</th><th>TT</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td className="mono">#{v.id}</td>
                    <td>
                      <div className="fname">{v.name}</div>
                      <div className="fmeta">{CATS[v.cat] || ''}</div>
                    </td>
                    <td>{v.disease}</td>
                    <td className="mono">{v.doses}{v.interval ? ` · ≥${v.interval}d` : ''}</td>
                    <td><span className="proto-chip">{v.proto}</span></td>
                    <td><span className="tag ok">{v.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="row-btn outline" type="button" onClick={() => setDetail(v)}>Chi tiết</button>
                        <button className="row-btn solid" type="button" onClick={() => openForm(v)}>Sửa</button>
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
        title={detail?.full || 'Chi tiết'}
        onClose={() => setDetail(null)}
        footer={
          <>
            <button className="btn outline" type="button" onClick={() => setDetail(null)}>Đóng</button>
            <button className="btn primary" type="button" onClick={() => openForm(detail)}>Sửa</button>
          </>
        }
      >
        {detail && (
          <>
            <div className="detail-row"><span className="lbl">Danh mục</span><span className="val">{CATS[detail.cat]}</span></div>
            <div className="detail-row"><span className="lbl">Phòng bệnh</span><span className="val">{detail.disease}</span></div>
            <div className="detail-row"><span className="lbl">Số mũi / Khoảng cách</span><span className="val">{detail.doses} mũi{detail.interval ? ` · ≥${detail.interval} ngày` : ''}</span></div>
            <div className="detail-row"><span className="lbl">Phác đồ</span><span className="val">{detail.proto}</span></div>
            <div className="detail-row"><span className="lbl">Trạng thái</span><span className="val"><span className="tag ok">{detail.status}</span></span></div>
          </>
        )}
      </Modal>

      <Modal
        open={formOpen}
        title={editId ? `Sửa vắc xin · ${form.name}` : 'Thêm vắc xin'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn outline" type="button" onClick={() => setFormOpen(false)}>Hủy</button>
            <button className="btn primary" type="button" onClick={save} disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</button>
          </>
        }
      >
        <div className="field"><label>Tên ngắn <span className="req">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: HPV" /></div>
        <div className="field"><label>Tên đầy đủ</label><input value={form.full} onChange={(e) => setForm({ ...form, full: e.target.value })} placeholder="Vắc xin …" /></div>
        <div className="field-row">
          <div className="field"><label>Phòng bệnh</label><input value={form.disease} onChange={(e) => setForm({ ...form, disease: e.target.value })} /></div>
          <div className="field">
            <label>Danh mục</label>
            <select value={form.cat === "" || form.cat == null ? "" : String(form.cat)} onChange={(e) => setForm({ ...form, cat: e.target.value })}>
              <option value="">— Không chọn —</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field"><label>Số mũi</label><input type="number" min={1} value={form.doses} onChange={(e) => setForm({ ...form, doses: e.target.value })} /></div>
          <div className="field"><label>Khoảng cách (ngày)</label><input type="number" min={0} value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} placeholder="null" /></div>
        </div>
        <div className="field"><label>Phác đồ</label><input value={form.proto} onChange={(e) => setForm({ ...form, proto: e.target.value })} placeholder="Mô tả phác đồ" /></div>
        <div className="field">
          <label>Trạng thái</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </Modal>
    </>
  );
}