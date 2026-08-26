import { useCallback, useEffect, useMemo, useState } from 'react';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';
import ProfileHeader from '../../components/record/ProfileHeader';
import ProtocolProgress from '../../components/record/ProtocolProgress';
import VaccinationTimeline from '../../components/record/VaccinationTimeline';
import CertificateSidebar from '../../components/record/CertificateSidebar';
import ShotDetailModal from '../../components/record/ShotDetailModal';
import RecordDetailModal from '../../components/record/RecordDetailModal';
import EditProfileModal from '../../components/record/EditProfileModal';
import HealthProfileCard from '../../components/record/HealthProfileCard';
import { getMyHealthProfile } from '../../services/healthProfileService';
import { useAuth } from '../../context/AuthContext';
import * as vaccinationService from '../../services/vaccinationService';
import { getMyAppointments } from '../../services/appointmentService';

export default function RecordPage() {
  const { user, refreshProfile } = useAuth();
  const [history, setHistory] = useState(null);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shotModal, setShotModal] = useState({ open: false, shot: null });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [health, setHealth] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [hist, appts, hp] = await Promise.all([
        vaccinationService.getMyVaccinationHistory().catch(() => null),
        getMyAppointments().catch(() => []),
        getMyHealthProfile().catch(() => null),
      ]);
      setHistory(hist);
      setHealth(hp);
      const up = (appts || []).filter((a) =>
        ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(String(a.status || '').toUpperCase()),
      );
      setUpcomingCount(up.length);
    } catch (err) {
      setError(err.message || 'Không tải được hồ sơ tiêm chủng');
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const details = history?.details || [];
  const timelineItems = useMemo(
    () =>
      [...details]
        .sort((a, b) => String(b.injectionDate || '').localeCompare(String(a.injectionDate || '')))
        .map(vaccinationService.mapDetailToTimelineItem),
    [details],
  );

  const protocols = useMemo(
    () => vaccinationService.buildProtocolsFromDetails(details),
    [details],
  );

  const stats = useMemo(
    () => [
      { n: String(history?.totalDoses ?? details.length), l: 'Mũi đã tiêm' },
      { n: String(upcomingCount), l: 'Lịch sắp tới' },
      { n: String(protocols.length), l: 'Phác đồ đang theo' },
      {
        n: user?.fullName && user?.dateOfBirth ? 'OK' : '—',
        l: 'Hồ sơ cá nhân',
      },
    ],
    [history, details.length, upcomingCount, protocols.length, user],
  );

  const summary = useMemo(
    () =>
      timelineItems.slice(0, 8).map((it) => ({
        name: it.title,
        meta: it.date,
      })),
    [timelineItems],
  );

  const recordCode =
    history?.historyId != null
      ? `VC-${history.historyId}`
      : user?.userId != null
        ? `VC-${user.userId}`
        : '—';

  const updatedAt = details[0]?.injectionDate
    ? vaccinationService.mapDetailToTimelineItem(details[0]).date
    : '—';

  return (
    <>
      <SlimPageHero currentLabel="Hồ sơ tiêm chủng" />

      <div className="wrap record-page">
        {error && (
          <p className="form-error" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}

        <ProfileHeader
          profile={user}
          stats={stats}
          onOpenDetail={() => setDetailModalOpen(true)}
          onOpenEdit={() => setEditModalOpen(true)}
        />

        <HealthProfileCard
          health={
            health || {
              height: user?.height,
              weight: user?.weight,
              allergies: user?.allergies,
              medicalHistory: user?.medicalHistory,
              note: user?.healthNote,
            }
          }
          onEdit={() => setEditModalOpen(true)}
        />

        <ProtocolProgress protocols={protocols} />

        <div className="record-layout">
          <VaccinationTimeline
            items={timelineItems}
            loading={loading}
            onOpenShotDetail={(shot) => setShotModal({ open: true, shot })}
          />
          <CertificateSidebar
            profile={user}
            recordCode={recordCode}
            updatedAt={updatedAt}
            certificates={details.filter((d) => d.detailId)}
          />
        </div>
      </div>

      <ShotDetailModal
        open={shotModal.open}
        shot={shotModal.shot}
        onClose={() => setShotModal({ open: false, shot: null })}
      />
      <RecordDetailModal
        open={detailModalOpen}
        profile={user}
        health={
          health || {
            height: user?.height,
            weight: user?.weight,
            allergies: user?.allergies,
            medicalHistory: user?.medicalHistory,
            note: user?.healthNote,
          }
        }
        stats={stats}
        summary={summary}
        recordCode={recordCode}
        onClose={() => setDetailModalOpen(false)}
      />
      <EditProfileModal
        open={editModalOpen}
        profile={user}
        onClose={() => setEditModalOpen(false)}
        onSaved={async () => {
          setEditModalOpen(false);
          await refreshProfile?.();
          try {
            const hp = await getMyHealthProfile();
            setHealth(hp);
          } catch {
            /* ignore */
          }
        }}
      />
    </>
  );
}