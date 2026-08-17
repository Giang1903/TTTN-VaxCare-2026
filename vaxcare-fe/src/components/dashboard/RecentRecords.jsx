import { Link } from 'react-router-dom';
import { recentRecords } from '../../mockdata/dashboardData';

// ============ RECENT RECORDS (dash-card) ============
export default function RecentRecords() {
  return (
    <div className="dash-card">
      <div className="dash-card-head">
        <h3>Lịch sử tiêm gần đây</h3>
        <Link to="/record">Hồ sơ đầy đủ →</Link>
      </div>
      <div className="dash-card-body">
        {recentRecords.map((r) => (
          <div className="record-row" key={r.title}>
            <div className="record-status done">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <div className="record-meta">
              <h4>{r.title}</h4>
              <p>{r.sub}</p>
            </div>
            <div className="record-date">{r.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
