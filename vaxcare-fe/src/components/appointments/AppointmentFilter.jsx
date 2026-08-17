import { appointmentFilters } from '../../mockdata/appointments';

// ============ APPOINTMENT FILTER ============
export default function AppointmentFilter({ active, onChange }) {
  return (
    <div className="appt-filter">
      {appointmentFilters.map((f) => (
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
