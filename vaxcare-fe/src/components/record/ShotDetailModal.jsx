import VxModal from './VxModal';

// ============ MODAL: Chi tiết mũi tiêm ============
export default function ShotDetailModal({ open, onClose, shot }) {
  const s = shot || {};
  return (
    <VxModal
      open={open}
      onClose={onClose}
      titleId="shotDetailTitle"
      title="Chi tiết mũi tiêm"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Đóng</button>
          <button type="button" className="btn btn-primary" onClick={() => alert('Demo: Đã tải chứng nhận PDF của mũi tiêm này.')}>Tải chứng nhận PDF</button>
        </>
      }
    >
      <div className="shot-detail-grid">
        <div className="shot-detail-row"><span className="lbl">Tên vắc xin / Mũi</span><span className="val">{s.name || '—'}</span></div>
        <div className="shot-detail-row"><span className="lbl">Trạng thái</span><span className="val"><span className="tl-tag done">{s.status || 'Đã tiêm'}</span></span></div>
        <div className="shot-detail-row"><span className="lbl">Ngày tiêm</span><span className="val">{s.date || '—'}</span></div>
        <div className="shot-detail-row"><span className="lbl">Giờ</span><span className="val">{s.time || '—'}</span></div>
        <div className="shot-detail-row"><span className="lbl">Cơ sở</span><span className="val">{s.facility || '—'}</span></div>
        <div className="shot-detail-row"><span className="lbl">Số lô</span><span className="val">{s.lot || '—'}</span></div>
        <div className="shot-detail-row"><span className="lbl">Bác sĩ thực hiện</span><span className="val">{s.doctor || '—'}</span></div>
        <div className="shot-detail-row"><span className="lbl">Ghi chú</span><span className="val">Không có phản ứng bất thường sau tiêm.</span></div>
      </div>
    </VxModal>
  );
}
