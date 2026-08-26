import { useEffect, useState } from 'react';
import VxModal from './VxModal';
import { updateProfile } from '../../services/authService';
import { getMyHealthProfile, saveHealthProfile } from '../../services/healthProfileService';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--gray-300)',
  borderRadius: '10px',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  marginBottom: '6px',
  color: '#1e293b',
};

function toDateInput(dob) {
  if (!dob) return '';
  const s = String(dob);
  if (s.includes('-') && s.length >= 10) return s.slice(0, 10);
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return '';
}

export default function EditProfileModal({ open, onClose, profile, onSaved }) {
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    height: '',
    weight: '',
    medicalHistory: '',
    allergies: '',
    healthNote: '',
  });
  const [profileId, setProfileId] = useState(null);
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
      height: '',
      weight: '',
      medicalHistory: '',
      allergies: '',
      healthNote: '',
    });
    setProfileId(null);
    setError('');

    getMyHealthProfile()
      .then((hp) => {
        if (!hp) return;
        setProfileId(hp.profileId ?? hp.id ?? null);
        setForm((f) => ({
          ...f,
          height: hp.height != null ? String(hp.height) : '',
          weight: hp.weight != null ? String(hp.weight) : '',
          medicalHistory: hp.medicalHistory || '',
          allergies: hp.allergies || '',
          healthNote: hp.note || hp.healthNote || '',
        }));
      })
      .catch(() => {
      });
  }, [open, profile]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSave() {
    const fullName = form.fullName.trim();
    if (!fullName) {
      setError('Họ và tên không được để trống.');
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

      await saveHealthProfile({
        profileId,
        height: form.height,
        weight: form.weight,
        medicalHistory: form.medicalHistory.trim(),
        allergies: form.allergies.trim(),
        note: form.healthNote.trim(),
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
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={submitting}>
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
          <p className="form-error" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}

        <p style={{ fontSize: 12.5, fontWeight: 800, color: '#64748b', marginBottom: 10, letterSpacing: 0.4 }}>
          THÔNG TIN CÁ NHÂN
        </p>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Họ và tên</label>
          <input type="text" name="fullName" value={form.fullName} onChange={handleChange} style={inputStyle} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="form-field">
            <label style={labelStyle}>Ngày sinh</label>
            <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} style={inputStyle} />
          </div>
          <div className="form-field">
            <label style={labelStyle}>Số điện thoại</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} style={inputStyle} />
          </div>
        </div>
        <div className="form-field" style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Địa chỉ / Tỉnh thành</label>
          <input type="text" name="address" value={form.address} onChange={handleChange} style={inputStyle} />
        </div>

        <p style={{ fontSize: 12.5, fontWeight: 800, color: '#64748b', marginBottom: 10, letterSpacing: 0.4 }}>
          HỒ SƠ SỨC KHỎE
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="form-field">
            <label style={labelStyle}>Chiều cao (cm)</label>
            <input type="number" name="height" min="0" step="0.1" value={form.height} onChange={handleChange} style={inputStyle} placeholder="VD: 165" />
          </div>
          <div className="form-field">
            <label style={labelStyle}>Cân nặng (kg)</label>
            <input type="number" name="weight" min="0" step="0.1" value={form.weight} onChange={handleChange} style={inputStyle} placeholder="VD: 55" />
          </div>
        </div>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Dị ứng</label>
          <input
            type="text"
            name="allergies"
            value={form.allergies}
            onChange={handleChange}
            style={inputStyle}
            placeholder="VD: Penicillin, trứng…"
          />
        </div>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Tiền sử bệnh</label>
          <textarea
            name="medicalHistory"
            value={form.medicalHistory}
            onChange={handleChange}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Bệnh nền, phẫu thuật…"
          />
        </div>
        <div className="form-field" style={{ marginBottom: 4 }}>
          <label style={labelStyle}>Ghi chú sức khỏe</label>
          <textarea
            name="healthNote"
            value={form.healthNote}
            onChange={handleChange}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Ghi chú thêm cho nhân viên y tế…"
          />
        </div>
      </form>
    </VxModal>
  );
}
