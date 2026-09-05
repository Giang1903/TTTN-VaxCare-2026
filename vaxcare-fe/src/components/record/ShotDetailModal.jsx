import { useState } from 'react';
import VxModal from './VxModal';
import { downloadCertificate } from '../../services/vaccinationService';

export default function ShotDetailModal({ open, onClose, shot }) {
  const s = shot || {};
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState('');

  async function handleDownload() {
    if (!s.detailId) {
      setErr('Không có mã mũi tiêm để tải chứng nhận.');
      return;
    }
    setDownloading(true);
    setErr('');
    try {
      await downloadCertificate(s.detailId);
    } catch (e) {
      setErr(e.message || 'Tải PDF thất bại');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <VxModal
      open={open}
      onClose={onClose}
      titleId="shotDetailTitle"
      title="Chi tiết mũi tiêm"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Đóng
          </button>
          {s.certificateCode ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={downloading || !s.detailId}
            >
              {downloading ? 'Đang tải…' : 'Tải chứng nhận PDF'}
            </button>
          ) : null}
        </>
      }
    >
      {err && <p className="form-error" style={{ marginBottom: 10 }}>{err}</p>}
      <div className="shot-detail-grid">
        <div className="shot-detail-row">
          <span className="lbl">Tên vắc xin / Mũi</span>
          <span className="val">{s.name || '—'}</span>
        </div>
        <div className="shot-detail-row">
          <span className="lbl">Trạng thái</span>
          <span className="val">
            <span className="tl-tag done">{s.status || 'Đã tiêm'}</span>
          </span>
        </div>
        <div className="shot-detail-row">
          <span className="lbl">Ngày tiêm</span>
          <span className="val">{s.date || '—'}</span>
        </div>
        <div className="shot-detail-row">
          <span className="lbl">Cơ sở</span>
          <span className="val">{s.facility || '—'}</span>
        </div>
        <div className="shot-detail-row">
          <span className="lbl">Số lô</span>
          <span className="val">{s.lot || '—'}</span>
        </div>
        <div className="shot-detail-row">
          <span className="lbl">Nhân viên thực hiện</span>
          <span className="val">{s.doctor || '—'}</span>
        </div>
        <div className="shot-detail-row">
          <span className="lbl">Mã chứng nhận</span>
          <span className="val">{s.certificateCode || '—'}</span>
        </div>
        <div className="shot-detail-row">
          <span className="lbl">Ghi chú</span>
          <span className="val">{s.note || '—'}</span>
        </div>
      </div>
    </VxModal>
  );
}