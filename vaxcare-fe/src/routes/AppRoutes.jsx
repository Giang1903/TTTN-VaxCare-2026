import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import HomePage from '../pages/home/HomePage';


// import ProtectedRoute from './ProtectedRoute'; // TODO: bọc quanh các route patient/staff/admin

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== PUBLIC (Navbar + Footer) ===== */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
      
      {/* ===== AUTH (full-screen split layout, không Navbar/Footer) ===== */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}
