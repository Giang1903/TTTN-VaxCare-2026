import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getVaccineById } from '../../services/vaccineService';
import DetailBreadcrumb from '../../components/vaccine-detail/DetailBreadcrumb';
import DetailTop from '../../components/vaccine-detail/DetailTop';
import DetailTabs from '../../components/vaccine-detail/DetailTabs';
import RelatedVaccines from '../../components/vaccine-detail/RelatedVaccines';
import DetailCTA from '../../components/vaccine-detail/DetailCTA';

export default function VaccineDetailPage() {
  const { id } = useParams();
  const [vaccine, setVaccine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    setVaccine(null);
    getVaccineById(id)
      .then((data) => {
        if (!cancelled) setVaccine(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Không tìm thấy vắc xin này.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="wrap" style={{ padding: '80px 0', textAlign: 'center' }}>
        Đang tải thông tin vắc xin...
      </div>
    );
  }

  if (error || !vaccine) {
    return (
      <div className="wrap" style={{ padding: '80px 0', textAlign: 'center' }}>
        <p className="form-error" style={{ marginBottom: 16 }}>
          {error || 'Không tìm thấy vắc xin này.'}
        </p>
        <Link to="/vaccines" className="btn btn-primary">
          Về danh mục vắc xin
        </Link>
      </div>
    );
  }

  return (
    <>
      <DetailBreadcrumb vaccineName={vaccine.vaccineName} />
      <DetailTop vaccine={vaccine} />
      <DetailTabs vaccine={vaccine} />
      <RelatedVaccines categoryId={vaccine.categoryId} excludeId={vaccine.vaccineId} />
      <DetailCTA vaccineName={vaccine.vaccineName} />
    </>
  );
}
