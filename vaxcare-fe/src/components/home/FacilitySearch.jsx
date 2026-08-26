import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFacilities } from '../../services/facilityService';
import { formatTime } from '../../utils/format';

function openGoogleMaps(address, name) {
  const q = [name, address].filter(Boolean).join(', ');
  if (!q.trim()) return;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ============ FACILITY SEARCH (trang chủ) ============
export default function FacilitySearch() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFacilities()
      .then((data) => {
        if (cancelled) return;
        setFacilities((data || []).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setFacilities([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="facility" id="facilities">
      <div className="wrap">
        <div
          className="section-head"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            maxWidth: 'none',
          }}
        >
          <div>
            <span className="eyebrow">
              <span className="dot"></span>Mạng lưới cơ sở
            </span>
            <h2>Tìm cơ sở tiêm chủng</h2>
            <p>Lựa chọn cơ sở gần bạn với thông tin lịch hoạt động rõ ràng.</p>
          </div>
          <Link to="/facilities" className="btn-link">
            Xem tất cả cơ sở
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        {!loading && facilities.length === 0 && (
          <p style={{ marginTop: 24 }}>Chưa có dữ liệu cơ sở tiêm chủng.</p>
        )}

        <div className="fac-grid">
          {facilities.map((f) => (
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
      </div>
    </section>
  );
}