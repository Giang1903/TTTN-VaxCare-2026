import { useEffect, useRef, useState } from 'react';

export default function QrCameraScanner({ active, onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lastCodeRef = useRef('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/immutability
      stopCamera();
      return undefined;
    }

    let cancelled = false;

    async function start() {
      setError('');
      if (!navigator.mediaDevices?.getUserMedia) {
        setSupported(false);
        setError('Trình duyệt không hỗ trợ camera. Hãy nhập mã QR thủ công.');
        return;
      }

      const hasDetector = typeof window.BarcodeDetector === 'function';
      if (!hasDetector) {
        setSupported(false);
        setError(
          'Trình duyệt này chưa hỗ trợ quét QR tự động (nên dùng Chrome/Edge). Bạn vẫn có thể nhập mã bên dưới.',
        );
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setRunning(true);

        if (hasDetector) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const tick = async () => {
            if (cancelled || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes?.length) {
                const raw = String(codes[0].rawValue || '').trim();
                if (raw && raw !== lastCodeRef.current) {
                  lastCodeRef.current = raw;
                  onDetected?.(raw);
                }
              }
            } catch {
              /* frame lỗi — bỏ qua */
            }
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      } catch (err) {
        setRunning(false);
        const name = err?.name || '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setError('Bạn đã chặn quyền camera. Cho phép camera rồi bật lại, hoặc nhập mã thủ công.');
        } else if (name === 'NotFoundError') {
          setError('Không tìm thấy camera trên thiết bị.');
        } else {
          setError(err?.message || 'Không mở được camera.');
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function stopCamera() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setRunning(false);
    lastCodeRef.current = '';
  }

  return (
    <div className="scan-zone" style={{ padding: 12, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#0f172a',
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: running ? 'block' : 'none',
          }}
        />
        {!running && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              fontSize: 13,
              padding: 16,
              textAlign: 'center',
            }}
          >
            {error || (active ? 'Đang mở camera…' : 'Camera tắt')}
          </div>
        )}
        {running && (
          <div
            style={{
              position: 'absolute',
              inset: '18%',
              border: '2px solid rgba(56, 189, 248, 0.85)',
              borderRadius: 12,
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.35)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
      {error && supported && (
        <p style={{ margin: '10px 0 0', fontSize: 12.5, color: '#b91c1c', textAlign: 'left' }}>{error}</p>
      )}
      {!supported && error && (
        <p style={{ margin: '10px 0 0', fontSize: 12.5, color: '#64748b', textAlign: 'left' }}>{error}</p>
      )}
      {running && (
        <p style={{ margin: '10px 0 0', fontSize: 12.5, color: '#64748b', textAlign: 'center' }}>
          Đưa mã QR vào khung — hệ thống sẽ tự điền mã khi nhận được
        </p>
      )}
    </div>
  );
}
