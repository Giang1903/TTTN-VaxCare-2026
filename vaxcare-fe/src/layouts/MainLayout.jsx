import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LoggedInNavbar from '../components/dashboard-shared/LoggedInNavbar';
import MobileNavPanel from '../components/dashboard-shared/MobileNavPanel';
import useScrollReveal from '../hooks/useScrollReveal';
import useBubbleField from '../hooks/useBubbleField';
import useMobileNav from '../hooks/useMobileNav';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import '../styles/dashboard.css';

export default function MainLayout() {
  const { isAuthenticated, role, loading } = useAuth();
  const mobileNav = useMobileNav();
  useBubbleField();
  useScrollReveal();
  
  const hasToken = !!apiClient.getAccessToken();
  const useLoggedInChrome =
    (hasToken && loading) || (!loading && isAuthenticated && role === 'USER');

  if (useLoggedInChrome) {
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

  return (
    <>
      <div className="bubble-field" id="bubbleField" />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}