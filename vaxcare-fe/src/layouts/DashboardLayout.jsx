import { Outlet } from 'react-router-dom';
import LoggedInNavbar from '../components/dashboard-shared/LoggedInNavbar';
import MobileNavPanel from '../components/dashboard-shared/MobileNavPanel';
import Footer from '../components/layout/Footer';
import useMobileNav from '../hooks/useMobileNav';
import useScrollReveal from '../hooks/useScrollReveal';
import useBubbleField from '../hooks/useBubbleField';
import '../styles/dashboard.css';

// Layout dùng cho các trang đã đăng nhập (không dùng Navbar/Footer public
export default function DashboardLayout() {
  const mobileNav = useMobileNav();
  useBubbleField();
  useScrollReveal();

  return (
    <div className="dashboard-area">
      <div className="bubble-field" id="bubbleField" />
      <LoggedInNavbar onOpenMobileNav={mobileNav.open} />
      <MobileNavPanel isOpen={mobileNav.isOpen} onClose={mobileNav.close} />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
