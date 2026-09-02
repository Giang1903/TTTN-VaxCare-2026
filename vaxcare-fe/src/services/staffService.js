import { apiClient } from "./apiClient";

/** Map BE AppointmentStatus -> UI status key */
export function mapStatus(status) {
  if (!status) return "pending";
  const s = String(status).toUpperCase();
  const map = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    CHECKED_IN: "checkedin",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    NO_SHOW: "noshow",
  };
  return map[s] || "pending";
}

/** Map API AppointmentResponse -> UI appointment object */
export function mapAppointmentToUi(a) {
  const name = a.userFullName || "Khách";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2) || "??";
  const time = a.timeSlot
    ? String(a.timeSlot).slice(0, 5)
    : "--:--";
  const price =
    a.price != null
      ? Number(a.price).toLocaleString("vi-VN") + "₫"
      : "";
  const status = mapStatus(a.status);
  const statusLabelMap = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    checkedin: "Đã check-in",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    noshow: "Vắng mặt",
  };
  let action = "Xem hồ sơ";
  let actionClass = "done";
  if (status === "pending") {
    action = "Xác nhận";
    actionClass = "outline";
  } else if (status === "confirmed") {
    action = "Check-in";
    actionClass = "outline";
  } else if (status === "checkedin") {
    action = "Ghi nhận tiêm";
    actionClass = "solid";
  }
  const meta = [a.vaccineName, a.note].filter(Boolean).join(" · ") || "";
  return {
    id: a.appointmentId,
    time,
    slotNote: "",
    name,
    initials,
    age: "",
    phone: a.userPhone || "",
    vaccine: a.vaccineName || "",
    dose: "",
    price,
    qr: a.qrCode || "",
    status,
    statusLabel: statusLabelMap[status] || status,
    action,
    actionClass,
    meta,
    ai: !!a.recommendedByAi,
    note: a.note || "",
    highlight: status === "checkedin",
    _raw: a,
  };
}

/** GET /staff/appointments */
export function searchAppointments({ facilityId, date, status, keyword } = {}) {
  const params = new URLSearchParams();
  if (facilityId != null) params.set("facilityId", String(facilityId));
  if (date) params.set("date", date);
  if (status) params.set("status", status);
  if (keyword) params.set("keyword", keyword);
  const qs = params.toString();
  return apiClient.request(`/staff/appointments${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

/** PATCH /staff/appointments/{id}/confirm */
export function confirmAppointment(id) {
  return apiClient.request(`/staff/appointments/${id}/confirm`, {
    method: "PATCH",
  });
}


/** PATCH /staff/appointments/{id}/complete */
export function completeVaccination(id) {
  return apiClient.request(`/staff/appointments/${id}/complete`, {
    method: "PATCH",
  });
}

/** PATCH /staff/appointments/{id}/note — lưu ghi chú nhân viên trên lịch hẹn */
export function updateAppointmentNote(id, note) {
  return apiClient.request(`/staff/appointments/${id}/note`, {
    method: "PATCH",
    body: { note: note ?? "" },
  });
}

/** POST /staff/checkin { qrCode } */
export function checkin(qrCode) {
  return apiClient.request(`/staff/checkin`, {
    method: "POST",
    body: { qrCode },
  });
}

/** GET /inventory/batches?facilityId= */
export function getBatches(facilityId, { vaccineId, status } = {}) {
  const params = new URLSearchParams({ facilityId: String(facilityId) });
  if (vaccineId != null) params.set("vaccineId", String(vaccineId));
  if (status) params.set("status", status);
  return apiClient.request(`/inventory/batches?${params}`, { method: "GET" });
}

/** GET /inventory/stock?facilityId= */
export function getStockSummary(facilityId) {
  return apiClient.request(`/inventory/stock?facilityId=${facilityId}`, {
    method: "GET",
  });
}

/** GET /inventory/alerts/low-stock?facilityId= */
export function getLowStockAlerts(facilityId) {
  return apiClient.request(
    `/inventory/alerts/low-stock?facilityId=${facilityId}`,
    { method: "GET" }
  );
}

/** GET /inventory/alerts/expiring-soon?facilityId=&withinDays= */
export function getExpiringSoon(facilityId, withinDays) {
  const params = new URLSearchParams({ facilityId: String(facilityId) });
  if (withinDays != null) params.set("withinDays", String(withinDays));
  return apiClient.request(`/inventory/alerts/expiring-soon?${params}`, {
    method: "GET",
  });
}

/** POST /inventory/batches — nhập lô vắc xin mới */
export function importBatch({
  facilityId,
  vaccineId,
  batchNumber,
  manufactureDate,
  expiryDate,
  importedQuantity,
  importPrice,
  importDate,
}) {
  return apiClient.request(`/inventory/batches`, {
    method: "POST",
    body: {
      facilityId: Number(facilityId),
      vaccineId: Number(vaccineId),
      batchNumber,
      manufactureDate: manufactureDate || undefined,
      expiryDate,
      importedQuantity: Number(importedQuantity),
      importPrice: importPrice !== "" && importPrice != null ? Number(importPrice) : undefined,
      importDate: importDate || undefined,
    },
  });
}

/** PUT /inventory/{facilityId}/alert-threshold */
export function updateAlertThreshold(facilityId, alertThreshold) {
  return apiClient.request(`/inventory/${facilityId}/alert-threshold`, {
    method: "PUT",
    body: { alertThreshold: Number(alertThreshold) },
  });
}

/** GET /reactions?status= */
export function listReactions(status) {
  const qs = status ? `?status=${status}` : "";
  return apiClient.request(`/reactions${qs}`, { method: "GET" });
}

/** PATCH /reactions/{id}/process */
export function processReaction(id, body) {
  return apiClient.request(`/reactions/${id}/process`, {
    method: "PATCH",
    body,
  });
}

/** Map ReactionResponse -> UI reaction item (keyed shape used by StaffReactionsPage) */
export function mapReactionToUi(r) {
  const severity = String(r.severity || "NONE").toUpperCase();
  const processing = String(r.processingStatus || "PENDING").toUpperCase();
  const sevMap = {
    NONE: { sev: "none", sevLabel: "Không có" },
    MILD: { sev: "mild", sevLabel: "Nhẹ" },
    MODERATE: { sev: "moderate", sevLabel: "Trung bình" },
    SEVERE: { sev: "severe", sevLabel: "Nặng" },
  };
  const procMap = {
    PENDING: { proc: "pending", procLabel: "Chờ xử lý" },
    REVIEWED: { proc: "reviewed", procLabel: "Đã xem" },
    CONTACTED: { proc: "contacted", procLabel: "Đã liên hệ" },
    RESOLVED: { proc: "resolved", procLabel: "Đã giải quyết" },
  };
  const s = sevMap[severity] || sevMap.NONE;
  const p = procMap[processing] || procMap.PENDING;
  const name = r.userFullName || "Bệnh nhân";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "??";
  const injDate = r.injectionDate
    ? String(r.injectionDate).split("-").reverse().join("/")
    : "";
  const report = r.recordedTime
    ? String(r.recordedTime).replace("T", " ").slice(0, 16)
    : "";
  return {
    id: r.reactionId,
    av: initials,
    name,
    meta: [r.facilityName, r.userFullName].filter(Boolean).join(" · "),
    sev: s.sev,
    sevLabel: s.sevLabel,
    proc: p.proc,
    procLabel: p.procLabel,
    vax: r.vaccineName || "",
    inj: injDate,
    batch: "",
    report,
    symptoms: r.symptoms || "",
    note: r.staffNote || "",
    severity,
    status: processing,
    f: `${p.proc} ${s.sev}`,
    _raw: r,
  };
}

/** POST /vaccinations/record */
export function recordVaccination({ appointmentId, doseNumber, injectionDate, result, note }) {
  return apiClient.request(`/vaccinations/record`, {
    method: "POST",
    body: {
      appointmentId: Number(appointmentId),
      doseNumber: doseNumber != null ? Number(doseNumber) : undefined,
      injectionDate: injectionDate || undefined,
      result: result || "SUCCESS",
      note: note || undefined,
    },
  });
}

/** GET /vaccinations/history/{userId} */
export function getVaccinationHistory(userId) {
  return apiClient.request(`/vaccinations/history/${userId}`, { method: "GET" });
}

/** Format date as yyyy-MM-dd */
export function formatDate(d) {
  const x = d instanceof Date ? d : new Date(d);
  return x.toISOString().slice(0, 10);
}

/** Last N days including today, oldest first */
export function lastNDates(n = 7) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(formatDate(d));
  }
  return out;
}

/** Vietnamese weekday label T2..CN */
export function weekdayLabel(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const map = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return map[d.getDay()];
}

/**
 * Load appointments for multiple dates (parallel).
 * Returns flat list of raw AppointmentResponse.
 */
export async function searchAppointmentsRange(dates, extra = {}) {
  const results = await Promise.all(
    dates.map((date) =>
      searchAppointments({ ...extra, date }).catch(() => [])
    )
  );
  return results.flat();
}

/** Aggregate counts per day for chart bars */
export function buildWeekChart(rawList, dates) {
  const byDate = {};
  dates.forEach((d) => {
    byDate[d] = 0;
  });
  (rawList || []).forEach((a) => {
    const d = a.appointmentDate
      ? String(a.appointmentDate).slice(0, 10)
      : null;
    if (d && byDate[d] != null) byDate[d] += 1;
  });
  const max = Math.max(1, ...Object.values(byDate));
  const today = formatDate(new Date());
  return dates.map((d) => {
    const val = byDate[d] || 0;
    return {
      label: weekdayLabel(d),
      val,
      h: Math.round((val / max) * 100) || 4,
      today: d === today,
      date: d,
    };
  });
}

/** Overload by time slot for a single day */
export function buildOverload(rawList) {
  const buckets = {};
  (rawList || []).forEach((a) => {
    const t = a.timeSlot ? String(a.timeSlot).slice(0, 5) : null;
    if (!t) return;
    buckets[t] = (buckets[t] || 0) + 1;
  });
  const entries = Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0]));
  if (!entries.length) return [];
  const max = Math.max(...entries.map(([, n]) => n), 1);
  return entries.map(([time, n]) => {
    const pct = Math.round((n / max) * 100);
    let level = "low";
    if (pct >= 75) level = "high";
    else if (pct >= 45) level = "mid";
    return { time, pct, level, count: n };
  });
}

/** Vaccine mix for pie/bar from appointments */
export function buildVaccineMix(rawList, limit = 6) {
  const counts = {};
  (rawList || []).forEach((a) => {
    const name = a.vaccineName || "Khác";
    counts[name] = (counts[name] || 0) + 1;
  });
  const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1;
  const colors = ["#5b8ae0", "#21b56e", "#6366f1", "#e0a308", "#e0473a", "#74b4ff", "#8b9bab"];
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, n], i) => ({
      name,
      shots: n,
      pct: Math.round((n / total) * 100),
      color: colors[i % colors.length],
      tag: i === 0 ? "info" : i < 3 ? "ok" : "",
      rank: i + 1,
    }));
}

/** Map VaccineBatchResponse -> inventory row / detail */
export function mapBatchToUi(b) {
  const stock = b.stockQuantity ?? 0;
  const imported = b.importedQuantity ?? stock;
  const fill = imported > 0 ? Math.round((stock / imported) * 100) : 0;
  let fillClass = "ok";
  let tag = "";
  let tagLabel = "";
  let rowClass = "";
  const status = String(b.status || "").toUpperCase();
  if (status === "EXPIRED" || stock <= 0) {
    fillClass = "danger";
    tag = "danger";
    tagLabel = "Hết / hết hạn";
    rowClass = "danger-row";
  } else if (status === "NEAR_EXPIRY" || fill < 30) {
    fillClass = "warn";
    tag = "warn";
    tagLabel = "Sắp hết / ưu tiên dùng";
    rowClass = "warn-row";
  }
  const exp = b.expiryDate
    ? String(b.expiryDate).split("-").reverse().join("/")
    : "";
  const imp = b.importDate
    ? String(b.importDate).split("-").reverse().join("/")
    : "";
  const mfg = b.manufactureDate
    ? String(b.manufactureDate).split("-").reverse().join("/")
    : "";
  const price =
    b.importPrice != null
      ? Number(b.importPrice).toLocaleString("vi-VN") + "₫ / liều"
      : "";
  return {
    id: b.batchId,
    batch: b.batchNumber || "",
    name: b.vaccineName || "",
    cat: "",
    stock,
    fill,
    fillClass,
    exp,
    tag,
    tagLabel,
    f: [tag, status.toLowerCase()].filter(Boolean).join(" "),
    rowClass,
    // detail
    vax: b.vaccineName || "",
    stockLabel: `${stock} liều`,
    mfg,
    imp,
    price,
    status: status || "AVAILABLE",
    vaccineId: b.vaccineId,
    _raw: b,
  };
}

/** Map StockSummaryResponse -> summary row */
export function mapStockToUi(s) {
  const total = s.totalStock ?? 0;
  const low = !!s.isLowStock;
  return {
    id: s.vaccineId,
    name: s.vaccineName || "Vắc xin",
    code: "",
    total,
    reserved: 0,
    available: total,
    status: low ? "low" : "ok",
    alertThreshold: s.alertThreshold,
    batches: [],
    f: low ? "low" : "ok",
    _raw: s,
  };
}

/**
 * GET /staff/reports
 * - days (optional shortcut) OR fromDate/toDate (yyyy-MM-dd)
 * - facilityId (admin only)
 */
export function getStaffReport({ days, fromDate, toDate, facilityId } = {}) {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (!fromDate && !toDate && days != null) params.set("days", String(days));
  if (facilityId != null) params.set("facilityId", String(facilityId));
  const qs = params.toString();
  return apiClient.request(`/staff/reports${qs ? `?${qs}` : ""}`, { method: "GET" });
}

function reportQuery({ days, fromDate, toDate, facilityId } = {}) {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (!fromDate && !toDate && days != null) params.set("days", String(days));
  if (facilityId != null) params.set("facilityId", String(facilityId));
  return params.toString();
}

/** Download CSV via authenticated fetch (blob) */
async function downloadReportCsv(path, query, filename) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
  const { apiClient } = await import("./apiClient");
  const authToken = apiClient.getAccessToken();
  const qs = query ? `?${query}` : "";
  const res = await fetch(`${API_BASE_URL}${path}${qs}`, {
    method: "GET",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) {
    let message = "Xuất CSV thất bại";
    try {
      const j = await res.json();
      message = j?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** GET /staff/reports/export/appointments → CSV chi tiết lịch hẹn */
export function exportAppointmentsCsv(opts = {}) {
  return downloadReportCsv(
    "/staff/reports/export/appointments",
    reportQuery(opts),
    "vaxcare-appointments.csv"
  );
}

/** GET /staff/reports/export/summary → CSV tổng hợp KPI/ranking */
export function exportSummaryCsv(opts = {}) {
  return downloadReportCsv(
    "/staff/reports/export/summary",
    reportQuery(opts),
    "vaxcare-report-summary.csv"
  );
}

/** GET /vaccinations/{detailId}/certificate */
export async function downloadCertificate(detailId) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
  const authToken = apiClient.getAccessToken();
  const res = await fetch(`${API_BASE_URL}/vaccinations/${detailId}/certificate`, {
    method: "GET",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) {
    let message = "Tải chứng nhận thất bại";
    try {
      const j = await res.json();
      message = j?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chung-nhan-tiem-chung-${detailId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}