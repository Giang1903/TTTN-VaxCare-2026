import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import HomePage from '../pages/home/HomePage';
import FacilitiesPage from '../pages/facilities/FacilitiesPage';
import VaccinesPage from '../pages/vaccines/VaccinesPage';
import VaccineDetailPage from '../pages/vaccine-detail/VaccineDetailPage';
import AboutPage from '../pages/about/AboutPage';
import SupportPage from '../pages/support/SupportPage';


// import ProtectedRoute from './ProtectedRoute'; // TODO: bọc quanh các route patient/staff/admin

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== PUBLIC (Navbar + Footer) ===== */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/facilities" element={<FacilitiesPage />} />
        <Route path="/vaccines" element={<VaccinesPage />} />
        <Route path="/vaccines/:id" element={<VaccineDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/support" element={<SupportPage />} />
      </Route>
      
      {/* ===== AUTH (full-screen split layout, không Navbar/Footer) ===== */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}
