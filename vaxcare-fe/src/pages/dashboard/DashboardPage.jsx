import DashHero from '../../components/dashboard/DashHero';
import DashStats from '../../components/dashboard/DashStats';
import AISuggestion from '../../components/dashboard/AISuggestion';
import QuickActions from '../../components/dashboard/QuickActions';
import UpcomingAppointments from '../../components/dashboard/UpcomingAppointments';
import RecentRecords from '../../components/dashboard/RecentRecords';

export default function DashboardPage() {
  return (
    <>
      <DashHero />
      <div className="wrap section-pad">
        <DashStats />
        <AISuggestion />
        <QuickActions />
        <div className="dash-grid">
          <UpcomingAppointments />
          <RecentRecords />
        </div>
      </div>
    </>
  );
}
