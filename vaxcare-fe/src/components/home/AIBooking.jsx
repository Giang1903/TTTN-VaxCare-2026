import { Link } from 'react-router-dom';
// ============ SMART BOOKING AI ============
export default function AIBooking() {
  return (
    <section className="ai-booking">
      <div className="wrap">
        <div className="ai-grid">
          <div className="ai-visual">
            <div className="ai-illustration">
              <div className="slot-list">
                <div className="slot-row active">
                  <div>
                    <div className="slot-time">08:00 – 09:00</div>
                    <div className="slot-meta">Sức chứa 10 · Đã đăng ký 8</div>
                  </div>
                  <span className="badge badge-recommended">Recommended</span>
                </div>
                <div className="slot-row">
                  <div>
                    <div className="slot-time">09:00 – 10:00</div>
                    <div className="slot-meta">Sức chứa 10 · Đã đăng ký 6</div>
                  </div>
                  <span className="badge badge-good">Good</span>
                </div>
                <div className="slot-row">
                  <div>
                    <div className="slot-time">10:00 – 11:00</div>
                    <div className="slot-meta">Sức chứa 10 · Đã đăng ký 9</div>
                  </div>
                  <span className="badge badge-moderate">Moderate</span>
                </div>
                <div className="slot-row">
                  <div>
                    <div className="slot-time">14:00 – 15:00</div>
                    <div className="slot-meta">Sức chứa 10 · Đã đăng ký 10</div>
                  </div>
                  <span className="badge badge-busy">Busy</span>
                </div>
              </div>
            </div>
            <div className="ai-recommend-card">
              <div className="arh">
                <span className="art">AI Recommendation</span
                ><span className="badge badge-recommended">08:00–09:00</span>
              </div>
              <div className="ai-stat-row">
                <span>Predicted bookings</span><b>8</b>
              </div>
              <div className="ai-stat-row"><span>Capacity</span><b>10</b></div>
              <div className="ai-stat-row">
                <span>Overload probability</span><b>12%</b>
              </div>
              <div className="ai-stat-row">
                <span>Estimated wait</span><b>8 phút</b>
              </div>
            </div>
          </div>
          <div className="ai-content">
            <span className="eyebrow"
              ><span className="dot"></span>AI Smart Booking</span
            >
            <h2>Đặt lịch tiêm thông minh,<br />giảm thời gian chờ</h2>
            <p className="lead">
              VaxCare phân tích dữ liệu lịch sử đặt lịch, số lượng đăng ký và
              năng lực phục vụ của cơ sở để dự đoán mức độ quá tải và đề xuất
              khung giờ phù hợp.
            </p>
            <ul className="ai-feature-list">
              <li>
                <span className="ico"
                  ><svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M20 6 9 17l-5-5" /></svg></span
                >Dự đoán mức độ quá tải
              </li>
              <li>
                <span className="ico"
                  ><svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M20 6 9 17l-5-5" /></svg></span
                >Đề xuất khung giờ phù hợp
              </li>
              <li>
                <span className="ico"
                  ><svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <path d="M20 6 9 17l-5-5" /></svg></span
                >Ước tính thời gian chờ
              </li>
            </ul>
            <Link to="/login" className="btn btn-primary"
              >Đặt lịch thông minh
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" /></svg
            ></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
