import { profile } from '../../mockdata/record';

// ============ CERTIFICATE SIDEBAR (QR + tips) ============
export default function CertificateSidebar() {
  return (
    <div className="cert-sticky">
      <div className="cert-card">
        <div className="cert-card-head">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" /><path d="m9 12 2 2 4-4" /></svg>
          Chứng nhận điện tử
        </div>
        <div className="cert-card-body">
          <div className="qr-frame">
            <span className="qr-corner tl"></span>
            <span className="qr-corner tr"></span>
            <span className="qr-corner bl"></span>
            <span className="qr-corner br"></span>
            {/* Decorative QR-like pattern */}
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="#fff" />
              <g fill="#24408c">
                <rect x="8" y="8" width="28" height="28" rx="2" />
                <rect x="14" y="14" width="16" height="16" fill="#fff" />
                <rect x="18" y="18" width="8" height="8" />
                <rect x="64" y="8" width="28" height="28" rx="2" />
                <rect x="70" y="14" width="16" height="16" fill="#fff" />
                <rect x="74" y="18" width="8" height="8" />
                <rect x="8" y="64" width="28" height="28" rx="2" />
                <rect x="14" y="70" width="16" height="16" fill="#fff" />
                <rect x="18" y="74" width="8" height="8" />
                <rect x="42" y="8" width="6" height="6" /><rect x="52" y="8" width="6" height="6" />
                <rect x="42" y="18" width="6" height="6" /><rect x="52" y="22" width="6" height="6" />
                <rect x="8" y="42" width="6" height="6" /><rect x="18" y="42" width="6" height="6" />
                <rect x="8" y="52" width="6" height="6" /><rect x="22" y="52" width="6" height="6" />
                <rect x="42" y="42" width="6" height="6" /><rect x="52" y="42" width="6" height="6" />
                <rect x="42" y="52" width="6" height="6" /><rect x="56" y="52" width="6" height="6" />
                <rect x="64" y="42" width="6" height="6" /><rect x="74" y="42" width="6" height="6" />
                <rect x="86" y="42" width="6" height="6" /><rect x="64" y="52" width="6" height="6" />
                <rect x="78" y="52" width="6" height="6" /><rect x="86" y="56" width="6" height="6" />
                <rect x="42" y="64" width="6" height="6" /><rect x="52" y="64" width="6" height="6" />
                <rect x="42" y="74" width="6" height="6" /><rect x="56" y="78" width="6" height="6" />
                <rect x="42" y="86" width="6" height="6" /><rect x="64" y="64" width="6" height="6" />
                <rect x="74" y="64" width="6" height="6" /><rect x="86" y="64" width="6" height="6" />
                <rect x="64" y="74" width="6" height="6" /><rect x="78" y="74" width="6" height="6" />
                <rect x="64" y="86" width="6" height="6" /><rect x="74" y="86" width="6" height="6" />
                <rect x="86" y="78" width="6" height="6" /><rect x="86" y="86" width="6" height="6" />
              </g>
            </svg>
          </div>
          <div className="cert-id">Mã hồ sơ: <strong>{profile.recordCode}</strong></div>
          <div className="cert-valid">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>
            Hợp lệ · Cập nhật {profile.updatedAt}
          </div>
          <div className="cert-btns">
            <button type="button" className="btn btn-primary" onClick={() => alert('Demo: Phóng to QR để quét.')}>Phóng to QR</button>
            <button type="button" className="btn btn-ghost" style={{ fontSize: '13px' }} onClick={() => alert('Demo: Tải ảnh QR.')}>Tải ảnh QR</button>
          </div>
        </div>
      </div>

      <div className="side-info-card">
        <h4>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          Lưu ý khi sử dụng hồ sơ
        </h4>
        <ul>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
            Mang QR hoặc CCCD khi đến tiêm
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
            Có thể xem hồ sơ chi tiết và chi tiết từng mũi tiêm bất kỳ lúc nào
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
            Dữ liệu được mã hóa và bảo mật
          </li>
        </ul>
      </div>
    </div>
  );
}
