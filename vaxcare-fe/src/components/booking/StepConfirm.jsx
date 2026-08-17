import { Link } from 'react-router-dom';

// ============ STEP 4: CONFIRM + SUCCESS ============
export default function StepConfirm({ active, agree, onAgreeChange, onBack, onConfirm, success, bookingCode }) {
  return (
    <div className={`book-step${active ? ' active' : ''}`} data-step="4">
      <div className="book-panel-head">Xác nhận thông tin</div>
      <div className="book-panel-body">
        <div id="confirmView" style={{ display: success ? 'none' : undefined }}>
          <p style={{ fontSize: '14px', color: 'var(--gray-700)', lineHeight: 1.7, marginBottom: '16px' }}>
            Kiểm tra lại thông tin trước khi xác nhận đặt lịch. Bạn sẽ nhận mã QR check-in qua hệ thống.
          </p>
          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--gray-700)', marginBottom: '18px', cursor: 'pointer' }}>
            <input type="checkbox" id="agreeBox" style={{ marginTop: '3px' }} checked={agree} onChange={(e) => onAgreeChange(e.target.checked)} />
            <span>Tôi xác nhận thông tin chính xác và đồng ý với điều khoản đặt lịch của VaxCare.</span>
          </label>
          <div className="book-nav">
            <button type="button" className="btn btn-ghost" id="back3" onClick={onBack}>← Quay lại</button>
            <button type="button" className="btn btn-primary" id="confirmBtn" disabled={!agree} onClick={onConfirm}>Xác nhận đặt lịch</button>
          </div>
        </div>

        <div id="successView" style={{ display: success ? 'block' : 'none' }}>
          <div className="success-box">
            <div className="check">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>
            </div>
            <h2>Đặt lịch thành công!</h2>
            <p>Lịch hẹn đã được ghi nhận. Mang theo mã QR khi đến tiêm.</p>
            <div className="qr-success">
              <svg viewBox="0 0 100 100" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="#fff" />
                <g fill="#24408c">
                  <rect x="8" y="8" width="28" height="28" rx="2" /><rect x="14" y="14" width="16" height="16" fill="#fff" /><rect x="18" y="18" width="8" height="8" />
                  <rect x="64" y="8" width="28" height="28" rx="2" /><rect x="70" y="14" width="16" height="16" fill="#fff" /><rect x="74" y="18" width="8" height="8" />
                  <rect x="8" y="64" width="28" height="28" rx="2" /><rect x="14" y="70" width="16" height="16" fill="#fff" /><rect x="18" y="74" width="8" height="8" />
                  <rect x="42" y="42" width="6" height="6" /><rect x="52" y="42" width="6" height="6" /><rect x="42" y="52" width="6" height="6" /><rect x="56" y="52" width="6" height="6" />
                  <rect x="64" y="64" width="6" height="6" /><rect x="74" y="64" width="6" height="6" /><rect x="64" y="74" width="6" height="6" /><rect x="86" y="86" width="6" height="6" />
                </g>
              </svg>
            </div>
            <div className="code-tag" id="bookingCode">{bookingCode || 'VX-2026-XXXX-XXXX'}</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/appointments" className="btn btn-primary btn-sm">Xem lịch của tôi</Link>
              <Link to="/dashboard" className="btn btn-ghost" style={{ fontSize: '13px', padding: '8px 14px' }}>Về tổng quan</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
