/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService';
import Topbar from '../../components/layout/Topbar';
import { Overlay, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export default function Staff() {
  const showToast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, facs] = await Promise.all([
        adminService.listStaff(),
        adminService.getFacilitiesAdmin().catch(() => []),
      ]);
      setList((data || []).map(adminService.mapAccountToUi));
      setFacilities((facs || []).map(adminService.mapFacilityToUi));
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
  const [form, setForm] = useState({ name: '', code: '', spec: 'Tiêm chủng', fac: '', email: '', phone: '', password: '', status: 'ACTIVE' });
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return list.filter((s) => {
      const facId = s.facilityId ?? s.fac;
      if (filterFac !== 'all' && String(facId ?? '') !== String(filterFac)) return false;
      if (!qq) return true;
      const facName =
        facilities.find((f) => String(f.id) === String(facId))?.name || s.facility || '';
      const hay = [s.name, s.staffCode || s.code, s.specialty || s.spec, s.email, s.phone, facName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [list, filterFac, q, facilities]);

  const kpiTotal = list.length;
  const kpiActive = list.filter((s) => s.status === 'ACTIVE').length;
  const kpiPending = list.filter((s) => s.status === 'INACTIVE').length;

  const openForm = (s) => {
    setEditId(s ? s.id : null);
    setForm(
      s
        ? { name: s.name, code: s.staffCode || s.code, spec: s.specialty || s.spec, fac: s.facilityId || s.fac || '', email: s.email, phone: s.phone, password: '', status: s.status }
        : { name: '', code: '', spec: 'Tiêm chủng', fac: '', email: '', phone: '', password: '', status: 'ACTIVE' }
    );
    setDetail(null);
    setFormOpen(true);
  };


  const save = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (saving) return;
    if (!form.name?.trim() || !form.code?.trim() || !form.email?.trim()) {
      showToast('Nhập họ tên, mã NV và email', 'warn');
      return;
    }
    // Chỉ bắt mật khẩu khi TẠO MỚI (sửa: bỏ qua autofill trình duyệt)
    if (!editId) {
      if (!form.password || String(form.password).length < 6) {
        showToast('Nhập mật khẩu (tối thiểu 6 ký tự)', 'warn');
        return;
      }
    }
    if (form.fac === '' || form.fac == null) {
      showToast('Chọn cơ sở làm việc', 'warn');
      return;
    }
    const facilityId = Number(form.fac);
    if (!Number.isFinite(facilityId) || facilityId <= 0) {
      showToast('Cơ sở không hợp lệ', 'warn');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const jobs = [];
        jobs.push(
          adminService.updateStaff(editId, {
            fullName: form.name.trim(),
            staffCode: form.code.trim(),
            specialty: form.spec?.trim() || undefined,
            phone: form.phone?.trim() || undefined,
            facilityId,
          }),
        );
        if (form.status) {
          jobs.push(adminService.updateAccountStatus(editId, form.status));
        }
        const pwd = String(form.password || '').trim();
        if (pwd) {
          if (pwd.length < 6) {
            showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'warn');
            setSaving(false);
            return;
          }
          jobs.push(adminService.setAccountPassword(editId, pwd));
        }
        await Promise.all(jobs);
        showToast(
          pwd
            ? 'Đã lưu thay đổi và đặt mật khẩu mới cho ' + form.name
            : 'Đã lưu thay đổi nhân viên ' + form.name,
          'ok',
        );
      } else {
        await adminService.createStaff({
          email: form.email.trim(),
          password: String(form.password),
          phone: form.phone?.trim() || undefined,
          fullName: form.name.trim(),
          staffCode: form.code.trim(),
          specialty: form.spec?.trim() || undefined,
          facilityId,
        });
        showToast('Đã tạo nhân viên ' + form.name, 'ok');
      }
      setFormOpen(false);
      setEditId(null);
      setForm({ name: '', code: '', spec: 'Tiêm chủng', fac: '', email: '', phone: '', password: '', status: 'ACTIVE' });
      await load();
    } catch (err) {
      const fe = err.fieldErrors;
      const detail = fe
        ? Object.values(fe).flat().filter(Boolean).join('; ')
        : null;
      showToast(detail || err.message || (editId ? 'Cập nhật NV thất bại' : 'Tạo NV thất bại'), 'error');
    } finally {
      setSaving(false);
    }
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
          <div className="kpi c4"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></span></div><div className="num">{kpiPending}</div><div className="lbl">Chờ kích hoạt TK</div></div>
        </section>

        <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 240px', minWidth: 0 }}>
            <label htmlFor="staff-fac-filter" style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-600)', whiteSpace: 'nowrap' }}>
              Cơ sở
            </label>
            <select
              id="staff-fac-filter"
              value={filterFac}
              onChange={(e) => setFilterFac(e.target.value)}
              style={{
                flex: '1 1 auto',
                minWidth: 180,
                maxWidth: 420,
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid var(--gray-100)',
                background: 'var(--gray-50)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--ink)',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <option value="all">Tất cả cơ sở ({facilities.length})</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={String(fac.id)}>
                  {fac.name}
                </option>
              ))}
            </select>
          </div>
          <div className="toolbar-right" style={{ marginLeft: 0 }}>
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
                          <div className="who-meta">{s.specialty || s.spec || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono">{s.staffCode || s.code || '—'}</td>
                    <td>{s.specialty || s.spec || '—'}</td>
                    <td>{(facilities.find(f => String(f.id) === String(s.facilityId ?? s.fac))?.name || s.facility || '') || '—'}</td>
                    <td>
                      <div className="who-meta" style={{ color: 'var(--ink)' }}>{s.email}</div>
                      <div className="who-meta">{s.phone}</div>
                    </td>
                    <td>
                      <span className={`tag ${s.status === 'ACTIVE' ? 'ok' : s.status === 'SUSPENDED' ? 'warn' : 'neutral'}`}>{s.status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="row-btn outline" type="button" onClick={() => setDetail(s)}>Chi tiết</button>
                        <button className="row-btn solid" type="button" onClick={() => openForm(s)}>Sửa</button>
                        <button className="row-btn danger" type="button" onClick={() => lock(s)}>{s.status === 'SUSPENDED' ? 'Mở khóa' : 'Khóa'}</button>
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
            <div className="detail-row"><span className="lbl">Mã NV</span><span className="val mono">{detail.staffCode || detail.code}</span></div>
            <div className="detail-row"><span className="lbl">Chuyên môn</span><span className="val">{detail.spec}</span></div>
            <div className="detail-row"><span className="lbl">Cơ sở</span><span className="val">{(facilities.find(f=>f.id===detail.facilityId||f.id===detail.fac)?.name || detail.facility || '')}</span></div>
            <div className="detail-row"><span className="lbl">Email</span><span className="val">{detail.email}</span></div>
            <div className="detail-row"><span className="lbl">SĐT</span><span className="val">{detail.phone}</span></div>
            <div className="detail-row"><span className="lbl">Ngày tạo TK</span><span className="val">{detail.createdAt ? String(detail.createdAt).slice(0, 10) : '—'}</span></div>
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
            <button className="btn primary" type="button" onClick={save} disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</button>
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
          <select value={form.fac === "" || form.fac == null ? "" : String(form.fac)} onChange={(e) => setForm({ ...form, fac: e.target.value })}>
            <option value="">— Chọn cơ sở —</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Email tài khoản</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="staff@vaxcare.vn"
              disabled={!!editId}
              readOnly={!!editId}
            />
          </div>
          <div className="field">
            <label>Mật khẩu {!editId && <span className="req">*</span>}</label>
            <input
              type="password"
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={'Để trống nếu không đổi'}
              autoComplete="new-password"
            />
          </div>
          <div className="field"><label>Số điện thoại</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="090…" /></div>
        </div>
        <div className="field">
          <label>Trạng thái tài khoản</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </Modal>
    </>
  );
}