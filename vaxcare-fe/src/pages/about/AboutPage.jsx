import PageHero from '../../components/shared/PageHero';
import MissionVision from '../../components/about/MissionVision';
import Story from '../../components/about/Story';
import WhyChooseVaxCare from '../../components/about/WhyChooseVaxCare';
import AboutCTA from '../../components/about/AboutCTA';

export default function AboutPage() {
  return (
    <>
      <PageHero
        currentLabel="Giới thiệu"
        eyebrow="Về chúng tôi"
        title="VaxCare — Tiêm chủng thông minh, vì sức khỏe cộng đồng"
        lead="Chúng tôi xây dựng nền tảng điều phối tiêm chủng ứng dụng AI, giúp người dân đặt lịch dễ dàng, cơ sở y tế vận hành hiệu quả và hồ sơ tiêm chủng được quản lý tập trung."
        image="/assets/about.png"
        imageAlt="Đội ngũ y tế VaxCare"
        imageObjectPosition="78% 35%"
        badgeIcon={
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 3 7v6c0 5 3.8 8.6 9 9 5.2-.4 9-4 9-9V7l-9-5Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        }
        badgeNum="2024"
        badgeLabel="Năm thành lập"
      />
      <MissionVision />
      <Story />
      <WhyChooseVaxCare />
      <AboutCTA />
    </>
  );
}
