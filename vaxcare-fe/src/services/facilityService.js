import { apiClient } from "./apiClient";

// GET /api/v1/facilities -> FacilityResponse[] (chỉ cơ sở đang ACTIVE)
export function getFacilities() {
  return apiClient.request("/facilities", { method: "GET", auth: false });
}

// GET /api/v1/facilities/{id} -> FacilityResponse
export function getFacilityById(id) {
  return apiClient.request(`/facilities/${id}`, { method: "GET", auth: false });
}
