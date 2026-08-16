import { Link } from 'react-router-dom';

const RELATED = [
  {
    image: 'https://images.unsplash.com/photo-1632053001990-fbaa9c96c3fa?q=80&w=500&auto=format&fit=crop',
    alt: 'Vắc xin 6 trong 1',
    name: 'Vắc xin 6 trong 1',
    manufacturer: 'Sanofi',
    disease: 'Bạch hầu, ho gà...',
    doses: '3 liều, cách 4 tuần',
    price: '1.050.000₫',
  },
  {
    image: 'https://images.unsplash.com/photo-1605289982774-9a6fef564df8?q=80&w=500&auto=format&fit=crop',
    alt: 'Vắc xin HPV',
    name: 'Vắc xin HPV',
    manufacturer: 'MSD',
    disease: 'Ung thư cổ tử cung',
    doses: '2 liều, cách 6 tháng',
    price: '1.790.000₫',
  },
  {
    image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=500&auto=format&fit=crop',
    alt: 'Vắc xin Phế cầu',
    name: 'Vắc xin Phế cầu',
    manufacturer: 'Pfizer',
    disease: 'Viêm phổi, viêm màng não',
    doses: '4 liều theo phác đồ',
    price: '1.150.000₫',
  },
  {
    image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=500&auto=format&fit=crop',
    alt: 'Vắc xin Viêm gan B',
    name: 'Vắc xin Viêm gan B',
    manufacturer: 'LG Chem',
    disease: 'Viêm gan siêu vi B',
    doses: '3 liều, cách 1 tháng',
    price: '280.000₫',
  },
];

// ============ RELATED VACCINES ============
export default function RelatedVaccines() {
  return (
    <section className="related-vaccines">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">
            <span className="dot"></span>Có thể bạn quan tâm
          </span>
          <h2>Vắc xin liên quan</h2>
          <p>Các vắc xin khác thường được tiêm kèm hoặc trong cùng giai đoạn.</p>
        </div>
        <div className="vaccine-grid">
          {RELATED.map((v) => (
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
