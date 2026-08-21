import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchVaccines } from '../../services/vaccineService';
import { formatCurrency } from '../../utils/format';

// ============ VACCINE PREVIEW (trang chủ) ============
export default function VaccinePreview() {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    searchVaccines()
      .then((data) => {
        if (cancelled) return;
        setVaccines((data || []).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setVaccines([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

        {!loading && vaccines.length === 0 && (
          <p style={{ marginTop: 24 }}>Chưa có dữ liệu vắc xin.</p>
        )}

        <div className="vaccine-grid">
          {vaccines.map((v) => (
            <div className="card vaccine-card" key={v.vaccineId}>
              <div className="vaccine-photo">
                <img src={v.imageUrl || '/assets/vaccine.jpg'} alt={v.vaccineName} />
              </div>
              <div className="vaccine-body">
                <h4>{v.vaccineName}</h4>
                <div className="manu">Nhà sản xuất: {v.manufacturer || 'Đang cập nhật'}</div>
                <div className="vaccine-meta">
                  <div><span>Phòng bệnh:</span> {v.targetDisease || 'Đang cập nhật'}</div>
                  <div>
                    <span>Số liều:</span> {v.requiredDoses} liều
                    {v.doseIntervalDays ? `, cách ${v.doseIntervalDays} ngày` : ''}
                  </div>
                </div>
                <div className="vaccine-foot">
                  <span className="vaccine-price">{formatCurrency(v.currentPrice)}</span>
                  <Link to={`/vaccines/${v.vaccineId}`} className="btn-link">Xem chi tiết</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
