import { Link } from 'react-router-dom';
import { timeline } from '../../mockdata/record';

// ============ VACCINATION TIMELINE ============
export default function VaccinationTimeline({ onOpenShotDetail }) {
  return (
    <div>
      <div className="section-title"><span className="dot-live"></span> Lịch sử tiêm chủng</div>
      <p className="section-desc">Toàn bộ mũi tiêm đã ghi nhận trên hệ thống VaxCare.</p>
      <div className="timeline-record">
        {timeline.map((t) => (
          <div className={`tl-rec-item${t.pending ? ' pending' : ''}`} key={t.title}>
            <div className={`tl-rec-card${t.pending ? ' pending-card' : ''}`}>
              <div>
                <h4>{t.title} <span className={`tl-tag ${t.tag.type}`}>{t.tag.text}</span></h4>
                <p>
                  {t.lines.map((l, i) => (
                    <span key={l}>
                      {l}
                      {i < t.lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
                <div className="tl-actions">
                  {t.actions
                    ? t.actions.map((a) => (
                        <Link to={a.to} key={a.label}>{a.label}</Link>
                      ))
                    : (
                      <button type="button" onClick={() => onOpenShotDetail(t.shot)}>
                        Xem chi tiết mũi tiêm
                      </button>
                    )}
                </div>
              </div>
              <div className="tl-rec-meta">
                <span className="date">{t.date}</span>
                {t.meta}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
