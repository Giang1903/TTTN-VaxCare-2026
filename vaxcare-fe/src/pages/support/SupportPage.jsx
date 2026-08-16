import PageHero from '../../components/shared/PageHero';
import SupportChannels from '../../components/support/SupportChannels';
import SupportFaq from '../../components/support/SupportFaq';
import ContactSection from '../../components/support/ContactSection';
import SupportCTA from '../../components/support/SupportCTA';

export default function SupportPage() {
  return (
    <>
      <PageHero
        currentLabel="Hỗ trợ"
        eyebrow="Trung tâm hỗ trợ"
        title="Chúng tôi luôn sẵn sàng hỗ trợ bạn"
        lead="Tìm câu trả lời nhanh trong FAQ, liên hệ hotline 1900 6868 hoặc gửi yêu cầu qua form. Đội ngũ VaxCare phản hồi trong giờ làm việc."
        image="/assets/support.png"
        imageAlt="Hỗ trợ VaxCare"
        imageObjectPosition="78% 35%"
        badgeIcon={
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        }
        badgeNum="1900"
        badgeLabel="Hotline 6868"
      />
      <SupportChannels />
      <SupportFaq />
      <ContactSection />
      <SupportCTA />
    </>
  );
}
