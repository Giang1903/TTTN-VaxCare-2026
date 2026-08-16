// ============ CTA (Vaccines) ============
export default function VaccinesCTA() {
  return (
    <section className="cta">
      <div className="wrap">
        <div className="cta-box">
          <div className="cta-content">
            <h3>Không tìm thấy vắc xin bạn cần?</h3>
            <p>Để lại thông tin, đội ngũ dược sĩ VaxCare sẽ tư vấn loại vắc xin phù hợp trong vòng 24 giờ.</p>
            <form className="cta-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Nhập email của bạn" />
              <button className="cta-btn">Nhận tư vấn</button>
            </form>
          </div>
          <div className="cta-visual">
            <img src="/assets/logo-y-te.jpg" alt="Dược sĩ VaxCare" />
          </div>
        </div>
      </div>
    </section>
  );
}
