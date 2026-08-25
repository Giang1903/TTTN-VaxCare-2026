import { useEffect, useState } from 'react';
import PageHero from '../../components/shared/PageHero';
import FacilityFinder from '../../components/facilities/FacilityFinder';
import FacilitiesWhy from '../../components/facilities/FacilitiesWhy';
import FacilitiesCTA from '../../components/facilities/FacilitiesCTA';
import { getFacilities } from '../../services/facilityService';

export default function FacilitiesPage() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    getFacilities()
      .then((list) => setCount((list || []).length))
      .catch(() => setCount(null));
  }, []);

  const badge = count != null ? String(count) : '…';
  const lead =
    count != null
      ? `${count} cơ sở VaxCare trên hệ thống, đồng bộ hồ sơ tiêm chủng và cập nhật số chỗ trống theo thời gian thực.`
      : 'Mạng lưới cơ sở VaxCare, đồng bộ hồ sơ tiêm chủng và cập nhật số chỗ trống theo thời gian thực.';

  return (
    <>
      <PageHero
        currentLabel="Cơ sở tiêm chủng"
        eyebrow="Mạng lưới cơ sở"
        title="Tìm cơ sở tiêm chủng gần bạn"
        lead={lead}
        image="/assets/map.jpg"
        imageAlt="Đội ngũ y tế VaxCare"
        imageObjectPosition="78% 35%"
        badgeIcon={
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        }
        badgeNum={badge}
        badgeLabel="Cơ sở trên hệ thống"
      />
      <FacilityFinder />
      <FacilitiesWhy />
      <FacilitiesCTA />
    </>
  );
}