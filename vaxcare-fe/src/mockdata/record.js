export const profile = {
  name: 'Nguyễn Văn A',
  dob: '15/04/1992',
  dobInput: '1992-04-15',
  city: 'TP. Hồ Chí Minh',
  idNumber: 'CCCD 079•••••123',
  idInput: '079•••••123',
  phone: '0901 234 567',
  recordCode: 'VC-079-1992-NA',
  updatedAt: '12/03/2026',
};

export const profileStats = [
  { n: '12', l: 'Mũi đã tiêm' },
  { n: '1', l: 'Lịch sắp tới' },
  { n: '4', l: 'Phác đồ đang theo' },
  { n: '98%', l: 'Độ đầy đủ hồ sơ' },
];

export const protocols = [
  { key: 'hpv', name: 'HPV', pct: '1/2', width: '50%', sub: 'Mũi 2 dự kiến 15/09/2026 · Còn 1 mũi' },
  { key: 'hepb', name: 'Viêm gan B', pct: '3/3', width: '100%', sub: 'Hoàn thành · Mũi cuối 18/08/2025' },
  { key: 'flu', name: 'Cúm mùa', pct: 'Hàng năm', width: '75%', sub: 'Đã tiêm 2025 · Nên tiêm lại trước mùa 2026' },
  { key: 'mmr', name: 'MMR', pct: '1/1', width: '100%', sub: 'Hoàn thành · 02/06/2025' },
];

export const timeline = [
  {
    pending: true,
    title: 'HPV – Mũi 2',
    tag: { text: 'Sắp tới', type: 'next' },
    lines: ['VaxCare Trung Mỹ Tây · 08:30–09:00', 'Số 8 Nguyễn Thị Trên, P. Trung Mỹ Tây'],
    date: '15/09/2026',
    meta: 'Thứ Hai',
    actions: [
      { label: 'Chi tiết lịch', to: '/appointments' },
      { label: 'Đổi lịch', to: '/facilities' },
    ],
  },
  {
    title: 'HPV – Mũi 1',
    tag: { text: 'Đã tiêm', type: 'done' },
    lines: ['VaxCare Quận 1 · Lô A12345 · BS. Trần Minh'],
    date: '12/03/2026',
    meta: '09:15',
    shot: { name: 'HPV – Mũi 1', date: '12/03/2026', time: '09:15', facility: 'VaxCare Quận 1', lot: 'Lô A12345', doctor: 'BS. Trần Minh', status: 'Đã tiêm' },
  },
  {
    title: 'Cúm mùa 2025',
    tag: { text: 'Đã tiêm', type: 'done' },
    lines: ['VaxCare Bình Thạnh · Lô B7788 · BS. Lê Hương'],
    date: '05/11/2025',
    meta: '14:20',
    shot: { name: 'Cúm mùa 2025', date: '05/11/2025', time: '14:20', facility: 'VaxCare Bình Thạnh', lot: 'Lô B7788', doctor: 'BS. Lê Hương', status: 'Đã tiêm' },
  },
  {
    title: 'Viêm gan B – Mũi 3',
    tag: { text: 'Đã tiêm', type: 'done' },
    lines: ['VaxCare Gò Vấp · Lô C9021 · BS. Phạm An'],
    date: '18/08/2025',
    meta: '10:05',
    shot: { name: 'Viêm gan B – Mũi 3', date: '18/08/2025', time: '10:05', facility: 'VaxCare Gò Vấp', lot: 'Lô C9021', doctor: 'BS. Phạm An', status: 'Đã tiêm' },
  },
  {
    title: 'Sởi – Quai bị – Rubella (MMR)',
    tag: { text: 'Đã tiêm', type: 'done' },
    lines: ['VaxCare Quận 7 · Lô D4412 · BS. Nguyễn Khoa'],
    date: '02/06/2025',
    meta: '08:40',
    shot: { name: 'Sởi – Quai bị – Rubella (MMR)', date: '02/06/2025', time: '08:40', facility: 'VaxCare Quận 7', lot: 'Lô D4412', doctor: 'BS. Nguyễn Khoa', status: 'Đã tiêm' },
  },
  {
    title: 'Viêm gan B – Mũi 2',
    tag: { text: 'Đã tiêm', type: 'done' },
    lines: ['VaxCare Gò Vấp · Lô C8810 · BS. Phạm An'],
    date: '10/02/2025',
    meta: '11:00',
    shot: { name: 'Viêm gan B – Mũi 2', date: '10/02/2025', time: '11:00', facility: 'VaxCare Gò Vấp', lot: 'Lô C8810', doctor: 'BS. Phạm An', status: 'Đã tiêm' },
  },
];

export const recordDetailSummary = [
  { name: 'HPV – Mũi 1', meta: '12/03/2026 · VaxCare Quận 1' },
  { name: 'Cúm mùa 2025', meta: '05/11/2025 · VaxCare Bình Thạnh' },
  { name: 'Viêm gan B – Mũi 3', meta: '18/08/2025 · VaxCare Gò Vấp' },
  { name: 'MMR', meta: '02/06/2025 · VaxCare Quận 7' },
  { name: 'Viêm gan B – Mũi 2', meta: '10/02/2025 · VaxCare Gò Vấp' },
];
