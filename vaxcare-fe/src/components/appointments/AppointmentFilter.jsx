const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'completed', label: 'Đã tiêm' },
  { key: 'cancelled', label: 'Đã hủy' },
];

// ============ APPOINTMENT FILTER TABS ============
export default function AppointmentFilter({ active, onChange }) {
  return (
    <div className="appt-filter">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          className={active === f.key ? 'active' : undefined}
          onClick={() => onChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}