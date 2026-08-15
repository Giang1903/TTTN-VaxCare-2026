import Hero from '../../components/home/Hero';
import QuickBooking from '../../components/home/QuickBooking';
import VaccineCategories from '../../components/home/VaccineCategories';
import AIBooking from '../../components/home/AIBooking';
import VaccinePreview from '../../components/home/VaccinePreview';
import FacilitySearch from '../../components/home/FacilitySearch';
import VaccinationRecord from '../../components/home/VaccinationRecord';
import Protocol from '../../components/home/Protocol';
import QRCheckin from '../../components/home/QRCheckin';
import WhyVaxCare from '../../components/home/WhyVaxCare';
import Statistics from '../../components/home/Statistics';
import CTA from '../../components/home/CTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <QuickBooking />
      <VaccineCategories />
      <AIBooking />
      <VaccinePreview />
      <FacilitySearch />
      <VaccinationRecord />
      <Protocol />
      <QRCheckin />
      <WhyVaxCare />
      <Statistics />
      <CTA />
    </>
  );
}
