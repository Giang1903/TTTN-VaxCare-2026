import { apiClient } from "./apiClient";

/** GET /api/v1/notifications — thông báo của user (nhắc lịch, thanh toán…) */
export function getMyNotifications() {
  return apiClient.request("/notifications", { method: "GET" });
}

/** PATCH /api/v1/notifications/{id}/read — đánh dấu đã đọc */
export function markNotificationRead(id) {
  return apiClient.request(`/notifications/${id}/read`, { method: "PATCH" }).catch(() => null);
}
