import { useEffect, useState } from 'react';
import VxModal from './VxModal';
import { saveHealthProfile } from '../../services/healthProfileService';

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
  fontWeight: 600,
  marginBottom: '6px',
};

export default function EditHealthProfileModal({ open, onClose, health, profileId, onSaved }) {
  const [form, setForm] = useState({
    height: '',
    weight: '',
    allergies: '',
    medicalHistory: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      height: health?.height != null ? String(health.height) : '',
      weight: health?.weight != null ? String(health.weight) : '',
      allergies: health?.allergies || '',
      medicalHistory: health?.medicalHistory || '',
      note: health?.healthNote || health?.note || '',
    });
    setError('');
  }, [open, health]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSave() {
    const h = form.height.trim();
    const w = form.weight.trim();
    if (h && (Number.isNaN(Number(h)) || Number(h) <= 0 || Number(h) > 300)) {
      setError('Chiều cao không hợp lệ (cm).');
      return;
    }
    if (w && (Number.isNaN(Number(w)) || Number(w) <= 0 || Number(w) > 500)) {
      setError('Cân nặng không hợp lệ (kg).');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const result = await saveHealthProfile({
        profileId: profileId || health?.profileId,
        height: h || null,
        weight: w || null,
        allergies: form.allergies.trim() || null,
        medicalHistory: form.medicalHistory.trim() || null,
        note: form.note.trim() || null,
      });
      onSaved?.(result);
      onClose?.();
    } catch (err) {
      const fieldMessage = err.fieldErrors && Object.values(err.fieldErrors)[0];
      setError(fieldMessage || err.message || 'Lưu hồ sơ sức khỏe thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <VxModal
      open={open}
      onClose={onClose}
      titleId="editHealthTitle"
      title="Hồ sơ sức khỏe"
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
            {submitting ? 'Đang lưu…' : 'Lưu'}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div className="form-field">
            <label style={labelStyle}>Chiều cao (cm)</label>
            <input
              type="number"
              name="height"
              min="1"
              max="300"
              step="0.1"
              value={form.height}
              onChange={handleChange}
              style={inputStyle}
              placeholder="VD: 170"
            />
          </div>
          <div className="form-field">
            <label style={labelStyle}>Cân nặng (kg)</label>
            <input
              type="number"
              name="weight"
              min="1"
              max="500"
              step="0.1"
              value={form.weight}
              onChange={handleChange}
              style={inputStyle}
              placeholder="VD: 65"
            />
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Dị ứng</label>
          <textarea
            name="allergies"
            value={form.allergies}
            onChange={handleChange}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Thuốc, thực phẩm, thành phần vắc xin…"
          />
        </div>

        <div className="form-field" style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Tiền sử bệnh</label>
          <textarea
            name="medicalHistory"
            value={form.medicalHistory}
            onChange={handleChange}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Bệnh mãn tính, phẫu thuật, điều trị đang dùng…"
          />
        </div>

        <div className="form-field" style={{ marginBottom: '4px' }}>
          <label style={labelStyle}>Ghi chú thêm</label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
            placeholder="Ghi chú cho nhân viên y tế…"
          />
        </div>
      </form>
    </VxModal>
  );
}