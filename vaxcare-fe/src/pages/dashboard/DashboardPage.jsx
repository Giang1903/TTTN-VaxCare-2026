import { useCallback, useEffect, useMemo, useState } from 'react';
import DashHero from '../../components/dashboard/DashHero';
import DashStats from '../../components/dashboard/DashStats';
import AISuggestion from '../../components/dashboard/AISuggestion';
import QuickActions from '../../components/dashboard/QuickActions';
import UpcomingAppointments from '../../components/dashboard/UpcomingAppointments';
import RecentRecords from '../../components/dashboard/RecentRecords';
import { useAuth } from '../../context/AuthContext';
import { getMyAppointments } from '../../services/appointmentService';
import { formatTime } from '../../utils/format';

const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
const UPCOMING_STATUSES = new Set(['PENDING', 'CONFIRMED', 'CHECKED_IN']);

function parseDateParts(dateStr) {
  if (!dateStr) return { day: '—', month: '', iso: '' };
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return { day: '—', month: '', iso: dateStr };
  const mIdx = Number(parts[1]) - 1;
  return {
    day: parts[2],
    month: MONTHS[mIdx] || parts[1],
    iso: dateStr,
    display: `${parts[2]}/${parts[1]}/${parts[0]}`,
  };
}

function slotLabel(timeSlot) {
  if (!timeSlot) return '';
  return formatTime(
    typeof timeSlot === 'string' && timeSlot.length === 5 ? `${timeSlot}:00` : timeSlot,
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getMyAppointments()
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const { upcoming, completed, upcomingCards, recentCards, nextDateLabel } = useMemo(() => {
    const up = [];
    const done = [];
    for (const a of appointments) {
      const s = (a.status || '').toUpperCase();
      if (UPCOMING_STATUSES.has(s)) up.push(a);
      else if (s === 'COMPLETED') done.push(a);
    }
    up.sort((a, b) => String(a.appointmentDate || '').localeCompare(String(b.appointmentDate || '')));
    done.sort((a, b) =>
      String(b.appointmentDate || '').localeCompare(String(a.appointmentDate || '')),
    );

    const upcomingCards = up.slice(0, 3).map((a) => {
      const d = parseDateParts(a.appointmentDate);
      const time = slotLabel(a.timeSlot);
      const facility = a.facilityName || 'Cơ sở VaxCare';
      return {
        appointmentId: a.appointmentId,
        day: d.day,
        month: d.month,
        title: a.vaccineName || 'Lịch tiêm',
        lines: [time ? `${facility} · ${time}` : facility],
        badge: { text: 'Sắp tới', type: 'upcoming' },
        cancelable: true,
      };
    });

    const recentCards = done.slice(0, 4).map((a) => {
      const d = parseDateParts(a.appointmentDate);
      const facility = a.facilityName || 'Cơ sở VaxCare';
      return {
        title: a.vaccineName || 'Mũi tiêm',
        sub: a.staffName ? `${facility} · ${a.staffName}` : facility,
        date: d.display || d.iso,
      };
    });

    let nextDateLabel = '—';
    if (up[0]?.appointmentDate) {
      const p = String(up[0].appointmentDate).split('-');
      if (p.length === 3) nextDateLabel = `${p[2]}/${p[1]}`;
    }

    return {
      upcoming: up,
      completed: done,
      upcomingCards,
      recentCards,
      nextDateLabel,
    };
  }, [appointments]);


  const displayName = user?.fullName || user?.email || 'bạn';

  return (
    <>
      <DashHero
        userName={displayName}
        upcomingCount={upcoming.length}
        completedCount={completed.length}
      />
      <div className="wrap section-pad">
        <DashStats
          upcomingCount={upcoming.length}
          completedCount={completed.length}
          nextDateLabel={nextDateLabel}
        />
        <AISuggestion />
        <QuickActions />
        <div className="dash-grid">
          <UpcomingAppointments
            items={upcomingCards}
            loading={loading}
          />
          <RecentRecords items={recentCards} loading={loading} />
        </div>
      </div>
    </>
  );
}