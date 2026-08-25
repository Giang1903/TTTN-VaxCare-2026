const STATUS_UI = {
  PENDING: { status: "pending", statusLabel: "Chờ xác nhận", slotNote: "Chờ duyệt" },
  CONFIRMED: { status: "confirmed", statusLabel: "Đã xác nhận", slotNote: "Đã xác nhận" },
  CHECKED_IN: { status: "checkedin", statusLabel: "Đã check-in", slotNote: "Đang chờ tiêm", highlight: true },
  COMPLETED: { status: "completed", statusLabel: "Hoàn thành", slotNote: "Đã xong" },
  CANCELLED: { status: "cancelled", statusLabel: "Đã hủy", slotNote: "Đã hủy" },
  NO_SHOW: { status: "noshow", statusLabel: "Vắng mặt", slotNote: "Không đến" },
};

export function mapAppointment(raw) {
  if (!raw) return null;
  const ui = STATUS_UI[raw.status] || STATUS_UI.PENDING;
  const name = raw.userFullName || "Khách hàng";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

  const timeSlot = raw.timeSlot ? String(raw.timeSlot).slice(0, 5) : "—";
  const price =
    raw.price != null ? Number(raw.price).toLocaleString("vi-VN") + "₫" : null;

  return {
    id: raw.appointmentId,
    appointmentId: raw.appointmentId,
    time: timeSlot,
    timeSlot: raw.timeSlot,
    appointmentDate: raw.appointmentDate,
    name,
    initials,
    phone: raw.userPhone || "—",
    age: "",
    vaccine: raw.vaccineName || "Vắc xin",
    vaccineId: raw.vaccineId,
    facilityId: raw.facilityId,
    facilityName: raw.facilityName,
    dose: "",
    price,
    qr: raw.qrCode || (raw.appointmentId != null ? `VX-${raw.appointmentId}` : ""),
    status: ui.status,
    statusLabel: ui.statusLabel,
    slotNote: ui.slotNote,
    highlight: !!ui.highlight,
    ai: !!raw.recommendedByAi,
    note: raw.note || "",
    rawStatus: raw.status,
    staffName: raw.staffName,
    userId: raw.userId,
  };
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateVN(iso) {
  if (!iso) return "—";
  const s = String(iso);
  if (s.includes("-")) {
    const [y, m, d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  return s;
}