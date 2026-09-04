import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';
import AppointmentFilter from '../../components/appointments/AppointmentFilter';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import { getMyAppointments } from '../../services/appointmentService';
import { formatTime } from '../../utils/format';

const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

/** Map backend AppointmentStatus → filter group + UI labels */
function mapStatus(apiStatus) {
  const s = (apiStatus || '').toUpperCase();
  if (s === 'COMPLETED') {
    return {
      status: 'completed',
      statusLabel: 'Đã tiêm',
      dateStyle: { background: 'var(--mint-100)' },
      dayStyle: { color: 'var(--teal-700)' },
      monthStyle: { color: 'var(--teal-600)' },
    };
  }
  if (s === 'CANCELLED' || s === 'NO_SHOW') {
    return {
      status: 'cancelled',
      statusLabel: s === 'NO_SHOW' ? 'Không đến' : 'Đã hủy',
      dateStyle: { background: '#fef2f2' },
      dayStyle: { color: '#c0392b' },
      monthStyle: { color: '#c0392b' },
    };
  }
  // PENDING | CONFIRMED | CHECKED_IN
  return {
    status: 'upcoming',
    statusLabel:
      s === 'CHECKED_IN' ? 'Đã check-in' : s === 'CONFIRMED' ? 'Đã xác nhận' : 'Sắp tới',
    dateStyle: undefined,
    dayStyle: undefined,
    monthStyle: undefined,
  };
}

function formatSlot(timeSlot) {
  if (!timeSlot) return '';
  // "07:30:00" | "07:30"
  return formatTime(typeof timeSlot === 'string' && timeSlot.length === 5 ? `${timeSlot}:00` : timeSlot);
}

/** Chuyển AppointmentResponse → shape dùng trong card */
function mapAppointment(raw) {
  const dateStr = raw.appointmentDate; // "yyyy-MM-dd"
  let day = '—';
  let month = '';
  if (dateStr) {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      day = parts[2];
      const mIdx = Number(parts[1]) - 1;
      month = MONTHS[mIdx] || parts[1];
    }
  }

  const ui = mapStatus(raw.status);
  const timeLabel = formatSlot(raw.timeSlot);
  const facilityPart = raw.facilityName || 'Cơ sở VaxCare';
  const line1 = timeLabel ? `${facilityPart} · ${timeLabel}` : facilityPart;

  let line2 = null;
  if (ui.status === 'completed') {
    line2 = 'Đã tiêm';
  } else if (ui.status === 'cancelled') {
    const reason = raw.cancellationReason || raw.note;
    line2 = reason ? `Lý do hủy: ${reason}` : 'Đã hủy';
  }

  const displayCode =
    raw.qrCode ||
    (raw.appointmentId != null ? `VX-${raw.appointmentId}` : null);

  return {
    appointmentId: raw.appointmentId,
    displayCode,
    qrCode: raw.qrCode,
    status: ui.status,
    statusLabel: ui.statusLabel,
    day,
    month,
    dateStyle: ui.dateStyle,
    dayStyle: ui.dayStyle,
    monthStyle: ui.monthStyle,
    title: raw.vaccineName || 'Lịch tiêm',
    meta: line2 ? `${line1} · ${line2}` : line1,
    line1,
    line2,
    time: timeLabel,
    facility: facilityPart,
    facilityId: raw.facilityId,
    vaccineId: raw.vaccineId,
    cancelledNote: ui.status === 'cancelled' ? (raw.cancellationReason || null) : null,
    rawStatus: raw.status,
    appointmentDate: raw.appointmentDate,
    timeSlot: raw.timeSlot,
    paid: raw.paid === true || String(raw.paymentStatus || '').toUpperCase() === 'SUCCESS',
    paymentStatus: raw.paymentStatus || null,
    cancellationReason: raw.cancellationReason || null,
  };
}

export default function AppointmentsPage() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getMyAppointments()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // Sắp xếp: upcoming trước, rồi theo ngày giảm dần
        const mapped = list.map(mapAppointment);
        mapped.sort((a, b) => {
          if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
          if (b.status === 'upcoming' && a.status !== 'upcoming') return 1;
          const da = a.appointmentDate || '';
          const db = b.appointmentDate || '';
          return db.localeCompare(da);
        });
        setItems(mapped);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải danh sách lịch tiêm.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((a) => a.status === filter)),
    [filter, items],
  );

  function handleRescheduled(updated) {
    if (!updated) {
      load();
      return;
    }
    setItems((prev) =>
      prev.map((a) =>
        a.appointmentId === updated.appointmentId ? mapAppointment(updated) : a,
      ),
    );
  }


  return (
    <>
      <SlimPageHero currentLabel="Lịch tiêm của tôi" />

      <div className="wrap appt-list-page">
        <div className="appt-page-head">
          <div>
            <h1 className="appt-title">Lịch tiêm của tôi</h1>
            <p className="appt-sub">
              Xem lịch hẹn và đổi lịch hẹn nếu cần.
            </p>
          </div>
          <Link to="/booking" className="btn btn-primary btn-sm">
            Đặt lịch mới
          </Link>
        </div>

        <AppointmentFilter active={filter} onChange={setFilter} />

        {loading && (
          <div className="empty-state">Đang tải danh sách lịch tiêm…</div>
        )}

        {!loading && error && (
          <div className="empty-state">
            <p className="form-error" style={{ marginBottom: 12 }}>
              {error}
            </p>
            <button type="button" className="btn btn-primary btn-sm" onClick={load}>
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            Không có lịch tiêm nào trong mục này.
            {filter === 'all' && (
              <>
                {' '}
                <Link to="/booking" style={{ fontWeight: 600, color: 'var(--teal-600)' }}>
                  Đặt lịch ngay
                </Link>
              </>
            )}
          </div>
        )}

        {!loading &&
          !error &&
          filtered.map((a) => (
            <AppointmentCard
              key={a.appointmentId ?? `${a.title}-${a.appointmentDate}-${a.timeSlot}`}
              appt={a}
              onRescheduled={handleRescheduled}
            />
          ))}
      </div>
    </>
  );
}