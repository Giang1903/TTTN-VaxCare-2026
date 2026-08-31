import { apiClient } from "./apiClient";

/** GET /api/v1/notifications — thông báo của user */
export function getMyNotifications() {
  return apiClient.request("/notifications", { method: "GET" });
}

/** GET /api/v1/notifications/unread-count */
export function getUnreadCount() {
  return apiClient
    .request("/notifications/unread-count", { method: "GET" })
    .then((data) => {
      if (data == null) return 0;
      if (typeof data === "number") return data;
      return Number(data.unreadCount ?? data.count ?? 0) || 0;
    })
    .catch(() => 0);
}

/** PATCH /api/v1/notifications/{id}/read */
export function markNotificationRead(id) {
  return apiClient
    .request(`/notifications/${id}/read`, { method: "PATCH" })
    .catch(() => null);
}

/** PATCH /api/v1/notifications/read-all — đánh dấu tất cả đã đọc */
export function markAllNotificationsRead() {
  return apiClient
    .request("/notifications/read-all", { method: "PATCH" })
    .catch(() => null);
}