/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/adminService';
import Topbar from '../../components/layout/Topbar';
import { Overlay, Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

export default function Users() {
  const showToast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.listUsers();
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

  const toggleStatus = async (row) => {
    const next = String(row.status).toUpperCase() === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminService.updateAccountStatus(row.id, next);
      showToast(`Đã đổi trạng thái ${row.name} → ${next}`, 'ok');
      await load();
    } catch (err) {
      showToast(err.message || 'Cập nhật thất bại', 'error');
    }
  };
  const toggle = toggleStatus;

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
                        <button className="row-btn danger" type="button" onClick={() => toggleStatus(u)}>{String(u.status).toUpperCase() === 'SUSPENDED' || String(u.status).toUpperCase() === 'INACTIVE' ? 'Mở khóa' : 'Khóa'}</button>
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