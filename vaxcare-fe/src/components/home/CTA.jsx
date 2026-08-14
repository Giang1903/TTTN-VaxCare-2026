// ============ CTA ============
export default function CTA() {
  return (
    <section className="cta" id="support">
      <div className="wrap">
        <div className="cta-box">
          <div className="cta-content">
            <h3>Nhận thông báo về lịch tiêm mới nhất</h3>
            <p>
              Đăng ký để nhận nhắc lịch, cập nhật vắc xin mới và ưu đãi từ
              VaxCare.
            </p>
            <form className="cta-form" onsubmit="return false;">
              <input type="email" placeholder="Nhập email của bạn" />
              <button className="cta-btn">Đăng ký</button>
            </form>
          </div>
          <div className="cta-visual">
            <img src="assets/logo-y-te.jpg" alt="Bác sĩ VaxCare" />
          </div>
        </div>
      </div>
    </section>
  );
}
