import { apiClient } from "./apiClient";

// GET /api/v1/vaccine-categories -> VaccineCategoryResponse[]
export function getVaccineCategories() {
  return apiClient.request("/vaccine-categories", { method: "GET", auth: false });
}

// GET /api/v1/vaccines?categoryId=&keyword=&ageMonths=&facilityId= -> VaccineResponse[]
export function searchVaccines({ categoryId, keyword, ageMonths, facilityId } = {}) {
  const params = new URLSearchParams();
  if (categoryId) params.set("categoryId", categoryId);
  if (keyword) params.set("keyword", keyword);
  if (ageMonths) params.set("ageMonths", ageMonths);
  if (facilityId) params.set("facilityId", facilityId);
  const qs = params.toString();
  return apiClient.request(`/vaccines${qs ? `?${qs}` : ""}`, { method: "GET", auth: false });
}

// GET /api/v1/vaccines/{id}?facilityId= -> VaccineResponse
export function getVaccineById(id, facilityId) {
  const qs = facilityId ? `?facilityId=${facilityId}` : "";
  return apiClient.request(`/vaccines/${id}${qs}`, { method: "GET", auth: false });
}
