import { apiClient } from "./apiClient";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

/** GET /vaccinations/history — lịch sử tiêm của user đang đăng nhập */
export function getMyVaccinationHistory() {
  return apiClient.request("/vaccinations/history", { method: "GET" });
}

/** GET /vaccinations/{detailId}/certificate — tải PDF chứng nhận */
export async function downloadCertificate(detailId) {
  const token = apiClient.getAccessToken();
  const res = await fetch(`${API_BASE_URL}/vaccinations/${detailId}/certificate`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let msg = "Không tải được chứng nhận PDF";
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
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

function formatDate(d) {
  if (!d) return "—";
  const s = String(d);
  if (s.includes("-") && s.length >= 10) {
    const [y, m, day] = s.slice(0, 10).split("-");
    return `${day}/${m}/${y}`;
  }
  return s;
}

function isSuccessfulResult(result) {
  const r = String(result || "SUCCESS").toUpperCase();
  return r === "SUCCESS" || r === "PARTIAL" || r === "COMPLETED";
}

/** Map VaccinationDetailResponse → item timeline UI */
export function mapDetailToTimelineItem(d) {
  const dose = d.doseNumber != null ? `Mũi ${d.doseNumber}` : "";
  const title = [d.vaccineName, dose].filter(Boolean).join(" – ") || "Mũi tiêm";
  const facility = d.facilityName || "Cơ sở VaxCare";
  const lot = d.batchNumber ? `Lô ${d.batchNumber}` : null;
  const doctor = d.staffName || null;
  const lines = [[facility, lot, doctor].filter(Boolean).join(" · ")].filter(Boolean);
  const date = formatDate(d.injectionDate);
  const result = String(d.result || "SUCCESS").toUpperCase();
  const ok = isSuccessfulResult(result);

  return {
    title,
    tag: { text: ok ? "Đã tiêm" : result === "FAILED" ? "Không tiêm được" : result, type: ok ? "done" : "warn" },
    lines,
    date,
    meta: d.certificateCode ? `CN: ${d.certificateCode}` : undefined,
    detailId: d.detailId,
    shot: {
      name: title,
      date,
      time: "—",
      facility,
      lot: lot || "—",
      doctor: doctor || "—",
      status: ok ? "Đã tiêm" : result === "FAILED" ? "Không tiêm được" : result,
      note: d.note || "",
      detailId: d.detailId,
      certificateCode: d.certificateCode,
    },
  };
}

export function ageInMonths(dateOfBirth, onDate = new Date()) {
  if (!dateOfBirth) return null;
  const dob = new Date(String(dateOfBirth).slice(0, 10) + "T00:00:00");
  const on = onDate instanceof Date ? onDate : new Date(String(onDate).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(dob.getTime()) || Number.isNaN(on.getTime()) || dob > on) return null;
  let months = (on.getFullYear() - dob.getFullYear()) * 12 + (on.getMonth() - dob.getMonth());
  if (on.getDate() < dob.getDate()) months -= 1;
  return Math.max(0, months);
}

function matchesAge(detail, ageMonths) {
  const from = detail?.ageFromMonths ?? detail?.age_from_months ?? null;
  const to = detail?.ageToMonths ?? detail?.age_to_months ?? null;
  const unrestricted = from == null && to == null;
  if (ageMonths == null) return unrestricted;
  if (from != null && ageMonths < Number(from)) return false;
  if (to != null && ageMonths > Number(to)) return false;
  return true;
}

function ageSpecificity(detail) {
  let s = 0;
  if (detail?.ageFromMonths != null || detail?.age_from_months != null) s++;
  if (detail?.ageToMonths != null || detail?.age_to_months != null) s++;
  return s;
}

function findNextProtocolDetail(protocolList, nextDoseNumber, ageMonths) {
  const candidates = [];
  for (const p of protocolList || []) {
    for (const d of p.details || p.protocolDetails || []) {
      const dn = d.doseNumber ?? d.dose_number;
      if (dn != null && Number(dn) === nextDoseNumber && matchesAge(d, ageMonths)) {
        candidates.push(d);
      }
    }
  }
  candidates.sort((a, b) => ageSpecificity(b) - ageSpecificity(a));
  return candidates[0] || null;
}

function addDaysIso(isoDate, days) {
  if (!isoDate) return null;
  const d = new Date(String(isoDate).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + Number(days || 0));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatAgeLabel(ageMonths) {
  if (ageMonths == null) return null;
  if (ageMonths < 24) return `${ageMonths} tháng tuổi`;
  const years = Math.floor(ageMonths / 12);
  const rem = ageMonths % 12;
  return rem ? `${years} tuổi ${rem} tháng` : `${years} tuổi`;
}

function dueStatus(isoDate) {
  if (!isoDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(String(isoDate).slice(0, 10) + "T00:00:00");
  if (Number.isNaN(due.getTime())) return null;
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return { kind: "overdue", days: Math.abs(diff), label: `Quá hạn ${Math.abs(diff)} ngày` };
  if (diff === 0) return { kind: "today", days: 0, label: "Đến hạn hôm nay" };
  if (diff <= 3) return { kind: "soon", days: diff, label: `Còn ${diff} ngày` };
  return { kind: "scheduled", days: diff, label: `Còn ${diff} ngày` };
}

export function buildProtocolsFromDetails(
  details = [],
  vaccineMetaById = null,
  upcomingAppointments = [],
  options = {},
) {
  const { dateOfBirth = null, protocolsByVaccineId = null } = options || {};
  const map = new Map();

  const getMeta = (vaccineId) => {
    if (!vaccineMetaById || vaccineId == null) return {};
    const raw =
      vaccineMetaById instanceof Map
        ? vaccineMetaById.get(Number(vaccineId)) ?? vaccineMetaById.get(String(vaccineId))
        : vaccineMetaById[vaccineId] ?? vaccineMetaById[String(vaccineId)];
    if (!raw) return {};
    if (typeof raw === "number") return { requiredDoses: raw };
    return raw;
  };

  const lookupRequired = (vaccineId, fromDetail) => {
    const meta = getMeta(vaccineId);
    if (meta.requiredDoses != null && Number(meta.requiredDoses) > 0) return Number(meta.requiredDoses);
    if (fromDetail != null && Number(fromDetail) > 0) return Number(fromDetail);
    return 1;
  };

  const lookupInterval = (vaccineId) => {
    const meta = getMeta(vaccineId);
    const n = meta.doseIntervalDays != null ? Number(meta.doseIntervalDays) : null;
    return n != null && n > 0 ? n : null;
  };

  const getProtocolList = (vaccineId) => {
    if (!protocolsByVaccineId || vaccineId == null) return [];
    return (
      protocolsByVaccineId[vaccineId] ||
      protocolsByVaccineId[String(vaccineId)] ||
      protocolsByVaccineId[Number(vaccineId)] ||
      []
    );
  };

  const nextApptByVaccine = new Map();
  for (const a of upcomingAppointments || []) {
    const vid = a.vaccineId ?? a.vaccine?.vaccineId;
    if (vid == null || !a.appointmentDate) continue;
    const st = String(a.status || "").toUpperCase();
    if (!["PENDING", "CONFIRMED", "CHECKED_IN"].includes(st)) continue;

    const pay = String(a.paymentStatus || "").toUpperCase();
    const free = a.price != null && Number(a.price) === 0;
    const paid = a.paid === true || pay === "SUCCESS" || free;
    if (!paid && st !== "CHECKED_IN") continue;

    const iso = String(a.appointmentDate).slice(0, 10);
    const prev = nextApptByVaccine.get(Number(vid)) || nextApptByVaccine.get(String(vid));
    if (!prev || iso < prev) {
      nextApptByVaccine.set(Number(vid), iso);
      nextApptByVaccine.set(String(vid), iso);
    }
  }

  for (const d of details) {
    const key = d.vaccineId ?? d.vaccineName;
    if (key == null) continue;

    const resultOk = isSuccessfulResult(d.result);
    if (!resultOk) continue;

    const req = lookupRequired(d.vaccineId, d.requiredDoses);
    const doseNum = Number(d.doseNumber) || 0;

    if (!map.has(key)) {
      map.set(key, {
        key: String(key),
        vaccineId: d.vaccineId,
        name: d.vaccineName || "Vắc xin",
        doses: 0,
        maxDoseNumber: 0,
        requiredDoses: req,
        lastDate: null,
      });
    }
    const row = map.get(key);
    row.doses += 1;
    if (doseNum > row.maxDoseNumber) row.maxDoseNumber = doseNum;
    if (req > row.requiredDoses) row.requiredDoses = req;

    const id = d.injectionDate ? String(d.injectionDate).slice(0, 10) : null;
    if (id && (!row.lastDate || id > row.lastDate)) row.lastDate = id;
  }

  const ageMonths = ageInMonths(dateOfBirth, new Date());
  const ageLabel = formatAgeLabel(ageMonths);

  return [...map.values()].map((r) => {
    const req = Math.max(1, r.requiredDoses || 1);
    const isCompleted = r.doses >= req || (r.maxDoseNumber > 0 && r.maxDoseNumber >= req);
    const widthPct = Math.min(100, Math.round((Math.min(r.doses, req) / req) * 100));
    const nextDoseNumber = (r.maxDoseNumber || r.doses) + 1;

    let nextDate = null;
    let nextSource = null; 
    let ageMatched = false;
    let ageRangeLabel = null;

    if (!isCompleted) {
      const booked =
        nextApptByVaccine.get(Number(r.vaccineId)) ||
        nextApptByVaccine.get(String(r.vaccineId)) ||
        null;
      if (booked) {
        nextDate = booked;
        nextSource = "booked";
      } else {
        const plist = getProtocolList(r.vaccineId);
        const detail = findNextProtocolDetail(plist, nextDoseNumber, ageMonths);
        if (detail && r.lastDate) {
          const interval = Number(detail.intervalDays ?? detail.interval_days ?? 0);
          nextDate = addDaysIso(r.lastDate, interval);
          nextSource = "protocol";
          ageMatched = ageMonths != null && matchesAge(detail, ageMonths) && ageSpecificity(detail) > 0;
          const from = detail.ageFromMonths ?? detail.age_from_months;
          const to = detail.ageToMonths ?? detail.age_to_months;
          if (from != null || to != null) {
            const a = from != null ? `${from}th` : "…";
            const b = to != null ? `${to}th` : "…";
            ageRangeLabel = `Khung tuổi phác đồ: ${a} – ${b}`;
          }
        } else {
          const interval = lookupInterval(r.vaccineId);
          if (interval && r.lastDate) {
            nextDate = addDaysIso(r.lastDate, interval);
            nextSource = "interval";
          }
        }
      }
    }

    const status = !isCompleted && nextDate ? dueStatus(nextDate) : null;

    let sub;
    if (isCompleted) {
      sub = r.lastDate ? `Mũi gần nhất: ${formatDate(r.lastDate)} · Đã đủ phác đồ` : "Đã hoàn thành phác đồ";
    } else if (nextDate && nextSource === "booked") {
      sub = `Mũi ${nextDoseNumber}: ${formatDate(nextDate)} (đã đặt lịch)`;
    } else if (nextDate) {
      const src =
        nextSource === "protocol"
          ? ageMatched
            ? "theo phác đồ độ tuổi"
            : "theo phác đồ"
          : "dự kiến";
      sub = `Mũi ${nextDoseNumber}: ${formatDate(nextDate)} (${src})`;
    } else if (r.lastDate) {
      sub = `Mũi gần nhất: ${formatDate(r.lastDate)}`;
    } else {
      sub = "";
    }

    return {
      key: r.key,
      name: r.name,
      doses: r.doses,
      requiredDoses: req,
      nextDoseNumber: isCompleted ? null : nextDoseNumber,
      nextDate,
      nextSource,
      ageMatched,
      ageLabel,
      ageRangeLabel,
      status, 
      isCompleted,
      pct: `${r.doses}/${req} mũi${isCompleted ? " (Hoàn thành)" : ""}`,
      width: `${widthPct}%`,
      sub,
    };
  });
}