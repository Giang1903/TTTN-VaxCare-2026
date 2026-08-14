import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

import HomePage from '../pages/home/HomePage';


// import ProtectedRoute from './ProtectedRoute'; // TODO: bọc quanh các route patient/staff/admin

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== PUBLIC (Navbar + Footer) ===== */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
