import { Outlet } from 'react-router-dom';
import StaffSidebar from '../components/staff/StaffSidebar';
import '../styles/staff.css';

export default function StaffLayout() {
  return (
    <div className="staff-shell">
      <StaffSidebar />
      <div className="staff-main">
        <Outlet />
      </div>
    </div>
  );
}
