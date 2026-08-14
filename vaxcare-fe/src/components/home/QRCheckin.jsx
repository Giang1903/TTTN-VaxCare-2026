// ============ QR CHECK-IN FLOW ============
export default function QRCheckin() {
  return (
    <section className="qr-flow">
      <div className="wrap">
        <div
          className="section-head center"
          style={{marginLeft: 'auto', marginRight: 'auto'}}
        >
          <span
            className="eyebrow"
            style={{marginLeft: 'auto', marginRight: 'auto', display: 'table'}}
            ><span className="dot"></span>Quy trình</span
          >
          <h2>QR Check-in nhanh chóng</h2>
          <p>Quy trình liền mạch từ đặt lịch đến cập nhật hồ sơ sau tiêm.</p>
        </div>
        <div className="flow-row">
          <div className="flow-step">
            <div className="flow-icon">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M8 3v4M16 3v4M3 10h18" />
              </svg>
            </div>
            <span>Đặt lịch</span>
          </div>
          <svg
            className="flow-arrow"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <div className="flow-step">
            <div className="flow-icon">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="2" y="6" width="20" height="13" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
            <span>Thanh toán</span>
          </div>
          <svg
            className="flow-arrow"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <div className="flow-step">
            <div className="flow-icon">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M9 9h1v1H9zM14 9h1v1h-1zM9 14h1v1H9z" />
              </svg>
            </div>
            <span>Nhận QR</span>
          </div>
          <svg
            className="flow-arrow"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <div className="flow-step">
            <div className="flow-icon">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <span>Check-in</span>
          </div>
          <svg
            className="flow-arrow"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <div className="flow-step">
            <div className="flow-icon">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M19 14V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v8M5 14l-2 6h18l-2-6M5 14h14"
                />
              </svg>
            </div>
            <span>Tiêm chủng</span>
          </div>
          <svg
            className="flow-arrow"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <div className="flow-step">
            <div className="flow-icon">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3a9 9 0 1 0 9 9" />
                <path d="M12 3v9h9" />
              </svg>
            </div>
            <span>Cập nhật hồ sơ</span>
          </div>
        </div>
      </div>
    </section>
  );
}
