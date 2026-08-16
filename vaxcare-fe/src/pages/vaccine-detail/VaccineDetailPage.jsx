import DetailBreadcrumb from '../../components/vaccine-detail/DetailBreadcrumb';
import DetailTop from '../../components/vaccine-detail/DetailTop';
import DetailTabs from '../../components/vaccine-detail/DetailTabs';
import RelatedVaccines from '../../components/vaccine-detail/RelatedVaccines';
import DetailCTA from '../../components/vaccine-detail/DetailCTA';


export default function VaccineDetailPage() {
  return (
    <>
      <DetailBreadcrumb />
      <DetailTop />
      <DetailTabs />
      <RelatedVaccines />
      <DetailCTA />
    </>
  );
}
