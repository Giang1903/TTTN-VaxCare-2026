import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// ===== LAYOUTS =====
import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import StaffLayout from "../layouts/StaffLayout";
import AdminLayout from "../components/layout/AdminLayout";

// ===== AUTH =====
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";

// ===== PUBLIC =====
import HomePage from "../pages/home/HomePage";
import FacilitiesPage from "../pages/facilities/FacilitiesPage";
import VaccinesPage from "../pages/vaccines/VaccinesPage";
import VaccineDetailPage from "../pages/vaccine-detail/VaccineDetailPage";
import AboutPage from "../pages/about/AboutPage";
import SupportPage from "../pages/support/SupportPage";
import PaymentResultPage from "../pages/payment/PaymentResultPage";

// ===== USER =====
import DashboardPage from "../pages/dashboard/DashboardPage";
import AppointmentsPage from "../pages/appointments/AppointmentsPage";
import RecordPage from "../pages/record/RecordPage";
import BookingPage from "../pages/booking/BookingPage";
import ReactionsPage from "../pages/reactions/ReactionsPage";

// ===== STAFF =====
import StaffDashboardPage from "../pages/staff/StaffDashboardPage";
import StaffAppointmentsPage from "../pages/staff/StaffAppointmentsPage";
import StaffVaccinationPage from "../pages/staff/StaffVaccinationPage";
import StaffInventoryPage from "../pages/staff/StaffInventoryPage";
import StaffReactionsPage from "../pages/staff/StaffReactionsPage";
import StaffReportsPage from "../pages/staff/StaffReportsPage";

// ===== ADMIN =====
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminReports from "../pages/admin/AdminReports";
import AdminFacilities from "../pages/admin/AdminFacilities";
import AdminStaff from "../pages/admin/AdminStaff";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminVaccines from "../pages/admin/AdminVaccines";
import AdminInventory from "../pages/admin/AdminInventory";
import AdminPricing from "../pages/admin/AdminPricing";
import AdminConfig from "../pages/admin/AdminConfig";
import AdminAudit from "../pages/admin/AdminAudit";

export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC*/}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/facilities" element={<FacilitiesPage />} />
        <Route path="/vaccines" element={<VaccinesPage />} />
        <Route path="/vaccines/:id" element={<VaccineDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />
      </Route>

      {/* USER SAU ĐĂNG NHẬP */}
      <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/record" element={<RecordPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/reactions" element={<ReactionsPage />} />
        </Route>
      </Route>

      {/*STAFF*/}
      <Route element={<ProtectedRoute allowedRoles={["MEDICAL_STAFF"]} />}>
        <Route element={<StaffLayout />}>
          <Route path="/staff" element={<StaffDashboardPage />} />
          <Route path="/staff/appointments" element={<StaffAppointmentsPage />} />
          <Route path="/staff/vaccination" element={<StaffVaccinationPage />} />
          <Route path="/staff/inventory" element={<StaffInventoryPage />} />
          <Route path="/staff/reactions" element={<StaffReactionsPage />} />
          <Route path="/staff/reports" element={<StaffReportsPage />} />
        </Route>
      </Route>

      {/*ADMIN*/}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="facilities" element={<AdminFacilities />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="vaccines" element={<AdminVaccines />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="pricing" element={<AdminPricing />} />
          <Route path="config" element={<AdminConfig />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>
      </Route>

      {/* AUTH*/}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
    </Routes>
  );
}