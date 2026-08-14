import { useEffect } from 'react';

// Chuyển từ <script> scroll-reveal gốc trong homepage.html sang hook dùng lại được.
// Gọi 1 lần trong layout của trang public (MainLayout) sau khi các section đã render.
export default function useScrollReveal(deps = []) {
  useEffect(() => {
    const revealTargets = [];

    document.querySelectorAll('section:not(.hero)').forEach((el) => {
      el.classList.add('reveal');
      revealTargets.push(el);
    });

    const staggerSelectors = [
      '.qb-grid', '.cat-grid', '.ai-grid', '.vaccine-grid',
      '.fac-grid', '.record-grid', '.why-grid', '.stats-grid',
    ];
    document.querySelectorAll(staggerSelectors.join(',')).forEach((el) => {
      el.classList.add('reveal-stagger');
      revealTargets.push(el);
    });

    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    revealTargets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
