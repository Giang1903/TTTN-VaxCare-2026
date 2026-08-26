import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../services/apiClient";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();
  const hasToken = !!apiClient.getAccessToken();

  // Đang hydrate profile từ token — không redirect về login (tránh nháy/văng)
  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#64748b", fontSize: 14 }}>
        Đang tải phiên đăng nhập…
      </div>
    );
  }

  // Có token nhưng user chưa kịp set (hiếm) — vẫn cho qua outlet một nhịp, hoặc chờ
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAuthenticated && hasToken) {
    // Token còn, profile đang sync — không đá ra login
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#64748b", fontSize: 14 }}>
        Đang xác thực…
      </div>
    );
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Sai role: về trang chủ role phù hợp thay vì login
    if (role === "ADMIN") return <Navigate to="/admin" replace />;
    if (role === "MEDICAL_STAFF") return <Navigate to="/staff" replace />;
    if (role === "USER") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}