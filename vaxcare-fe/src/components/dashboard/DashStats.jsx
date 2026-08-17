import { dashStats } from '../../mockdata/dashboardData';

const ICONS = {
  blue: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  ),
  green: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>
  ),
  orange: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
  ),
};

// ============ DASH STATS ============
export default function DashStats() {
  return (
    <div className="dash-stats">
      {dashStats.map((s) => (
        <div className="dash-stat-card" key={s.label}>
          <div className={`dash-stat-icon ${s.color}`}>{ICONS[s.color]}</div>
          <div>
            <div className="num">{s.num}</div>
            <div className="lbl">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
