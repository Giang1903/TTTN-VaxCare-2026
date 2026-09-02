import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ msg: '', type: '', show: false });
  const timerRef = useRef(null);

  const showToast = useCallback((msg, type = '') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type, show: true });
    timerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        id="toast"
        className={`toast${toast.show ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}
      >
        {toast.msg}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
