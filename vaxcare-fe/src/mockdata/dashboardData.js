export const dashStats = [
  { color: 'blue', num: '1', label: 'Lịch sắp tới' },
  { color: 'green', num: '12', label: 'Mũi đã tiêm' },
  { color: 'orange', num: '15/09', label: 'Mũi tiếp theo' },
];

export const upcomingAppointments = [
  {
    day: '15',
    month: 'Th9',
    title: 'HPV – Mũi 2',
    lines: ['VaxCare Trung Mỹ Tây · 08:30–09:00', 'Số 8 Nguyễn Thị Trên, P. Trung Mỹ Tây'],
    badge: { text: 'Sắp tới · Còn 30 ngày', type: 'upcoming' },
    actions: { detailTo: '/appointments', cancelable: true },
  },
  {
    day: '22',
    month: 'Th10',
    dateStyle: { background: '#fff4e6' },
    dayStyle: { color: '#e67e22' },
    monthStyle: { color: '#d35400' },
    title: 'Cúm mùa 2026',
    lines: ['Đề xuất AI · Chưa đặt lịch', 'Nên tiêm trước mùa cúm'],
    badge: { text: 'Nhắc tiêm', type: 'reminder' },
    actions: { bookTo: '/booking' },
  },
];

export const recentRecords = [
  { title: 'HPV – Mũi 1', sub: 'VaxCare Quận 1 · Lô A12345', date: '12/03/2026' },
  { title: 'Cúm mùa 2025', sub: 'VaxCare Bình Thạnh · Lô B7788', date: '05/11/2025' },
  { title: 'Viêm gan B – Mũi 3', sub: 'VaxCare Gò Vấp · Lô C9021', date: '18/08/2025' },
  { title: 'Sởi – Quai bị – Rubella', sub: 'VaxCare Quận 7 · Lô D4412', date: '02/06/2025' },
];
