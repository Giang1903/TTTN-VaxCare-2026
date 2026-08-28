import { apiClient } from "./apiClient";

// ---- Facilities ----
export function getFacilitiesAdmin() {
  return apiClient.request("/facilities/admin/all", { method: "GET" });
}
export function createFacility(body) {
  return apiClient.request("/facilities", { method: "POST", body });
}
export function updateFacility(id, body) {
  return apiClient.request(`/facilities/${id}`, { method: "PUT", body });
}
export function deactivateFacility(id) {
  return apiClient.request(`/facilities/${id}`, { method: "DELETE" });
}
export function reactivateFacility(id) {
  return apiClient.request(`/facilities/${id}/reactivate`, { method: "PATCH" });
}

export function mapFacilityToUi(f) {
  const open = f.openingTime ? String(f.openingTime).slice(0, 5) : "";
  const close = f.closingTime ? String(f.closingTime).slice(0, 5) : "";
  return {
    id: f.facilityId,
    name: f.facilityName || "",
    addr: f.address || "",
    phone: f.phone || "",
    cap: f.capacityPerSlot ?? 0,
    open,
    close,
    status: String(f.status || "ACTIVE").toUpperCase(),
    imageUrl: f.imageUrl,
    _raw: f,
  };
}

// ---- Vaccines ----
export function getVaccineCategories() {
  return apiClient.request("/vaccine-categories", { method: "GET", auth: false });
}

export function getVaccinesAdmin() {
  return apiClient.request("/admin/vaccines", { method: "GET" });
}
export function createVaccine(body) {
  return apiClient.request("/admin/vaccines", { method: "POST", body });
}
export function updateVaccine(id, body) {
  return apiClient.request(`/admin/vaccines/${id}`, { method: "PUT", body });
}
export function deactivateVaccine(id) {
  return apiClient.request(`/admin/vaccines/${id}`, { method: "DELETE" });
}
export function reactivateVaccine(id) {
  return apiClient.request(`/admin/vaccines/${id}/reactivate`, { method: "PATCH" });
}

export function mapVaccineToUi(v) {
  return {
    id: v.vaccineId,
    name: v.vaccineName || "",
    manufacturer: v.manufacturer || "",
    full: v.manufacturer || "",
    disease: v.targetDisease || "",
    doses: v.requiredDoses ?? "",
    interval: v.doseIntervalDays ?? "",
    cat: v.categoryId ?? "",
    categoryName: v.categoryName || "",
    proto: v.description || "",
    status: String(v.status || "ACTIVE").toUpperCase(),
    price: v.currentPrice != null ? Number(v.currentPrice).toLocaleString("vi-VN") + "₫" : "",
    priceRaw: v.currentPrice,
    bookings: v.totalBookings ?? 0,
    rating: v.averageRating ?? "",
    _raw: v,
  };
}

// ---- Price lists ----
export function getAllPricesAdmin() {
  return apiClient.request("/price-lists/admin/all", { method: "GET" });
}
export function createPrice(body) {
  return apiClient.request("/price-lists", { method: "POST", body });
}
export function deactivatePrice(id) {
  return apiClient.request(`/price-lists/${id}`, { method: "DELETE" });
}

export function mapPriceToUi(p) {
  return {
    id: p.priceListId,
    vaccineId: p.vaccineId,
    vaccine: p.vaccineName || "",
    facilityId: p.facilityId,
    facility: p.facilityName || "Tất cả cơ sở",
    price: p.price != null ? Number(p.price).toLocaleString("vi-VN") + "₫" : "",
    priceRaw: p.price,
    effective: p.effectiveDate ? String(p.effectiveDate).split("-").reverse().join("/") : "",
    expiry: p.expiryDate ? String(p.expiryDate).split("-").reverse().join("/") : "",
    status: String(p.status || "ACTIVE").toUpperCase(),
    _raw: p,
  };
}

// ---- Inventory (reuse staff endpoints; admin can pass any facilityId) ----
export function getStock(facilityId) {
  return apiClient.request(`/inventory/stock?facilityId=${facilityId}`, { method: "GET" });
}
export function getBatches(facilityId, extra = {}) {
  const params = new URLSearchParams({ facilityId: String(facilityId) });
  if (extra.vaccineId) params.set("vaccineId", String(extra.vaccineId));
  if (extra.status) params.set("status", extra.status);
  return apiClient.request(`/inventory/batches?${params}`, { method: "GET" });
}
export function getLowStock(facilityId) {
  return apiClient.request(`/inventory/alerts/low-stock?facilityId=${facilityId}`, { method: "GET" });
}

// ---- Accounts ----
export function listUsers() {
  return apiClient.request("/admin/accounts/users", { method: "GET" });
}
export function listStaff() {
  return apiClient.request("/admin/accounts/staff", { method: "GET" });
}
export function updateAccountStatus(id, status) {
  return apiClient.request(`/admin/accounts/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

/** PATCH /admin/accounts/{id}/password — admin đặt mật khẩu mới */
export function setAccountPassword(id, newPassword) {
  return apiClient.request(`/admin/accounts/${id}/password`, {
    method: "PATCH",
    body: { newPassword },
  });
}

export function mapAccountToUi(a) {
  const name = a.fullName || a.email || "—";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "??";
  let age = "";
  if (a.dateOfBirth) {
    const y = new Date().getFullYear() - new Date(a.dateOfBirth).getFullYear();
    age = y;
  }
  const genderMap = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };
  return {
    id: a.accountId,
    name,
    initials,
    email: a.email || "",
    phone: a.phone || "",
    gender: genderMap[a.gender] || a.gender || "",
    age,
    addr: a.address || "",
    status: String(a.status || "ACTIVE").toUpperCase(),
    staffCode: a.staffCode || "",
    specialty: a.specialty || "",
    facilityId: a.facilityId,
    facility: a.facilityName || "",
    role: a.role,
    createdAt: a.createdAt,
    _raw: a,
  };
}

// ---- Reports (admin uses same endpoint, optional facilityId) ----
export function getReport({ days, fromDate, toDate, facilityId } = {}) {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (!fromDate && !toDate && days != null) params.set("days", String(days));
  if (facilityId != null) params.set("facilityId", String(facilityId));
  const qs = params.toString();
  return apiClient.request(`/staff/reports${qs ? `?${qs}` : ""}`, { method: "GET" });
}

// ---- Audit ----
export function listAuditLogs({ entityType, limit = 200 } = {}) {
  const params = new URLSearchParams();
  if (entityType) params.set("entityType", entityType);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return apiClient.request(`/admin/audit-logs${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export function mapAuditToUi(log) {
  const created = log.createdAt ? String(log.createdAt).replace("T", " ").slice(0, 16) : "";
  const cat = (log.entityType || "CONFIG").toUpperCase();
  return {
    id: log.logId,
    t: created,
    actor: log.actorName || log.actorEmail || "Hệ thống",
    action: log.action || "",
    target: [log.entityType, log.entityId != null ? `#${log.entityId}` : null].filter(Boolean).join(" · "),
    scope: log.ipAddress || "—",
    cat,
    oldValue: log.oldValue,
    newValue: log.newValue,
    _raw: log,
  };
}

// ---- Inventory batch helpers ----
export function importBatch(body) {
  return apiClient.request("/inventory/batches", { method: "POST", body });
}

export function mapBatchAdminToUi(b, facilityNameMap = {}) {
  const stock = b.stockQuantity ?? 0;
  const status = String(b.status || "AVAILABLE").toUpperCase();
  const exp = b.expiryDate ? String(b.expiryDate).split("-").reverse().join("/") : "";
  let low = false;
  let expiring = false;
  if (stock > 0 && stock < 100) low = true;
  if (b.expiryDate) {
    const expD = new Date(b.expiryDate);
    const days = (expD - new Date()) / (1000 * 60 * 60 * 24);
    if (days >= 0 && days <= 90) expiring = true;
  }
  return {
    id: b.batchId,
    fac: b.facilityId,
    facName: facilityNameMap[b.facilityId] || `CS #${b.facilityId}`,
    vax: b.vaccineId,
    vaxName: b.vaccineName || "",
    code: b.batchNumber || "",
    stock,
    exp,
    status,
    low,
    expiring,
    _raw: b,
  };
}

// ---- System configs ----
export function listConfigs() {
  return apiClient.request("/admin/configs", { method: "GET" });
}
export function saveConfigsBatch(items) {
  return apiClient.request("/admin/configs/batch", { method: "PUT", body: items });
}

// ---- Create staff ----
export function createStaff(body) {
  return apiClient.request("/admin/accounts/staff", { method: "POST", body });
}

/** PATCH /admin/users/staff/{staffId}/facility */
export function updateStaffFacility(staffId, facilityId) {
  return apiClient.request(`/admin/users/staff/${staffId}/facility`, {
    method: "PATCH",
    body: { facilityId: Number(facilityId) },
  });
}

// ---- Report export (admin uses staff endpoints) ----
export async function exportReportAppointments({ fromDate, toDate, facilityId } = {}) {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (facilityId != null) params.set("facilityId", String(facilityId));
  const qs = params.toString();
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"}/staff/reports/export/appointments${qs ? `?${qs}` : ""}`,
    {
      headers: { Authorization: `Bearer ${apiClient.getAccessToken() || ""}` },
    }
  );
  if (!res.ok) throw new Error("Export thất bại");
  return res.blob();
}
export async function exportReportSummary({ fromDate, toDate, facilityId } = {}) {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (facilityId != null) params.set("facilityId", String(facilityId));
  const qs = params.toString();
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"}/staff/reports/export/summary${qs ? `?${qs}` : ""}`,
    {
      headers: { Authorization: `Bearer ${apiClient.getAccessToken() || ""}` },
    }
  );
  if (!res.ok) throw new Error("Export thất bại");
  return res.blob();
}