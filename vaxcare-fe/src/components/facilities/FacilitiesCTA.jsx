// ============ CTA (Facilities) ============
export default function FacilitiesCTA() {
  return (
    <section className="cta">
      <div className="wrap">
        <div className="cta-box">
          <div className="cta-content">
            <h3>Chưa tìm thấy cơ sở gần bạn?</h3>
            <p>Để lại email, VaxCare sẽ báo ngay khi có cơ sở mới mở gần khu vực của bạn.</p>
            <form className="cta-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Nhập email của bạn" />
              <button className="cta-btn">Nhận thông báo</button>
            </form>
          </div>
          <div className="cta-visual">
            <img src="/assets/logo-y-te.jpg" alt="Cơ sở VaxCare" />
          </div>
        </div>
      </div>
    </section>
  );
}
