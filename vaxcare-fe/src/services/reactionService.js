import { apiClient } from "./apiClient";

/** POST /api/v1/reactions — user khai báo phản ứng sau tiêm */
export function submitReaction({ detailId, severity, symptoms }) {
  return apiClient.request("/reactions", {
    method: "POST",
    body: {
      detailId: Number(detailId),
      severity,
      symptoms: symptoms || undefined,
    },
  });
}

/** GET /api/v1/reactions/my */
export function getMyReactions() {
  return apiClient.request("/reactions/my", { method: "GET" });
}

export const SEVERITY_OPTIONS = [
  { value: "NONE", label: "Không có triệu chứng" },
  { value: "MILD", label: "Nhẹ (sưng, đau nhẹ tại chỗ)" },
  { value: "MODERATE", label: "Trung bình (sốt, mệt rõ)" },
  { value: "SEVERE", label: "Nặng (khó thở, dị ứng nặng…)" },
];

export function severityLabel(s) {
  return SEVERITY_OPTIONS.find((o) => o.value === s)?.label || s || "—";
}