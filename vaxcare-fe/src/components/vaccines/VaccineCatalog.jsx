import { useState } from 'react';
import { Link } from 'react-router-dom';
import { vaccines } from '../../mockdata/vaccines';

const FILTERS = ['Tất cả', 'Trẻ em', 'Người lớn', 'Phụ nữ mang thai', 'Cúm', 'Khác'];

// ============ VACCINE CATALOG (search bar + filter toolbar + grid + pagination) ============
export default function VaccineCatalog() {
  const [activeFilter, setActiveFilter] = useState('Tất cả');

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
            <input type="text" placeholder="Tìm theo tên vắc xin hoặc bệnh cần phòng..." />
          </div>
          <select defaultValue="Tất cả độ tuổi">
            <option>Tất cả độ tuổi</option>
            <option>Trẻ em (0–12 tuổi)</option>
            <option>Thanh thiếu niên</option>
            <option>Người lớn</option>
            <option>Phụ nữ mang thai</option>
          </select>
          <select defaultValue="Sắp xếp: Phổ biến nhất">
            <option>Sắp xếp: Phổ biến nhất</option>
            <option>Giá: Thấp đến cao</option>
            <option>Giá: Cao đến thấp</option>
            <option>Tên A–Z</option>
          </select>
          <button className="btn btn-primary" type="button">
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* ============ VACCINE GRID ============ */}
      <section className="vaccine-preview" id="vaccines" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="catalog-toolbar">
            <div className="filter-row" style={{ marginBottom: 0 }}>
              {FILTERS.map((f) => (
                <span
                  key={f}
                  className={'filter-pill' + (activeFilter === f ? ' active' : '')}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </span>
              ))}
            </div>
            <div className="catalog-count">
              Hiển thị <strong>1–10</strong> trong <strong>32</strong> vắc xin
            </div>
          </div>

          <div className="vaccine-grid" style={{ marginTop: '30px' }}>
            {vaccines.map((v) => (
              <div className="card vaccine-card" key={v.name}>
                <div className="vaccine-photo">
                  <img src={v.image} alt={v.alt} />
                </div>
                <div className="vaccine-body">
                  <h4>{v.name}</h4>
                  <div className="manu">Nhà sản xuất: {v.manufacturer}</div>
                  <div className="vaccine-meta">
                    <div>
                      <span>Phòng bệnh:</span> {v.disease}
                    </div>
                    <div>
                      <span>Số liều:</span> {v.doses}
                    </div>
                  </div>
                  <div className="vaccine-foot">
                    <span className="vaccine-price">{v.price}</span>
                    <Link to="/vaccines/1" className="btn-link">
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

          <div className="pagination">
            <button className="page-btn nav-btn" aria-label="Trang trước">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <span className="page-dots">…</span>
            <button className="page-btn">4</button>
            <button className="page-btn nav-btn" aria-label="Trang sau">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
