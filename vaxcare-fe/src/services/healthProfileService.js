import { apiClient } from "./apiClient";

/** GET /health-profiles — hồ sơ sức khỏe của user hiện tại (1-1) */
export function getMyHealthProfile() {
  return apiClient.request("/health-profiles", { method: "GET" });
}

/** GET /health-profiles/{id} */
export function getHealthProfileById(id) {
  return apiClient.request(`/health-profiles/${id}`, { method: "GET" });
}

/** POST /health-profiles */
export function createHealthProfile(data) {
  return apiClient.request("/health-profiles", {
    method: "POST",
    body: {
      height: data.height != null && data.height !== "" ? Number(data.height) : null,
      weight: data.weight != null && data.weight !== "" ? Number(data.weight) : null,
      medicalHistory: data.medicalHistory || null,
      allergies: data.allergies || null,
      note: data.note || data.healthNote || null,
    },
  });
}

/** PUT /health-profiles/{id} */
export function updateHealthProfile(id, data) {
  return apiClient.request(`/health-profiles/${id}`, {
    method: "PUT",
    body: {
      height: data.height != null && data.height !== "" ? Number(data.height) : null,
      weight: data.weight != null && data.weight !== "" ? Number(data.weight) : null,
      medicalHistory: data.medicalHistory || null,
      allergies: data.allergies || null,
      note: data.note || data.healthNote || null,
    },
  });
}

/**
 * Lưu hồ sơ sức khỏe: ưu tiên API riêng; nếu chưa có profileId thì tạo mới.
 * Fallback: PUT /auth/profile (AuthService tự tạo HealthProfile nếu chưa có).
 */
export async function saveHealthProfile({ profileId, height, weight, medicalHistory, allergies, note }) {
  const payload = { height, weight, medicalHistory, allergies, note, healthNote: note };
  if (profileId) {
    return updateHealthProfile(profileId, payload);
  }
  try {
    return await createHealthProfile(payload);
  } catch {
    // Fallback qua auth profile (backend tạo HP nếu null)
    const { updateProfile } = await import("./authService");
    return updateProfile({
      height: height != null && height !== "" ? Number(height) : undefined,
      weight: weight != null && weight !== "" ? Number(weight) : undefined,
      medicalHistory: medicalHistory || undefined,
      allergies: allergies || undefined,
      healthNote: note || undefined,
    });
  }
}