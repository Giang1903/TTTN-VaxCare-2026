import PageHero from '../../components/shared/PageHero';
import VaccineCatalog from '../../components/vaccines/VaccineCatalog';
import VaccinesWhy from '../../components/vaccines/VaccinesWhy';
import VaccinesCTA from '../../components/vaccines/VaccinesCTA';

export default function VaccinesPage() {
  return (
    <>
      <PageHero
        currentLabel="Vắc xin"
        eyebrow="Thư viện vắc xin"
        title="Tra cứu & đặt lịch tiêm vắc xin"
        lead="Thông tin minh bạch về nguồn gốc, phác đồ và giá của hơn 30 loại vắc xin, giúp bạn và gia đình chọn đúng mũi tiêm cần thiết."
        image="/assets/vaccine.jpg"
        imageAlt="Tra cứu vắc xin tại VaxCare"
        imageObjectPosition="62% 40%"
        badgeIcon={
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        }
        badgeNum="32+"
        badgeLabel="Loại vắc xin chính hãng"
      />
      <VaccineCatalog />
      <VaccinesWhy />
      <VaccinesCTA />
    </>
  );
}
