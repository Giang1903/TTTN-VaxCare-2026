import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';

function doseScheduleLabel(vaccine) {
  const { requiredDoses, doseIntervalDays } = vaccine;
  if (!requiredDoses || requiredDoses <= 1) return '1 liều duy nhất';
  if (doseIntervalDays) return `${requiredDoses} liều, cách nhau ${doseIntervalDays} ngày`;
  return `${requiredDoses} liều theo phác đồ`;
}

// ============ DETAIL TOP (ảnh + thông tin) ============
export default function DetailTop({ vaccine }) {
  const {
    vaccineName,
    manufacturer,
    targetDisease,
    description,
    imageUrl,
    averageRating,
    totalBookings,
    currentPrice,
  } = vaccine;

  return (
    <section className="detail-top">
      <div className="wrap">
        <div className="detail-layout">
          <div className="detail-gallery">
            <div className="detail-main-photo">
              <img src={imageUrl || '/assets/vaccine.jpg'} alt={vaccineName} />
            </div>
          </div>

          <div className="detail-info">
            <div className="manu-row">
              <span className="manu-name">Nhà sản xuất: {manufacturer || 'Đang cập nhật'}</span>
            </div>
            <h1>{vaccineName}</h1>
            <div className="detail-rate">
              <span className="stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24">
                    <path d="M12 2l3 6.5 7 1-5.2 4.9L18 21l-6-3.4L6 21l1.2-6.6L2 9.5l7-1L12 2Z" />
                  </svg>
                ))}
              </span>
              {Number(averageRating || 0).toFixed(1)} · Đã đặt lịch {totalBookings || 0}+ lần tại VaxCare
            </div>
            <p className="detail-desc">
              {description || 'Thông tin mô tả chi tiết đang được cập nhật.'}
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
                  <div className="dmi-value">{targetDisease || 'Đang cập nhật'}</div>
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
                  <div className="dmi-value">{doseScheduleLabel(vaccine)}</div>
                </div>
              </div>
              <div className="detail-meta-item">
                <span className="dmi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3 6.5 7 1-5.2 4.9L18 21l-6-3.4L6 21l1.2-6.6L2 9.5l7-1L12 2Z" />
                  </svg>
                </span>
                <div>
                  <div className="dmi-label">Đánh giá trung bình</div>
                  <div className="dmi-value">{Number(averageRating || 0).toFixed(1)} / 5</div>
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
                  <div className="dmi-label">Lượt đặt lịch</div>
                  <div className="dmi-value">{totalBookings || 0}</div>
                </div>
              </div>
            </div>

            <div className="detail-price-box">
              <div>
                <div className="dp-label">Giá mỗi liều</div>
                <div className="dp-value">
                  {formatCurrency(currentPrice)} {currentPrice != null && <span>/ liều</span>}
                </div>
              </div>
              <div className="detail-cta-row">
                <Link to="/booking" className="btn btn-primary">
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
                Đồng bộ hồ sơ tại mọi cơ sở VaxCare
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
