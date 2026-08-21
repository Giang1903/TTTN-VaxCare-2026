import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchVaccines } from '../../services/vaccineService';
import { formatCurrency } from '../../utils/format';

// ============ RELATED VACCINES (cùng danh mục) ============
export default function RelatedVaccines({ categoryId, excludeId }) {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!categoryId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRelated([]);
      return;
    }
    let cancelled = false;
    searchVaccines({ categoryId })
      .then((data) => {
        if (cancelled) return;
        setRelated((data || []).filter((v) => v.vaccineId !== excludeId).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, excludeId]);

  if (related.length === 0) return null;

  return (
    <section className="related-vaccines">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot"></span>Có thể bạn quan tâm
          </span>
          <h2>Vắc xin liên quan</h2>
          <p>Các vắc xin khác trong cùng danh mục.</p>
        </div>
        <div className="vaccine-grid">
          {related.map((v) => (
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
