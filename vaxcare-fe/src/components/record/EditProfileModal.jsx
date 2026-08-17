import { useState } from 'react';
import VxModal from './VxModal';
import { profile } from '../../mockdata/record';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--gray-300)',
  borderRadius: '10px',
  fontSize: '14px',
};

// ============ MODAL: Chỉnh sửa hồ sơ ============
export default function EditProfileModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    name: profile.name,
    dob: profile.dobInput,
    address: profile.city,
    id: profile.idInput,
    phone: profile.phone,
  });

  function handleChange(e) {
    const { id, value } = e.target;
    setForm((f) => ({ ...f, [id]: value }));
  }

  function handleSave() {
    const name = form.name.trim();
    if (!name) {
      alert('Vui lòng nhập họ tên.');
      return;
    }
    onSave(name);
    alert('Đã lưu thay đổi hồ sơ (demo).');
  }

  return (
    <VxModal
      open={open}
      onClose={onClose}
      titleId="editProfileTitle"
      title="Chỉnh sửa hồ sơ"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Lưu thay đổi</button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Họ và tên</label>
          <input type="text" id="name" value={form.name} onChange={handleChange} style={inputStyle} required />
        </div>
        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Ngày sinh</label>
          <input type="date" id="dob" value={form.dob} onChange={handleChange} style={inputStyle} required />
        </div>
        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Địa chỉ / Tỉnh thành</label>
          <input type="text" id="address" value={form.address} onChange={handleChange} style={inputStyle} required />
        </div>
        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Số CCCD / CMND</label>
          <input type="text" id="id" value={form.id} onChange={handleChange} style={inputStyle} required />
        </div>
        <div className="form-field" style={{ marginBottom: '6px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Số điện thoại</label>
          <input type="tel" id="phone" value={form.phone} onChange={handleChange} style={inputStyle} />
        </div>
      </form>
    </VxModal>
  );
}
