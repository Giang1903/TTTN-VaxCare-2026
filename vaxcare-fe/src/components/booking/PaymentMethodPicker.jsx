export default function PaymentMethodPicker({ value, onChange, disabled }) {
  const isVnpay = value === 'VNPAY';
  const isZalopay = value === 'ZALOPAY';

  const cardBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: '#fff',
    transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
    fontFamily: 'inherit',
    fontSize: 15,
    fontWeight: 600,
    textAlign: 'left',
  };

  const logoStyle = {
    width: 36,
    height: 36,
    objectFit: 'contain',
    flexShrink: 0,
    display: 'block',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange?.('VNPAY')}
        style={{
          ...cardBase,
          border: isVnpay ? '2px solid #3b82f6' : '1px solid #e2e8f0',
          background: isVnpay ? '#eff6ff' : '#fff',
          color: isVnpay ? '#1e40af' : '#64748b',
          boxShadow: isVnpay ? '0 0 0 1px rgba(59,130,246,0.15)' : 'none',
        }}
      >
        <img
          src="/assets/vnpay.png"
          alt="VNPAY"
          style={logoStyle}
        />
        <span>VNPAY</span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange?.('ZALOPAY')}
        style={{
          ...cardBase,
          border: isZalopay ? '2px solid #0068ff' : '1px solid #e2e8f0',
          background: isZalopay ? '#eff6ff' : '#fff',
          color: isZalopay ? '#0052cc' : '#64748b',
          boxShadow: isZalopay ? '0 0 0 1px rgba(0,104,255,0.15)' : 'none',
        }}
      >
        <img
          src="/assets/ZaloPay.png"
          alt="ZaloPay"
          style={{ ...logoStyle, borderRadius: 8 }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span>ZaloPay</span>
      </button>
    </div>
  );
}
