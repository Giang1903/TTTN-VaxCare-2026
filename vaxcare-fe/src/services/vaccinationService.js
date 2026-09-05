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

export function buildProtocolsFromDetails(details = [], vaccineMetaById = null, upcomingAppointments = []) {
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

  // appointment sớm nhất theo vaccineId (ngày >= hôm nay hoặc mọi active)
  const nextApptByVaccine = new Map();
  for (const a of upcomingAppointments || []) {
    const vid = a.vaccineId ?? a.vaccine?.vaccineId;
    if (vid == null || !a.appointmentDate) continue;
    const st = String(a.status || "").toUpperCase();
    if (!["PENDING", "CONFIRMED", "CHECKED_IN"].includes(st)) continue;
    const iso = String(a.appointmentDate).slice(0, 10);
    const prev = nextApptByVaccine.get(Number(vid)) || nextApptByVaccine.get(String(vid));
    if (!prev || iso < prev) {
      nextApptByVaccine.set(Number(vid), iso);
      nextApptByVaccine.set(String(vid), iso);
    }
  }

  function addDaysIso(isoDate, days) {
    if (!isoDate) return null;
    const d = new Date(String(isoDate).slice(0, 10) + "T00:00:00");
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  for (const d of details) {
    const key = d.vaccineId ?? d.vaccineName;
    if (key == null) continue;

    const resultOk = isSuccessfulResult(d.result);
    if (!resultOk) continue;

    const req = lookupRequired(d.vaccineId, d.requiredDoses);

    if (!map.has(key)) {
      map.set(key, {
        key: String(key),
        vaccineId: d.vaccineId,
        name: d.vaccineName || "Vắc xin",
        doses: 0,
        requiredDoses: req,
        lastDate: null, // ISO
      });
    }
    const row = map.get(key);
    row.doses += 1;
    if (req > row.requiredDoses) row.requiredDoses = req;

    const id = d.injectionDate ? String(d.injectionDate).slice(0, 10) : null;
    if (id && (!row.lastDate || id > row.lastDate)) row.lastDate = id;
  }

  return [...map.values()].map((r) => {
    const req = Math.max(1, r.requiredDoses || 1);
    const isCompleted = r.doses >= req;
    const widthPct = Math.min(100, Math.round((r.doses / req) * 100));

    let sub;
    if (isCompleted) {
      sub = r.lastDate ? `Mũi gần nhất: ${formatDate(r.lastDate)}` : "Đã hoàn thành phác đồ";
    } else {
      // 1) Ưu tiên ngày đã đặt lịch mũi tiếp theo
      const booked =
        nextApptByVaccine.get(Number(r.vaccineId)) ||
        nextApptByVaccine.get(String(r.vaccineId)) ||
        null;
      if (booked) {
        sub = `Mũi tiếp theo: ${formatDate(booked)} (đã đặt lịch)`;
      } else {
        // 2) Tính từ mũi gần nhất + dose_interval_days
        const interval = lookupInterval(r.vaccineId);
        const suggested = interval && r.lastDate ? addDaysIso(r.lastDate, interval) : null;
        if (suggested) {
          sub = `Mũi tiếp theo: ${formatDate(suggested)} (dự kiến)`;
        } else if (r.lastDate) {
          sub = `Mũi gần nhất: ${formatDate(r.lastDate)}`;
        } else {
          sub = "";
        }
      }
    }

    return {
      key: r.key,
      name: r.name,
      doses: r.doses,
      requiredDoses: req,
      isCompleted,
      pct: `${r.doses}/${req} mũi${isCompleted ? " (Hoàn thành)" : ""}`,
      width: `${widthPct}%`,
      sub,
    };
  });
}