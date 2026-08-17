import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';
import AppointmentFilter from '../../components/appointments/AppointmentFilter';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import { appointments } from '../../mockdata/appointments';

export default function AppointmentsPage() {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(
    () => (filter === 'all' ? appointments : appointments.filter((a) => a.status === filter)),
    [filter],
  );

  return (
    <>
      <SlimPageHero currentLabel="Lịch tiêm của tôi" />

      <div className="wrap appt-list-page">
        <div className="appt-page-head">
          <div>
            <h1 className="appt-title">Lịch tiêm của tôi</h1>
            <p className="appt-sub">Xem, hủy hoặc đổi lịch hẹn. Hủy trước ít nhất 2 giờ so với giờ tiêm.</p>
          </div>
          <Link to="/facilities" className="btn btn-primary btn-sm">Đặt lịch mới</Link>
        </div>

        <AppointmentFilter active={filter} onChange={setFilter} />

        {filtered.length === 0 && (
          <div className="empty-state">Không có lịch tiêm nào trong mục này.</div>
        )}
        {filtered.map((a, i) => (
          <AppointmentCard appt={a} key={a.id ?? `${a.title}-${i}`} />
        ))}
      </div>
    </>
  );
}
