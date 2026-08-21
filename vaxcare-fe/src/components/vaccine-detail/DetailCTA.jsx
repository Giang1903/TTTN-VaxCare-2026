// ============ CTA (Vaccine Detail) ============
export default function DetailCTA({ vaccineName }) {
  return (
    <section className="cta">
      <div className="wrap">
        <div className="cta-box">
          <div className="cta-content">
            <h3>Sẵn sàng tiêm {vaccineName || 'vắc xin này'}?</h3>
            <p>Đặt lịch ngay hôm nay để được nhắc lịch tự động và tư vấn phác đồ phù hợp với bạn.</p>
            <form className="cta-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Nhập email của bạn" />
              <button className="cta-btn">Đặt lịch ngay</button>
            </form>
          </div>
          <div className="cta-visual">
            <img src="/assets/logo-y-te.jpg" alt="Bác sĩ VaxCare" />
          </div>
        </div>
      </div>
    </section>
  );
}
