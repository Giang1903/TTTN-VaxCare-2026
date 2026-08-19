export default function Topbar({ title, subtitle, searchPlaceholder, onSearch, showSearch = true }) {
  return (
    <header className="topbar">
      <div className="tb-title">
        <h1>{title}</h1>
        {subtitle && <div className="date">{subtitle}</div>}
      </div>
      {showSearch && (
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder || 'Tìm kiếm…'}
            onChange={(e) => onSearch?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch?.(e.target.value);
            }}
          />
        </div>
      )}
      <button className="icon-btn" aria-label="Thông báo" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        <span className="dot" />
      </button>
      <div className="tb-profile">
        <div className="av">QT</div>
        <div>
          <div className="n">Quản trị viên</div>
          <div className="s">admin@vaxcare.vn</div>
        </div>
      </div>
    </header>
  );
}
