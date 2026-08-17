import { useEffect, useState, useCallback } from 'react';

// Chuyển từ script mobile-nav-overlay (mở/đóng menu trượt) dùng chung trong
// dashboard.html, my-appointments.html, my-record.html, booking.html.
export default function useMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  return { isOpen, open, close };
}
