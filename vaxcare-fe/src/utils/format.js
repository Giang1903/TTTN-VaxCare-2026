// Định dạng số tiền theo kiểu "320.000₫"
export function formatCurrency(value) {
  if (value === null || value === undefined) return "Liên hệ";
  const num = Number(value);
  if (Number.isNaN(num)) return "Liên hệ";
  return `${Math.round(num).toLocaleString("vi-VN")} đ`;
}

const WARD_TO_AREA = [
  { area: "Quận 1", keywords: ["tân định", "cầu ông lãnh"] },
  { area: "Quận 7", keywords: ["phú thuận"] },
  { area: "Quận 12", keywords: ["trung mỹ tây"] },
  { area: "Gò Vấp", keywords: ["thông tây hội"] },
  { area: "Tân Phú", keywords: ["p.tân phú", "phường tân phú"] },
  { area: "Thủ Đức", keywords: ["tam bình", "hiệp bình"] },
  { area: "Phú Nhuận", keywords: ["đức nhuận"] },
  { area: "Bình Tân", keywords: ["an lạc"] },
  { area: "Hóc Môn", keywords: ["đông thạnh"] },
  { area: "Củ Chi", keywords: ["bình mỹ"] },
];

export function deriveAreaFromAddress(address = "") {
  const normalized = address.toLowerCase();
  const match = WARD_TO_AREA.find(({ keywords }) =>
    keywords.some((k) => normalized.includes(k))
  );
  return match ? match.area : "Khác";
}

// "07:30:00" -> "7:30"
export function formatTime(hhmmss) {
  if (!hhmmss) return "";
  const [h, m] = hhmmss.split(":");
  return `${Number(h)}:${m}`;
}