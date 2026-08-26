import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFacilities } from '../../services/facilityService';
import { deriveAreaFromAddress, formatTime } from '../../utils/format';

function openGoogleMaps(address, name) {
  const q = [name, address].filter(Boolean).join(', ');
  if (!q.trim()) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

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
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [area, setArea] = useState('all');

  useEffect(() => {
    let cancelled = false;
    getFacilities()
      .then((data) => {
        if (cancelled) return;
        setFacilities(data || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Không thể tải danh sách cơ sở tiêm chủng.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const areasPresent = useMemo(() => {
    const set = new Set(facilities.map((f) => deriveAreaFromAddress(f.address)));
    return AREA_SELECT_OPTIONS.filter((a) => a === 'all' || set.has(a));
  }, [facilities]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return facilities.filter((f) => {
      const facilityArea = deriveAreaFromAddress(f.address);
      const matchesArea = area === 'all' || facilityArea === area;
      const haystack = `${f.facilityName} ${f.address}`.toLowerCase();
      const matchesText = q === '' || haystack.includes(q);
      return matchesArea && matchesText;
    });
  }, [facilities, query, area]);

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
          <select value={area} onChange={(e) => setArea(e.target.value)}>
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
              {areasPresent.map((a) => (
                <span
                  key={a}
                  className={'filter-pill' + (area === a ? ' active' : '')}
                  onClick={() => setArea(a)}
                >
                  {a === 'all' ? 'Tất cả' : a}
                </span>
              ))}
            </div>
            <div className="catalog-count">
              {loading ? (
                'Đang tải...'
              ) : (
                <>
                  Hiển thị <strong>{filtered.length}</strong> trong <strong>{facilities.length}</strong> cơ sở
                </>
              )}
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="fac-grid" style={{ marginTop: '30px' }}>
            {filtered.map((f) => (
              <div
                className="fac-card fac-card-clickable"
                key={f.facilityId}
                role="link"
                tabIndex={0}
                title="Mở vị trí trên Google Maps"
                onClick={() => openGoogleMaps(f.address, f.facilityName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openGoogleMaps(f.address, f.facilityName);
                  }
                }}
              >
                <div className="fac-media">
                  <span className="fac-area-tag">{deriveAreaFromAddress(f.address)}</span>
                  <span className="fac-cap-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Tối đa {f.capacityPerSlot}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <div className="fac-body">
                  <h3>{f.facilityName}</h3>
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
                    {formatTime(f.openingTime)} – {formatTime(f.closingTime)}, T2–CN
                  </div>
                  <div className="fac-meta">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <a
                      href={`tel:${(f.phone || '').replace(/[^0-9+]/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {f.phone}
                    </a>
                  </div>
                  <div className="fac-foot">
                    <span className="fac-slots">Sức chứa {f.capacityPerSlot}/khung giờ</span>
                    <Link
                      to="/booking"
                      className="btn-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Đặt lịch →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!loading && !error && filtered.length === 0 && (
            <p className="fac-empty show">
              Không tìm thấy cơ sở phù hợp. Vui lòng thử từ khóa hoặc khu vực khác.
            </p>
          )}
        </div>
      </section>
    </>
  );
}