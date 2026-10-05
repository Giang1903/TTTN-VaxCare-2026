export default function PaymentMethodPicker({ value, onChange, disabled }) {
  const isVnpay = value === 'VNPAY';
  const isMomo = value === 'MOMO';

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
        onClick={() => onChange?.('MOMO')}
        style={{
          ...cardBase,
          border: isMomo ? '2px solid #e11d8c' : '1px solid #e2e8f0',
          background: isMomo ? '#fdf2f8' : '#fff',
          color: isMomo ? '#9d174d' : '#64748b',
          boxShadow: isMomo ? '0 0 0 1px rgba(225,29,140,0.12)' : 'none',
        }}
      >
        <img
          src="/assets/momo.png"
          alt="MoMo"
          style={{ ...logoStyle, borderRadius: 8 }}
        />
        <span>MoMo</span>
      </button>
    </div>
  );
}
