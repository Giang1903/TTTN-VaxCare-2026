import { useState } from 'react';
import { Link } from 'react-router-dom';

const PHOTOS = [
  'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1632053001990-fbaa9c96c3fa?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605289982774-9a6fef564df8?q=80&w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=900&auto=format&fit=crop',
];

// ============ DETAIL TOP (gallery + info) ============
export default function DetailTop() {
  const [mainPhoto, setMainPhoto] = useState(PHOTOS[0]);

  return (
    <section className="detail-top">
      <div className="wrap">
        <div className="detail-layout">
          <div className="detail-gallery">
            <div className="detail-main-photo">
              <img src={mainPhoto} alt="Vắc xin Cúm mùa" />
            </div>
            <div className="detail-thumbs">
              {PHOTOS.map((src, i) => (
                <div
                  key={src}
                  className={'detail-thumb' + (mainPhoto === src ? ' active' : '')}
                  onClick={() => setMainPhoto(src)}
                >
                  <img src={src.replace('w=900', 'w=200')} alt={`Ảnh ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="detail-info">
            <div className="manu-row">
              <span className="manu-name">Nhà sản xuất: GSK — Bỉ</span>
            </div>
            <h1>Vắc xin Cúm mùa (Influvac Tetra)</h1>
            <div className="detail-rate">
              <span className="stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24">
                    <path d="M12 2l3 6.5 7 1-5.2 4.9L18 21l-6-3.4L6 21l1.2-6.6L2 9.5l7-1L12 2Z" />
                  </svg>
                ))}
              </span>
              4.9 (1.240 đánh giá) · Đã tiêm 8.500+ liều tại VaxCare
            </div>
            <p className="detail-desc">
              Vắc xin cúm tứ giá thế hệ mới, phòng ngừa 4 chủng virus cúm mùa phổ biến (2 chủng A, 2 chủng B). Phù
              hợp tiêm nhắc lại hằng năm cho cả trẻ em từ 6 tháng tuổi và người lớn.
            </p>

            <div className="detail-meta-grid">
              <div className="detail-meta-item">
                <span className="dmi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
                  </svg>
                </span>
                <div>
                  <div className="dmi-label">Phòng bệnh</div>
                  <div className="dmi-value">Cúm mùa A/B</div>
                </div>
              </div>
              <div className="detail-meta-item">
                <span className="dmi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="8" width="18" height="9" rx="2" />
                    <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </span>
                <div>
                  <div className="dmi-label">Số liều</div>
                  <div className="dmi-value">1 liều / năm</div>
                </div>
              </div>
              <div className="detail-meta-item">
                <span className="dmi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <div>
                  <div className="dmi-label">Đối tượng</div>
                  <div className="dmi-value">Từ 6 tháng tuổi trở lên</div>
                </div>
              </div>
              <div className="detail-meta-item">
                <span className="dmi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div>
                  <div className="dmi-label">Xuất xứ</div>
                  <div className="dmi-value">Bỉ (GSK)</div>
                </div>
              </div>
            </div>

            <div className="detail-price-box">
              <div>
                <div className="dp-label">Giá mỗi liều</div>
                <div className="dp-value">
                  320.000₫ <span>/ liều</span>
                </div>
              </div>
              <div className="detail-cta-row">
                <Link to="/login" className="btn btn-primary">
                  Đặt lịch tiêm ngay
                </Link>
                <Link to="/support" className="btn btn-ghost">
                  Tư vấn thêm
                </Link>
              </div>
            </div>

            <ul className="detail-trust">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Bảo quản đạt chuẩn GSP
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Có mặt tại 120+ cơ sở
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Nhắc lịch tiêm nhắc lại tự động
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
