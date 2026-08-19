export const vaccineOptions = [
  { id: 'hpv', name: 'HPV – Mũi 2', title: 'HPV (Human Papillomavirus)', desc: 'Phòng ung thư cổ tử cung & một số bệnh liên quan HPV', price: 1790000 },
  { id: 'flu', name: 'Cúm mùa 2026', title: 'Cúm mùa 2026', desc: 'Tiêm định kỳ hàng năm, giảm nguy cơ biến chứng', price: 450000 },
  { id: 'hepb', name: 'Viêm gan B', title: 'Viêm gan B', desc: 'Phác đồ 3 liều — bảo vệ lâu dài', price: 350000 },
  { id: 'mmr', name: 'MMR (Sởi – Quai bị – Rubella)', title: 'MMR', desc: 'Sởi – Quai bị – Rubella, phác đồ 2 liều', price: 350000 },
  { id: 'varicella', name: 'Thủy đậu', title: 'Thủy đậu (Varicella)', desc: 'Phòng bệnh thủy đậu, 2 liều', price: 850000 },
  { id: 'pneumo', name: 'Phế cầu', title: 'Phế cầu (Pneumococcal)', desc: 'Bảo vệ khỏi Streptococcus pneumoniae', price: 1150000 },
];

export const facilityOptions = [
  { id: 'pn', name: 'VaxCare Phú Nhuận', addr: '198 Hoàng Văn Thụ, P.Đức Nhuận', desc: '198 Hoàng Văn Thụ · 07:30–17:00 · Sức chứa 15/khung' },
  { id: 'td', name: 'VaxCare Thủ Đức – Bình Chiểu', addr: '2A Đường Bình Chiểu, P.Tam Bình', desc: '2A Bình Chiểu · 08:00–17:30 · Sức tải 12/khung' },
  { id: 'nz', name: 'VaxCare Nowzone', addr: 'TTTM NOWZONE, 235 Nguyễn Văn Cừ', desc: 'Tầng 2 NOWZONE · 09:00–20:00 · Sức tải 10/khung' },
  { id: 'q1', name: 'VaxCare Quận 1', addr: '45 Nguyễn Du, P.Bến Nghé', desc: '45 Nguyễn Du · 07:30–17:00 · Sức tải 14/khung' },
];

export const timeSlots = [
  '07:30', '08:00', '08:30', '09:00',
  '09:30', '10:00', '10:30', '11:00',
  '13:30', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00',
];

// Demo: một số khung hết chỗ
export const fullSlots = { '10:00': true, '14:00': true, '16:00': true };

const DOWS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

// Chuyển từ buildDates() trong booking.html — sinh 14 ngày kể từ mốc demo.
export function buildBookingDates() {
  const base = new Date(2026, 7, 17); // 17/08/2026 (demo)
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const label =
      String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0') + '/' +
      d.getFullYear();
    dates.push({
      key: label,
      label,
      dow: DOWS[d.getDay()],
      dom: d.getDate(),
      moy: MONTHS[d.getMonth()],
    });
  }
  return dates;
}

export function formatPriceVND(n) {
  return n.toLocaleString('vi-VN') + 'đ';
}
