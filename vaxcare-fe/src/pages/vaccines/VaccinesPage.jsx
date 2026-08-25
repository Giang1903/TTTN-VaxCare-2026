import { useEffect, useState } from 'react';
import PageHero from '../../components/shared/PageHero';
import VaccineCatalog from '../../components/vaccines/VaccineCatalog';
import VaccinesWhy from '../../components/vaccines/VaccinesWhy';
import VaccinesCTA from '../../components/vaccines/VaccinesCTA';
import { searchVaccines } from '../../services/vaccineService';

export default function VaccinesPage() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    searchVaccines({})
      .then((list) => setCount((list || []).length))
      .catch(() => setCount(null));
  }, []);

  const badge = count != null ? String(count) : '…';
  const lead =
    count != null
      ? `Tra cứu phác đồ và giá của ${count} loại vắc xin trên hệ thống, giúp bạn chọn đúng mũi tiêm cần thiết.`
      : 'Tra cứu phác đồ và giá vắc xin trên hệ thống VaxCare.';

  return (
    <>
      <PageHero
        currentLabel="Vắc xin"
        eyebrow="Danh mục vắc xin"
        title="Tra cứu vắc xin & phác đồ"
        lead={lead}
        image="/assets/vaccine.jpg"
        imageAlt="Tra cứu vắc xin tại VaxCare"
        imageObjectPosition="62% 40%"
        badgeIcon={
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        }
        badgeNum={badge}
        badgeLabel="Loại vắc xin"
      />
      <VaccineCatalog />
      <VaccinesWhy />
      <VaccinesCTA />
    </>
  );
}
