import { useMemo, useState } from 'react';
import Topbar from '../components/layout/Topbar';
import { Overlay, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const INITIAL = [
  { id: 1, name: 'VaxCare Phú Nhuận', addr: '198 Hoàng Văn Thụ, P.Đức Nhuận, TP.HCM', phone: '028-3845-1122', open: '07:30', close: '17:00', cap: 15, status: 'ACTIVE', staff: 6, apptToday: 24 },
  { id: 2, name: 'VaxCare Thủ Đức - Bình Chiểu', addr: '2A Đường Bình Chiểu, P.Tam Bình, TP.HCM', phone: '028-3722-8899', open: '08:00', close: '17:30', cap: 12, status: 'ACTIVE', staff: 4, apptToday: 18 },
  { id: 3, name: 'VaxCare Nowzone', addr: 'Tầng 2, TTTM NOWZONE, 235 Nguyễn Văn Cừ, P.Cầu Ông Lãnh, TP.HCM', phone: '028-3838-5678', open: '08:00', close: '20:00', cap: 18, status: 'ACTIVE', staff: 7, apptToday: 31 },
  { id: 4, name: 'VaxCare Củ Chi - Bình Mỹ', addr: '1239 Tỉnh Lộ 8, ấp Thạnh An 2, X.Bình Mỹ, TP.HCM', phone: '028-3892-3344', open: '07:30', close: '16:30', cap: 10, status: 'ACTIVE', staff: 3, apptToday: 8 },
  { id: 5, name: 'VaxCare Trung Mỹ Tây', addr: 'Số 8 Nguyễn Thị Trên, P. Trung Mỹ Tây, TP.HCM', phone: '028-3715-7788', open: '07:30', close: '17:00', cap: 12, status: 'ACTIVE', staff: 4, apptToday: 14 },
  { id: 6, name: 'VaxCare Co.opmart Quang Trung', addr: 'Lầu 2, TTTM Co.opmart Quang Trung, 304A Quang Trung, P.Thông Tây Hội, TP.HCM', phone: '028-3894-5566', open: '08:00', close: '20:00', cap: 15, status: 'ACTIVE', staff: 5, apptToday: 19 },
  { id: 7, name: 'VaxCare Oriental Plaza', addr: 'Tầng 1, Toà nhà Oriental Plaza, 685 Âu Cơ, P.Tân Phú, TP.HCM', phone: '028-3962-1122', open: '08:00', close: '19:00', cap: 14, status: 'ACTIVE', staff: 5, apptToday: 21 },
  { id: 8, name: 'VaxCare Hóc Môn - Đông Thạnh', addr: '338 Tô Ký, X.Đông Thạnh, TP.HCM', phone: '028-3718-9900', open: '07:30', close: '16:30', cap: 10, status: 'ACTIVE', staff: 3, apptToday: 9 },
  { id: 9, name: 'VaxCare Hiệp Bình', addr: 'Số 566 Quốc Lộ 13, khu phố 6, P.Hiệp Bình, TP.HCM', phone: '028-3721-4455', open: '07:30', close: '17:00', cap: 12, status: 'ACTIVE', staff: 3, apptToday: 12 },
  { id: 10, name: 'VaxCare Tân Định', addr: '290 Hai Bà Trưng, P.Tân Định, TP.HCM', phone: '028-3820-7788', open: '07:30', close: '17:30', cap: 15, status: 'ACTIVE', staff: 4, apptToday: 16 },
  { id: 11, name: 'VaxCare An Lạc', addr: '539A-539B Kinh Dương Vương, khu phố 58, P.An Lạc, TP.HCM', phone: '028-3875-2233', open: '08:00', close: '17:00', cap: 12, status: 'ACTIVE', staff: 3, apptToday: 11 },
  { id: 12, name: 'VaxCare Phú Thuận', addr: '1189 Huỳnh Tấn Phát, P.Phú Thuận, TP.HCM', phone: '028-3873-6677', open: '07:30', close: '17:00', cap: 11, status: 'ACTIVE', staff: 3, apptToday: 7 },
];

export default function Facilities() {
  const showToast = useToast();
  const [list, setList] = useState(INITIAL);
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

  const save = () => {
    if (!form.name.trim()) {
      showToast('Vui lòng nhập tên cơ sở', 'warn');
      return;
    }
    if (editId) {
      setList((prev) => prev.map((x) => (x.id === editId ? { ...x, ...form, cap: Number(form.cap) || 12 } : x)));
      showToast('Đã cập nhật ' + form.name, 'ok');
    } else {
      setList((prev) => [...prev, { id: prev.length + 1, staff: 0, apptToday: 0, ...form, cap: Number(form.cap) || 12 }]);
      showToast('Đã thêm cơ sở ' + form.name, 'ok');
    }
    setFormOpen(false);
  };

  const toggle = (f) => {
    setList((prev) =>
      prev.map((x) =>
        x.id === f.id ? { ...x, status: x.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : x
      )
    );
    const next = f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    showToast(next === 'ACTIVE' ? 'Đã kích hoạt ' + f.name : 'Đã ngừng ' + f.name, 'ok');
  };

  return (
    <>
      <Topbar title="Cơ sở tiêm chủng" subtitle="Thứ Ba, 18/08/2026 · vaccination_facilities" onSearch={setQ} searchPlaceholder="Tìm tên, địa chỉ, SĐT…" />
      <div className="content">
        <section className="kpi-row">
          <div className="kpi c1"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l7-4 7 4v14" /></svg></span></div><div className="num">12</div><div className="lbl">Tổng cơ sở</div></div>
          <div className="kpi c2"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></span></div><div className="num">12</div><div className="lbl">Đang hoạt động</div></div>
          <div className="kpi c3"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></span></div><div className="num">48</div><div className="lbl">Nhân viên phân bổ</div></div>
          <div className="kpi c4"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l2 5 4-14 2 9h6" /></svg></span></div><div className="num">156</div><div className="lbl">Tổng capacity/slot</div></div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {[
              { f: 'all', label: 'Tất cả (12)' },
              { f: 'ACTIVE', label: 'Đang hoạt động' },
              { f: 'INACTIVE', label: 'Ngừng' },
            ].map((t) => (
              <button key={t.f} type="button" className={filter === t.f ? 'active' : ''} onClick={() => setFilter(t.f)}>{t.label}</button>
            ))}
          </div>
          <div className="toolbar-right">
            <button className="btn outline" type="button" onClick={() => showToast('Đang xuất danh sách cơ sở…', 'ok')}>Xuất danh sách</button>
            <button className="btn primary" type="button" onClick={() => openForm(null)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
              Thêm cơ sở
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div><h3>Danh sách cơ sở</h3><div className="sub">vaccination_facilities · 12 bản ghi</div></div></div>
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
            <div className="detail-row"><span className="lbl">Nhân viên</span><span className="val">{detail.staff} người</span></div>
            <div className="detail-row"><span className="lbl">Lịch hôm nay</span><span className="val">{detail.apptToday}</span></div>
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
