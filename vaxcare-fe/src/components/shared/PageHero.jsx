import { Link } from 'react-router-dom';
import usePageHeroTilt from '../../hooks/usePageHeroTilt';

// ============ PAGE HERO (dùng chung cho các trang con: Vắc xin, Cơ sở tiêm chủng...) ============
export default function PageHero({
  currentLabel,
  eyebrow,
  title,
  lead,
  image,
  imageAlt,
  imageObjectPosition,
  badgeIcon,
  badgeNum,
  badgeLabel,
}) {
  usePageHeroTilt();

  return (
    <section className="page-hero">
      <div className="vx-blob-field">
        <span className="vx-blob b1"></span>
        <span className="vx-blob b2"></span>
        <span className="vx-blob b3"></span>
      </div>
      <span className="vx-orbit" style={{ width: '260px', height: '260px', top: '-6%', right: '6%' }}></span>
      <div className="wrap">
        <div className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <span className="current">{currentLabel}</span>
        </div>
        <div className="page-hero-top">
          <div>
            <span className="eyebrow on-dark">
              <span className="dot"></span>
              {eyebrow}
            </span>
            <h1>{title}</h1>
            <p className="lead">{lead}</p>
          </div>
          <div className="page-hero-visual-wrap">
            <div className="page-hero-visual">
              <img src={image} alt={imageAlt} style={imageObjectPosition ? { objectPosition: imageObjectPosition } : undefined} />
            </div>
            <div className="hero-float-badge">
              <span className="hfb-icon">{badgeIcon}</span>
              <div>
                <div className="hfb-num">{badgeNum}</div>
                <div className="hfb-label">{badgeLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
