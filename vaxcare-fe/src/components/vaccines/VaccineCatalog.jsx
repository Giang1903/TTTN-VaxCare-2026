import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getVaccineCategories, searchVaccines } from '../../services/vaccineService';
import { formatCurrency } from '../../utils/format';

const PAGE_SIZE = 10;

// ============ VACCINE CATALOG (search bar + filter toolbar + grid + pagination) ============
export default function VaccineCatalog() {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null); // null = "Tất cả"
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');

  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  // Danh mục dùng cho các nút filter + áp ?category= từ Home
  useEffect(() => {
    getVaccineCategories()
      .then((data) => {
        const cats = data || [];
        setCategories(cats);
        const byId = searchParams.get('categoryId');
        const byName = searchParams.get('category');
        if (byId) {
          const id = Number(byId);
          if (!Number.isNaN(id)) setActiveCategoryId(id);
        } else if (byName) {
          const q = byName.trim().toLowerCase();
          const found = cats.find((c) =>
            String(c.categoryName || '').toLowerCase().includes(q)
          );
          if (found) setActiveCategoryId(found.categoryId);
        }
      })
      .catch(() => setCategories([]));
  }, [searchParams]);

  // Danh sách vắc xin — tải lại mỗi khi đổi danh mục hoặc tìm kiếm
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    searchVaccines({ categoryId: activeCategoryId, keyword: keyword || undefined })
      .then((data) => {
        if (cancelled) return;
        setVaccines(data || []);
        setPage(1);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Không thể tải danh sách vắc xin.');
        setVaccines([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCategoryId, keyword]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setKeyword(keywordInput.trim());
  }

  const totalPages = Math.max(1, Math.ceil(vaccines.length / PAGE_SIZE));
  const pageItems = vaccines.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = vaccines.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, vaccines.length);

  return (
    <>
      {/* ============ SEARCH BAR ============ */}
      <div className="wrap catalog-search-wrap">
        <form className="catalog-search" onSubmit={handleSearchSubmit}>
          <div className="search-input">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo tên vắc xin hoặc bệnh cần phòng..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* ============ VACCINE GRID ============ */}
      <section className="vaccine-preview" id="vaccines" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="catalog-toolbar">
            <div className="filter-row" style={{ marginBottom: 0 }}>
              <span
                className={'filter-pill' + (activeCategoryId === null ? ' active' : '')}
                onClick={() => setActiveCategoryId(null)}
              >
                Tất cả
              </span>
              {categories.map((c) => (
                <span
                  key={c.categoryId}
                  className={'filter-pill' + (activeCategoryId === c.categoryId ? ' active' : '')}
                  onClick={() => setActiveCategoryId(c.categoryId)}
                >
                  {c.categoryName}
                </span>
              ))}
            </div>
            <div className="catalog-count">
              {loading ? (
                'Đang tải...'
              ) : (
                <>
                  Hiển thị <strong>{rangeStart}–{rangeEnd}</strong> trong <strong>{vaccines.length}</strong> vắc xin
                </>
              )}
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          {!loading && !error && vaccines.length === 0 && (
            <p style={{ marginTop: 24 }}>Không tìm thấy vắc xin phù hợp.</p>
          )}

          <div className="vaccine-grid" style={{ marginTop: '30px' }}>
            {pageItems.map((v) => (
              <div className="card vaccine-card" key={v.vaccineId}>
                <div className="vaccine-photo">
                  <img src={v.imageUrl || '/assets/vaccine.jpg'} alt={v.vaccineName} />
                </div>
                <div className="vaccine-body">
                  <h4>{v.vaccineName}</h4>
                  <div className="manu">Nhà sản xuất: {v.manufacturer || 'Đang cập nhật'}</div>
                  <div className="vaccine-meta">
                    <div>
                      <span>Phòng bệnh:</span> {v.targetDisease || 'Đang cập nhật'}
                    </div>
                    <div>
                      <span>Số liều:</span> {v.requiredDoses} liều
                      {v.doseIntervalDays ? `, cách ${v.doseIntervalDays} ngày` : ''}
                    </div>
                  </div>
                  <div className="vaccine-foot">
                    <span className="vaccine-price">{formatCurrency(v.currentPrice)}</span>
                    <Link to={`/vaccines/${v.vaccineId}`} className="btn-link">
                      Xem chi tiết
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn nav-btn"
                aria-label="Trang trước"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={'page-btn' + (page === p ? ' active' : '')}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn nav-btn"
                aria-label="Trang sau"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}