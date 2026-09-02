import { formatCurrency } from '../../utils/format';

// ============ BOOKING SUMMARY SIDEBAR ============
export default function BookingSummary({ vaccine, facility, date, slot, step }) {
  if (!vaccine) {
    return (
      <aside className="summary-card">
        <div className="summary-card-head">Tóm tắt đặt lịch</div>
        <div className="summary-body" id="summaryBody">
          <div className="sum-empty">Chọn vắc xin để bắt đầu</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="summary-card">
      <div className="summary-card-head">Tóm tắt đặt lịch</div>
      <div className="summary-body" id="summaryBody">
        <div className="sum-row">
          <span className="lbl">Vắc xin</span>
          <span className="val">{vaccine.name}</span>
        </div>
        {facility && (
          <div className="sum-row">
            <span className="lbl">Cơ sở</span>
            <span className="val">{facility.name}</span>
          </div>
        )}
        {date && (
          <div className="sum-row">
            <span className="lbl">Ngày</span>
            <span className="val">{date.label}</span>
          </div>
        )}
        {slot && (
          <div className="sum-row">
            <span className="lbl">Giờ</span>
            <span className="val">{slot}</span>
          </div>
        )}
        <div className="sum-total">
          <span className="lbl">Tạm tính</span>
          <span className="val">{formatCurrency(vaccine.price)}</span>
        </div>
        {step >= 3 && facility && (
          <div className="ai-hint">
            <strong> Mọi thắc mắc liên hệ hỗ trợ tới quản trị viên.</strong>
          </div>
        )}
      </div>
    </aside>
  );
}