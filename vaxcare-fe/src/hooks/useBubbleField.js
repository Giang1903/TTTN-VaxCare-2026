import { useEffect } from 'react';

// Chuyển từ script tạo "bubble-field" trong homepage.html gốc.
// field: id của phần tử container (mặc định "bubbleField", render trong MainLayout).
export default function useBubbleField(fieldId = 'bubbleField') {
  useEffect(() => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.innerHTML = '';
    const total = 22;
    for (let i = 0; i < total; i++) {
      const b = document.createElement('div');
      const isMint = Math.random() > 0.6;
      b.className = 'bubble' + (isMint ? ' mint' : '');
      const size = 10 + Math.random() * 46;
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.left = Math.random() * 100 + '%';
      b.style.animationDuration = 14 + Math.random() * 16 + 's';
      b.style.animationDelay = Math.random() * 20 + 's';
      field.appendChild(b);
    }
  }, [fieldId]);
}
