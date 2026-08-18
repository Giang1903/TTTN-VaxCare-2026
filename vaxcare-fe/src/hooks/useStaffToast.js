import { useCallback, useRef, useState } from 'react';

export default function useStaffToast(duration = 2800) {
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const timerRef = useRef(null);

  const showToast = useCallback(
    (message, type = '') => {
      clearTimeout(timerRef.current);
      setToast({ message, type, show: true });
      timerRef.current = setTimeout(() => {
        setToast((t) => ({ ...t, show: false }));
      }, duration);
    },
    [duration]
  );

  return { toast, showToast };
}
