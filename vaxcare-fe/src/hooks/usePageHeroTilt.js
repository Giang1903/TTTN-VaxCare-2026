import { useEffect } from 'react';

// Chuyển từ script "Hero visual 3D tilt (mouse-follow parallax)" dùng chung
// trong facility.html / vaccine-catalog.html / vaccine-detail.html.
// Gọi trong component có phần tử .page-hero-visual-wrap > .page-hero-visual.
export default function usePageHeroTilt(deps = []) {
  useEffect(() => {
    const wraps = document.querySelectorAll('.page-hero-visual-wrap');
    const reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;

    const cleanups = [];
    wraps.forEach((wrap) => {
      const card = wrap.querySelector('.page-hero-visual');
      if (!card) return;

      function handleMove(e) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const ry = (px - 0.5) * 16;
        const rx = (0.5 - py) * 12;
        card.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      }
      function handleLeave() {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      }

      wrap.addEventListener('mousemove', handleMove);
      wrap.addEventListener('mouseleave', handleLeave);
      cleanups.push(() => {
        wrap.removeEventListener('mousemove', handleMove);
        wrap.removeEventListener('mouseleave', handleLeave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
