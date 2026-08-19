import { useMemo, useState } from 'react';
import Topbar from '../components/layout/Topbar';
import { Overlay, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

const INITIAL = [
  { id: 1, name: 'Nguyễn An', initials: 'NA', email: 'nguyen.an@email.com', phone: '0901234567', gender: 'Nam', age: 28, addr: 'Quận Phú Nhuận, TP.HCM', status: 'ACTIVE', appts: 5, lastLogin: '17/08/2026' },
  { id: 13, name: 'Lê Thị Thu', initials: 'LT', email: 'le.thu@email.com', phone: '0912345678', gender: 'Nữ', age: 3, addr: 'Quận 1 (phụ huynh)', status: 'ACTIVE', appts: 3, lastLogin: '17/08/2026' },
  { id: 14, name: 'Phạm Gia Huy', initials: 'PH', email: 'pham.huy.parent@email.com', phone: '0987654321', gender: 'Nam', age: 0, addr: 'Quận Bình Thạnh', status: 'ACTIVE', appts: 4, lastLogin: '17/08/2026' },
  { id: 15, name: 'Trần Văn Khoa', initials: 'TV', email: 'tran.khoa@email.com', phone: '0933111222', gender: 'Nam', age: 15, addr: 'Quận Tân Bình', status: 'ACTIVE', appts: 2, lastLogin: '16/08/2026' },
  { id: 16, name: 'Hoàng Ngọc Mai', initials: 'HN', email: 'hoang.mai@email.com', phone: '0909888777', gender: 'Nữ', age: 16, addr: 'Quận 3', status: 'ACTIVE', appts: 1, lastLogin: '15/08/2026' },
  { id: 17, name: 'Vũ Đình Đạt', initials: 'VD', email: 'vu.dat.parent@email.com', phone: '0911222333', gender: 'Nam', age: 2, addr: 'Quận Phú Nhuận', status: 'ACTIVE', appts: 2, lastLogin: '14/08/2026' },
  { id: 18, name: 'Đỗ Lan Anh', initials: 'ĐL', email: 'do.lananh@email.com', phone: '0977444555', gender: 'Nữ', age: 5, addr: 'Quận Gò Vấp', status: 'ACTIVE', appts: 1, lastLogin: '13/08/2026' },
  { id: 19, name: 'Nguyễn Minh Quân', initials: 'NM', email: 'nguyen.quan@email.com', phone: '0905555666', gender: 'Nam', age: 42, addr: 'Quận 7', status: 'ACTIVE', appts: 3, lastLogin: '18/08/2026' },
  { id: 20, name: 'Huỳnh Thị Bình', initials: 'HT', email: 'huynh.binh@email.com', phone: '0922333444', gender: 'Nữ', age: 55, addr: 'Quận Tân Phú', status: 'ACTIVE', appts: 1, lastLogin: '12/08/2026' },
  { id: 21, name: 'Phan Thành Đạt', initials: 'PT', email: 'phan.dat@email.com', phone: '0944555666', gender: 'Nam', age: 31, addr: 'Quận 10', status: 'INACTIVE', appts: 0, lastLogin: '01/07/2026' },
  { id: 22, name: 'Lý Hoàng Long', initials: 'LH', email: 'ly.long@email.com', phone: '0955666777', gender: 'Nam', age: 24, addr: 'Quận Bình Tân', status: 'LOCKED', appts: 2, lastLogin: '20/06/2026' },
  { id: 23, name: 'Trịnh Mỹ Linh', initials: 'TM', email: 'trinh.linh@email.com', phone: '0966777888', gender: 'Nữ', age: 29, addr: 'TP. Thủ Đức', status: 'ACTIVE', appts: 6, lastLogin: '18/08/2026' },
];

export default function Users() {
  const showToast = useToast();
  const [list, setList] = useState(INITIAL);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState(null);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return list.filter((u) => {
      if (filter !== 'all' && u.status !== filter) return false;
      if (!qq) return true;
      return (u.name + u.email + u.phone).toLowerCase().includes(qq);
    });
  }, [list, filter, q]);

  const toggleStatus = (u) => {
    setList((prev) =>
      prev.map((x) => {
        if (x.id !== u.id) return x;
        let status = x.status;
        if (status === 'LOCKED') status = 'ACTIVE';
        else if (status === 'ACTIVE') status = 'LOCKED';
        else status = 'ACTIVE';
        return { ...x, status };
      })
    );
    const next = u.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    showToast(next === 'LOCKED' ? 'Đã khóa tài khoản ' + u.name : 'Đã mở khóa ' + u.name, 'ok');
    if (detail?.id === u.id) {
      setDetail((d) => ({ ...d, status: next === 'LOCKED' ? 'LOCKED' : 'ACTIVE' }));
    }
  };

  return (
    <>
      <Topbar title="Người dùng" subtitle="Thứ Ba, 18/08/2026 · accounts + users (role USER)" onSearch={setQ} searchPlaceholder="Tìm tên, email, SĐT…" />
      <div className="content">
        <section className="kpi-row">
          <div className="kpi c1"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></span></div><div className="num">1,248</div><div className="lbl">Tổng tài khoản USER</div></div>
          <div className="kpi c2"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></span></div><div className="num">1,186</div><div className="lbl">ACTIVE</div></div>
          <div className="kpi c3"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg></span></div><div className="num">12</div><div className="lbl">LOCKED / INACTIVE</div></div>
          <div className="kpi c4"><div className="top"><span className="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></span></div><div className="num">86</div><div className="lbl">Đăng ký 30 ngày</div></div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {['all', 'ACTIVE', 'LOCKED', 'INACTIVE'].map((f) => (
              <button key={f} type="button" className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Tất cả' : f}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <button className="btn outline" type="button" onClick={() => showToast('Đang xuất CSV người dùng…', 'ok')}>Xuất CSV</button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div><h3>Danh sách người dùng</h3><div className="sub">Demo 12 bản ghi · production ~1.2k</div></div></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Người dùng</th><th>Email</th><th>SĐT</th><th>Giới tính / Tuổi</th><th>Lịch hẹn</th><th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="who-cell">
                        <div className="who-av">{u.initials}</div>
                        <div>
                          <div className="who-name">{u.name}</div>
                          <div className="who-meta">ID #{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td className="mono">{u.phone}</td>
                    <td>{u.gender}{u.age ? ` · ${u.age} tuổi` : ' · trẻ nhỏ'}</td>
                    <td className="mono">{u.appts}</td>
                    <td>
                      <span className={`tag ${u.status === 'ACTIVE' ? 'ok' : u.status === 'LOCKED' ? 'danger' : 'neutral'}`}>{u.status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="row-btn outline" type="button" onClick={() => setDetail(u)}>Chi tiết</button>
                        <button className="row-btn danger" type="button" onClick={() => toggleStatus(u)}>{u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>Hiển thị <strong>1–12</strong> trên tổng <strong>1,248</strong></span>
            <div className="pagination">
              <button type="button">‹</button>
              <button type="button" className="active">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">›</button>
            </div>
          </div>
        </div>
      </div>

      <Overlay open={!!detail} onClose={() => setDetail(null)} />
      <Modal
        open={!!detail}
        title={detail?.name || 'Chi tiết người dùng'}
        onClose={() => setDetail(null)}
        footer={
          <>
            <button className="btn outline" type="button" onClick={() => setDetail(null)}>Đóng</button>
            <button className="btn outline" type="button" onClick={() => showToast('Đã gửi email reset mật khẩu (demo)', 'ok')}>Reset mật khẩu</button>
            <button className="btn primary" type="button" onClick={() => detail && toggleStatus(detail)}>
              {detail?.status === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
            </button>
          </>
        }
      >
        {detail && (
          <>
            <div className="detail-row"><span className="lbl">Account ID</span><span className="val mono">#{detail.id}</span></div>
            <div className="detail-row"><span className="lbl">Email</span><span className="val">{detail.email}</span></div>
            <div className="detail-row"><span className="lbl">SĐT</span><span className="val">{detail.phone}</span></div>
            <div className="detail-row"><span className="lbl">Giới tính / Tuổi</span><span className="val">{detail.gender}{detail.age ? ` · ${detail.age} tuổi` : ''}</span></div>
            <div className="detail-row"><span className="lbl">Địa chỉ</span><span className="val">{detail.addr}</span></div>
            <div className="detail-row"><span className="lbl">Số lịch hẹn</span><span className="val">{detail.appts}</span></div>
            <div className="detail-row"><span className="lbl">Đăng nhập gần nhất</span><span className="val">{detail.lastLogin}</span></div>
            <div className="detail-row">
              <span className="lbl">Trạng thái</span>
              <span className="val">
                <span className={`tag ${detail.status === 'ACTIVE' ? 'ok' : detail.status === 'LOCKED' ? 'danger' : 'neutral'}`}>{detail.status}</span>
              </span>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
