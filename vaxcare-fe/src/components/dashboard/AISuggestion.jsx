import { Link } from 'react-router-dom';

// ============ AI SUGGESTION ============
export default function AISuggestion() {
  return (
    <div className="ai-suggest">
      <div className="ai-suggest-head">
        <span className="ai-badge">AI GỢI Ý</span>
        <h3>Đề xuất lịch tiêm phù hợp cho bạn</h3>
      </div>
      <p>
        Dựa trên hồ sơ tiêm chủng và sức tải các cơ sở gần bạn, VaxCare đề xuất tiêm{' '}
        <strong>HPV – Mũi 2</strong> vào khung{' '}
        <strong>08:30–09:00, Thứ Hai 15/09/2026</strong> tại <strong>VaxCare Trung Mỹ Tây</strong>.
        Xác suất còn chỗ cao, thời gian chờ dự kiến thấp.
      </p>
      <Link to="/booking" className="btn btn-primary">Đặt theo đề xuất AI</Link>
    </div>
  );
}
