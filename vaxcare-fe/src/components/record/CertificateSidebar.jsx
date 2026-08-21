// ============ CERTIFICATE SIDEBAR ============
export default function CertificateSidebar({ profile, recordCode, updatedAt }) {
  const code = recordCode || (profile?.userId != null ? `VC-${profile.userId}` : '—');
  const updated = updatedAt || '—';

  return (
    <div className="record-sidebar">
      <div className="cert-card">
        <h3>Chứng nhận điện tử</h3>
        <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '12px' }}>
          Quét mã QR để xác minh hồ sơ tiêm chủng.
        </p>
        <div className="cert-qr" aria-hidden>
          <svg viewBox="0 0 100 100" width="140" height="140" xmlns="http://www.w3.org/2000/svg">
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
              <rect x="40" y="40" width="8" height="8" />
              <rect x="52" y="40" width="8" height="8" />
              <rect x="40" y="52" width="8" height="8" />
              <rect x="64" y="52" width="8" height="8" />
              <rect x="76" y="64" width="8" height="8" />
              <rect x="52" y="76" width="8" height="8" />
              <rect x="64" y="76" width="8" height="8" />
              <rect x="76" y="76" width="8" height="8" />
            </g>
          </svg>
        </div>
        <div className="cert-id">
          Mã hồ sơ: <strong>{code}</strong>
        </div>
        <div className="cert-valid">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4 12 14.01l-3-3" />
          </svg>
          Hợp lệ · Cập nhật {updated}
        </div>
        <div className="cert-btns">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => alert(`Mã hồ sơ: ${code}`)}
          >
            Phóng to QR
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ fontSize: '13px' }}
            onClick={() => alert('Tính năng tải ảnh QR sẽ sớm có.')}
          >
            Tải ảnh QR
          </button>
        </div>
      </div>

      <div className="side-info-card">
        <h4>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          Lưu ý khi sử dụng hồ sơ
        </h4>
        <ul>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Mang QR hoặc CCCD khi đến tiêm
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Có thể xem hồ sơ chi tiết và chi tiết từng mũi tiêm bất kỳ lúc nào
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Dữ liệu được mã hóa và bảo mật
          </li>
        </ul>
      </div>
    </div>
  );
}