import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { facilities } from '../../mockdata/facilities';

const AREAS = ['all', 'Quận 1', 'Thủ Đức', 'Quận 7', 'Gò Vấp', 'Tân Phú', 'Khác'];
const AREA_LABELS = {
  all: 'Tất cả',
  'Quận 1': 'Quận 1',
  'Thủ Đức': 'Thủ Đức',
  'Quận 7': 'Quận 7',
  'Gò Vấp': 'Gò Vấp',
  'Tân Phú': 'Tân Phú',
  Khác: 'Khu vực khác',
};
const AREA_SELECT_OPTIONS = [
  'all',
  'Quận 1',
  'Quận 7',
  'Quận 12',
  'Thủ Đức',
  'Gò Vấp',
  'Tân Phú',
  'Bình Tân',
  'Phú Nhuận',
  'Hóc Môn',
  'Củ Chi',
];

// ============ FACILITY FINDER (search bar + filter + grid) ============
export default function FacilityFinder() {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return facilities.filter((f) => {
      const matchesArea = area === 'all' || f.area === area;
      const haystack = `${f.name} ${f.address}`.toLowerCase();
      const matchesText = q === '' || haystack.includes(q);
      return matchesArea && matchesText;
    });
  }, [query, area]);

  return (
    <>
      {/* ============ SEARCH BAR ============ */}
      <div className="wrap catalog-search-wrap">
        <div className="catalog-search">
          <div className="search-input">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên cơ sở hoặc địa chỉ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select value={area === 'Khác' ? 'all' : area} onChange={(e) => setArea(e.target.value)}>
            {AREA_SELECT_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a === 'all' ? 'Tất cả khu vực' : a}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="button">
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* ============ FACILITY GRID ============ */}
      <section className="facility" id="facilities-all" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="catalog-toolbar">
            <div className="filter-row" style={{ marginBottom: 0 }}>
              {AREAS.map((a) => (
                <span
                  key={a}
                  className={'filter-pill' + (area === a ? ' active' : '')}
                  onClick={() => setArea(a)}
                >
                  {AREA_LABELS[a]}
                </span>
              ))}
            </div>
            <div className="catalog-count">
              Hiển thị <strong>{filtered.length}</strong> trong <strong>{facilities.length}</strong> cơ sở
            </div>
          </div>

          <div className="fac-grid" style={{ marginTop: '30px' }}>
            {filtered.map((f) => (
              <div className="fac-card" key={f.name}>
                <div className="fac-media">
                  <span className="fac-area-tag">{f.areaTag}</span>
                  <span className="fac-cap-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    {f.capacity}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div className="fac-body">
                  <h3>{f.name}</h3>
                  <div className="fac-meta">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                    </svg>
                    {f.address}
                  </div>
                  <div className="fac-meta">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                    {f.hours}
                  </div>
                  <div className="fac-meta">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <a href={f.phoneHref}>{f.phone}</a>
                  </div>
                  <div className="fac-foot">
                    <span className="fac-slots">{f.slots}</span>
                    <Link to="/login" className="btn-link">
                      Đặt lịch →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className={'fac-empty' + (filtered.length === 0 ? ' show' : '')}>
            Không tìm thấy cơ sở phù hợp. Vui lòng thử từ khóa hoặc khu vực khác.
          </p>
        </div>
      </section>
    </>
  );
}
