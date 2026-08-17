import { protocols } from '../../mockdata/record';

const PC_ICONS = {
  hpv: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" /></svg>,
  hepb: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  flu: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></svg>,
  mmr: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>,
};

// ============ PROTOCOL PROGRESS ============
export default function ProtocolProgress() {
  return (
    <>
      <div className="section-title"><span className="dot-live"></span> Phác đồ đang theo dõi</div>
      <p className="section-desc">Tiến độ hoàn thành từng loại vắc xin theo lịch khuyến cáo.</p>
      <div className="protocol-grid">
        {protocols.map((p) => (
          <div className="protocol-card" key={p.key}>
            <div className="pc-head">
              <h4><span className={`pc-icon ${p.key}`}>{PC_ICONS[p.key]}</span> {p.name}</h4>
              <span className="pc-pct">{p.pct}</span>
            </div>
            <div className="progress-bar"><span style={{ width: p.width }}></span></div>
            <div className="pc-sub">{p.sub}</div>
          </div>
        ))}
      </div>
    </>
  );
}
