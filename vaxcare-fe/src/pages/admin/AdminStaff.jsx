/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService';
import Topbar from '../../components/layout/Topbar';
import { Overlay, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const FAC_NAMES = { 1: 'Phú Nhuận', 2: 'Thủ Đức', 3: 'Nowzone', 6: 'Co.opmart QT', 7: 'Oriental Plaza', 10: 'Tân Định' };
export default function Staff() {
  const showToast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.listStaff();
      setList((data || []).map(adminService.mapAccountToUi));
    } catch (err) {
      showToast(err.message || 'Không tải được danh sách', 'error');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);
  const [filterFac, setFilterFac] = useState('all');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', spec: 'Tiêm chủng', fac: 1, email: '', phone: '', status: 'ACTIVE' });

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return list.filter((s) => {
      if (filterFac !== 'all' && String(s.fac) !== filterFac) return false;
      if (!qq) return true;
      return (s.name + s.code + s.spec + s.email + (FAC_NAMES[s.fac] || '')).toLowerCase().includes(qq);
    });
  }, [list, filterFac, q]);

  const kpiTotal = list.length;
  const kpiActive = list.filter((s) => s.status === 'ACTIVE').length;

  const openForm = (s) => {
    setEditId(s ? s.id : null);
    setForm(
      s
        ? { name: s.name, code: s.code, spec: s.spec, fac: s.fac, email: s.email, phone: s.phone, status: s.status }
        : { name: '', code: '', spec: 'Tiêm chủng', fac: 1, email: '', phone: '', status: 'ACTIVE' }
    );
    setDetail(null);
    setFormOpen(true);
  };

  const save = async () => {
    showToast('Tạo/sửa nhân viên qua API đang hạn chế — dùng đổi trạng thái tài khoản. Vui lòng seed NV từ BE.', 'warn');
    setFormOpen(false);
  };

  const lock = async (s) => {
    const next = String(s.status).toUpperCase() === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateAccountStatus(s.id, next);
      showToast(next === 'SUSPENDED' ? 'Đã khóa TK ' + s.name : 'Đã mở khóa ' + s.name, 'ok');
      await load();
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại', 'error');
    }
  };

  return (
    <>
      <Topbar title="Nhân viên y tế" subtitle="Thứ Ba, 18/08/2026 · medical_staff" onSearch={setQ} searchPlaceholder="Tìm tên, mã NV, chuyên môn…" />
      <div className="content">
        <section className="kpi-row">
          <div className="kpi c1"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></span></div><div className="num">{kpiTotal}</div><div className="lbl">Tổng nhân viên</div></div>
          <div className="kpi c2"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></span></div><div className="num">{kpiActive}</div><div className="lbl">Đang làm việc</div></div>
          <div className="kpi c3"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l7-4 7 4v14" /></svg></span></div><div className="num">{new Set(list.map((x) => x.facilityId).filter(Boolean)).size}</div><div className="lbl">Cơ sở có NV</div></div>
          <div className="kpi c4"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></span></div><div className="num">1</div><div className="lbl">Chờ kích hoạt TK</div></div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {[
              { f: 'all', label: 'Tất cả' },
              { f: '1', label: 'Phú Nhuận' },
              { f: '3', label: 'Nowzone' },
              { f: '7', label: 'Oriental' },
              { f: '2', label: 'Thủ Đức' },
            ].map((t) => (
              <button key={t.f} type="button" className={filterFac === t.f ? 'active' : ''} onClick={() => setFilterFac(t.f)}>{t.label}</button>
            ))}
          </div>
          <div className="toolbar-right">
            <button className="btn outline" type="button" onClick={() => showToast('Đang xuất danh sách nhân viên…', 'ok')}>Xuất</button>
            <button className="btn primary" type="button" onClick={() => openForm(null)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
              Thêm nhân viên
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div><h3>Danh sách nhân viên</h3><div className="sub">medical_staff + accounts (role MEDICAL_STAFF)</div></div></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nhân viên</th><th>Mã NV</th><th>Chuyên môn</th><th>Cơ sở</th><th>Email / SĐT</th><th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="who-cell">
                        <div className="who-av">{s.initials}</div>
                        <div>
                          <div className="who-name">{s.name}</div>
                          <div className="who-meta">{s.shots} mũi (30 ngày)</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{s.code}</td>
                    <td>{s.spec}</td>
                    <td>{FAC_NAMES[s.fac] || '—'}</td>
                    <td>
                      <div className="who-meta" style={{ color: 'var(--ink)' }}>{s.email}</div>
                      <div className="who-meta">{s.phone}</div>
                    </td>
                    <td>
                      <span className={`tag ${s.status === 'ACTIVE' ? 'ok' : s.status === 'LOCKED' ? 'warn' : 'neutral'}`}>{s.status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="row-btn outline" type="button" onClick={() => setDetail(s)}>Chi tiết</button>
                        <button className="row-btn solid" type="button" onClick={() => openForm(s)}>Sửa</button>
                        <button className="row-btn danger" type="button" onClick={() => lock(s)}>{s.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}</button>
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
        title={detail?.name || 'Chi tiết NV'}
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
            <div className="detail-row"><span className="lbl">Mã NV</span><span className="val mono">{detail.code}</span></div>
            <div className="detail-row"><span className="lbl">Chuyên môn</span><span className="val">{detail.spec}</span></div>
            <div className="detail-row"><span className="lbl">Cơ sở</span><span className="val">{FAC_NAMES[detail.fac]}</span></div>
            <div className="detail-row"><span className="lbl">Email</span><span className="val">{detail.email}</span></div>
            <div className="detail-row"><span className="lbl">SĐT</span><span className="val">{detail.phone}</span></div>
            <div className="detail-row"><span className="lbl">Mũi tiêm 30 ngày</span><span className="val">{detail.shots}</span></div>
            <div className="detail-row"><span className="lbl">Trạng thái TK</span><span className="val"><span className={`tag ${detail.status === 'ACTIVE' ? 'ok' : 'neutral'}`}>{detail.status}</span></span></div>
          </>
        )}
      </Modal>

      <Modal
        open={formOpen}
        title={editId ? 'Sửa nhân viên' : 'Thêm nhân viên'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn outline" type="button" onClick={() => setFormOpen(false)}>Hủy</button>
            <button className="btn primary" type="button" onClick={save}>Lưu</button>
          </>
        }
      >
        <div className="field"><label>Họ và tên <span className="req">*</span></label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="BS. …" /></div>
        <div className="field-row">
          <div className="field"><label>Mã NV <span className="req">*</span></label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="STF-XX-000" /></div>
          <div className="field"><label>Chuyên môn</label><input value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} placeholder="Tiêm chủng" /></div>
        </div>
        <div className="field">
          <label>Cơ sở <span className="req">*</span></label>
          <select value={form.fac} onChange={(e) => setForm({ ...form, fac: e.target.value })}>
            <option value="1">VaxCare Phú Nhuận</option>
            <option value="2">VaxCare Thủ Đức</option>
            <option value="3">VaxCare Nowzone</option>
            <option value="7">VaxCare Oriental Plaza</option>
            <option value="6">VaxCare Co.opmart QT</option>
            <option value="10">VaxCare Tân Định</option>
          </select>
        </div>
        <div className="field-row">
          <div className="field"><label>Email tài khoản</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@vaxcare.vn" /></div>
          <div className="field"><label>Số điện thoại</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="090…" /></div>
        </div>
        <div className="field">
          <label>Trạng thái tài khoản</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="LOCKED">LOCKED</option>
          </select>
        </div>
      </Modal>
    </>
  );
}