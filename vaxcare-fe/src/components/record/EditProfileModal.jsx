import { useEffect, useState } from 'react';
import VxModal from './VxModal';
import { updateProfile } from '../../services/authService';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--gray-300)',
  borderRadius: '10px',
  fontSize: '14px',
};

function toDateInput(dob) {
  if (!dob) return '';
  const s = String(dob);
  if (s.includes('-') && s.length >= 10) return s.slice(0, 10);
  // dd/mm/yyyy
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return '';
}

// ============ MODAL: Chỉnh sửa hồ sơ ============
export default function EditProfileModal({ open, onClose, profile, onSaved }) {
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      fullName: profile.fullName || '',
      dateOfBirth: toDateInput(profile.dateOfBirth),
      address: profile.address || '',
      phone: profile.phone || '',
    });
    setError('');
  }, [open, profile]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSave() {
    const fullName = form.fullName.trim();
    if (!fullName) {
      setError('Vui lòng nhập họ tên.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const updated = await updateProfile({
        fullName,
        phone: form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        address: form.address.trim() || undefined,
      });
      onSaved?.(updated);
      onClose?.();
    } catch (err) {
      const fieldMessage = err.fieldErrors && Object.values(err.fieldErrors)[0];
      setError(fieldMessage || err.message || 'Cập nhật thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <VxModal
      open={open}
      onClose={onClose}
      titleId="editProfileTitle"
      title="Chỉnh sửa hồ sơ"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        {error && (
          <p className="form-error" style={{ marginBottom: '12px' }}>
            {error}
          </p>
        )}
        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Họ và tên
          </label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            style={inputStyle}
            required
          />
        </div>
        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Ngày sinh
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={form.dateOfBirth}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Địa chỉ / Tỉnh thành
          </label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Số điện thoại
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </form>
    </VxModal>
  );
}