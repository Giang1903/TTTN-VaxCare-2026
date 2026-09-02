import { apiClient } from "./apiClient";

// GET /api/v1/facilities -> FacilityResponse[] (chỉ cơ sở đang ACTIVE)
// GET /api/v1/facilities?vaccineId=... -> chỉ cơ sở còn tồn kho vắc xin đó
export function getFacilities(vaccineId) {
  const q =
    vaccineId != null && vaccineId !== ""
      ? `?vaccineId=${encodeURIComponent(vaccineId)}`
      : "";
  return apiClient.request(`/facilities${q}`, { method: "GET", auth: false });
}

// GET /api/v1/facilities/{id} -> FacilityResponse
export function getFacilityById(id) {
  return apiClient.request(`/facilities/${id}`, { method: "GET", auth: false });
}