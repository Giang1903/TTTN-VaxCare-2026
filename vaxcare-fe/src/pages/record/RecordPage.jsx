import { useState } from 'react';
import SlimPageHero from '../../components/dashboard-shared/SlimPageHero';
import ProfileHeader from '../../components/record/ProfileHeader';
import ProtocolProgress from '../../components/record/ProtocolProgress';
import VaccinationTimeline from '../../components/record/VaccinationTimeline';
import CertificateSidebar from '../../components/record/CertificateSidebar';
import ShotDetailModal from '../../components/record/ShotDetailModal';
import RecordDetailModal from '../../components/record/RecordDetailModal';
import EditProfileModal from '../../components/record/EditProfileModal';
import { profile } from '../../mockdata/record';

export default function RecordPage() {
  const [displayName, setDisplayName] = useState(profile.name);
  const [shotModal, setShotModal] = useState({ open: false, shot: null });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <>
      <SlimPageHero currentLabel="Hồ sơ tiêm chủng" />

      <div className="wrap record-page">
        <ProfileHeader
          displayName={displayName}
          onOpenDetail={() => setDetailModalOpen(true)}
          onOpenEdit={() => setEditModalOpen(true)}
        />

        <ProtocolProgress />

        <div className="record-layout">
          <VaccinationTimeline onOpenShotDetail={(shot) => setShotModal({ open: true, shot })} />
          <CertificateSidebar />
        </div>
      </div>

      <ShotDetailModal
        open={shotModal.open}
        shot={shotModal.shot}
        onClose={() => setShotModal({ open: false, shot: null })}
      />
      <RecordDetailModal
        open={detailModalOpen}
        displayName={displayName}
        onClose={() => setDetailModalOpen(false)}
      />
      <EditProfileModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={(name) => {
          setDisplayName(name);
          setEditModalOpen(false);
        }}
      />
    </>
  );
}
