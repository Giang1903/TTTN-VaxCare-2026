export default function StaffTopbar({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  showSearch = true,
}) {
  return (
    <header className="staff-topbar">
      <div className="tb-title">
        <h1>{title}</h1>
        {subtitle && <div className="date">{subtitle}</div>}
      </div>

      {showSearch && (
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
          <input
            type="search"
            placeholder={searchPlaceholder || 'Tìm kiếm...'}
            value={searchValue || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      )}

      <button type="button" className="icon-btn" aria-label="Thông báo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span className="dot" />
      </button>

      <div className="tb-profile">
        <div className="av">TM</div>
        <div>
          <div className="n">BS. Trần Minh</div>
          <div className="s">Nhân viên y tế</div>
        </div>
      </div>
    </header>
  );
}
