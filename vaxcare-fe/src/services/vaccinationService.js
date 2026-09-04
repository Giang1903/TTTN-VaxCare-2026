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
  const ok = result === "SUCCESS" || result === "COMPLETED";

  return {
    title,
    tag: { text: ok ? "Đã tiêm" : String(d.result || "—"), type: ok ? "done" : "warn" },
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
      status: ok ? "Đã tiêm" : String(d.result || "—"),
      note: d.note || "",
      detailId: d.detailId,
      certificateCode: d.certificateCode,
    },
  };
}

/** Gom theo vaccine → phác đồ (số mũi đã tiêm / tổng số mũi yêu cầu) */
export function buildProtocolsFromDetails(details = []) {
  const map = new Map();
  for (const d of details) {
    const key = d.vaccineId ?? d.vaccineName;
    if (key == null) continue;
    if (!map.has(key)) {
      map.set(key, {
        key: String(key),
        name: d.vaccineName || "Vắc xin",
        doses: 0,
        requiredDoses: d.requiredDoses || 1,
        lastDate: null,
      });
    }
    const row = map.get(key);
    row.doses += 1;
    if (d.requiredDoses && d.requiredDoses > row.requiredDoses) {
      row.requiredDoses = d.requiredDoses;
    }
    const id = d.injectionDate ? String(d.injectionDate) : null;
    if (id && (!row.lastDate || id > row.lastDate)) row.lastDate = id;
  }
  return [...map.values()].map((r) => {
    const last = r.lastDate ? formatDate(r.lastDate) : "—";
    const req = r.requiredDoses || 1;
    const isCompleted = r.doses >= req;
    const widthPct = Math.min(100, Math.round((r.doses / req) * 100));
    return {
      key: r.key,
      name: r.name,
      doses: r.doses,
      requiredDoses: req,
      isCompleted,
      pct: `${r.doses}/${req} mũi${isCompleted ? ' (Hoàn thành)' : ''}`,
      width: `${widthPct}%`,
      sub: `Mũi gần nhất: ${last}`,
    };
  });
}