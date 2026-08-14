import { Link } from 'react-router-dom';
// ============ VACCINE PREVIEW ============
export default function VaccinePreview() {
  return (
    <section className="vaccine-preview">
      <div className="wrap">
        <div
          className="section-head"
          style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', maxWidth: 'none'}}
        >
          <div>
            <span className="eyebrow"
              ><span className="dot"></span>Thư viện vắc xin</span
            >
            <h2>Vắc xin phổ biến</h2>
            <p>
              Thông tin chi tiết, minh bạch giúp bạn lựa chọn đúng vắc xin cần
              thiết.
            </p>
          </div>
          <Link to="/vaccines" className="btn-link"
            >Xem tất cả vắc xin
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" /></svg
          ></Link>
        </div>
        <div className="filter-row">
          <span className="filter-pill active">Tất cả</span>
          <span className="filter-pill">Trẻ em</span>
          <span className="filter-pill">Người lớn</span>
          <span className="filter-pill">Cúm</span>
          <span className="filter-pill">Khác</span>
        </div>
        <div className="vaccine-grid">
          <div className="card vaccine-card">
            <div className="vaccine-photo">
              <img
                src="https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=500&auto=format&fit=crop"
                alt="Vắc xin"
              />
            </div>
            <div className="vaccine-body">
              <h4>Vắc xin Cúm mùa</h4>
              <div className="manu">Nhà sản xuất: GSK</div>
              <div className="vaccine-meta">
                <div><span>Phòng bệnh:</span> Cúm mùa A/B</div>
                <div><span>Số liều:</span> 1 liều / năm</div>
              </div>
              <div className="vaccine-foot">
                <span className="vaccine-price">320.000₫</span
                ><a href="vaccine-detail.html" className="btn-link">Xem chi tiết</a>
              </div>
            </div>
          </div>
          <div className="card vaccine-card">
            <div className="vaccine-photo">
              <img
                src="https://images.unsplash.com/photo-1632053001990-fbaa9c96c3fa?q=80&w=500&auto=format&fit=crop"
                alt="Vắc xin"
              />
            </div>
            <div className="vaccine-body">
              <h4>Vắc xin 6 trong 1</h4>
              <div className="manu">Nhà sản xuất: Sanofi</div>
              <div className="vaccine-meta">
                <div><span>Phòng bệnh:</span> Bạch hầu, ho gà...</div>
                <div><span>Số liều:</span> 3 liều, cách 4 tuần</div>
              </div>
              <div className="vaccine-foot">
                <span className="vaccine-price">1.050.000₫</span
                ><a href="vaccine-detail.html" className="btn-link">Xem chi tiết</a>
              </div>
            </div>
          </div>
          <div className="card vaccine-card">
            <div className="vaccine-photo">
              <img
                src="https://images.unsplash.com/photo-1605289982774-9a6fef564df8?q=80&w=500&auto=format&fit=crop"
                alt="Vắc xin"
              />
            </div>
            <div className="vaccine-body">
              <h4>Vắc xin HPV</h4>
              <div className="manu">Nhà sản xuất: MSD</div>
              <div className="vaccine-meta">
                <div><span>Phòng bệnh:</span> Ung thư cổ tử cung</div>
                <div><span>Số liều:</span> 2 liều, cách 6 tháng</div>
              </div>
              <div className="vaccine-foot">
                <span className="vaccine-price">1.790.000₫</span
                ><a href="vaccine-detail.html" className="btn-link">Xem chi tiết</a>
              </div>
            </div>
          </div>
          <div className="card vaccine-card">
            <div className="vaccine-photo">
              <img
                src="https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=500&auto=format&fit=crop"
                alt="Vắc xin"
              />
            </div>
            <div className="vaccine-body">
              <h4>Vắc xin Viêm gan B</h4>
              <div className="manu">Nhà sản xuất: LG Chem</div>
              <div className="vaccine-meta">
                <div><span>Phòng bệnh:</span> Viêm gan siêu vi B</div>
                <div><span>Số liều:</span> 3 liều, cách 1 tháng</div>
              </div>
              <div className="vaccine-foot">
                <span className="vaccine-price">280.000₫</span
                ><a href="vaccine-detail.html" className="btn-link">Xem chi tiết</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
