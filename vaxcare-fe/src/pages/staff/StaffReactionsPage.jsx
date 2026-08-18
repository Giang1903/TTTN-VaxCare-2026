import { useMemo, useState } from 'react';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';

const INITIAL = {
  1: {
    av: 'LT',
    name: 'Lê Thị Thu',
    meta: '3 tuổi · Nữ · Phụ huynh: 0912345678',
    sev: 'moderate',
    sevLabel: 'Trung bình',
    proc: 'pending',
    procLabel: 'Chờ xử lý',
    vax: 'MMR · Mũi 1/2',
    inj: '17/08/2026 08:30',
    batch: 'MMR-2026-01',
    report: '17/08/2026 18:20',
    symptoms:
      'Phát ban nhẹ quanh vị trí tiêm, sốt 38.2°C. Phụ huynh lo lắng, hỏi có cần đưa đi cấp cứu không.',
    note: 'Khuyến nghị hạ sốt bằng paracetamol liều theo cân nặng, theo dõi phát ban. Hẹn gọi lại sau 12 giờ nếu sốt >39°C hoặc phát ban lan rộng.',
    severity: 'MODERATE',
    status: 'PENDING',
    f: 'pending moderate',
  },
  2: {
    av: 'NA',
    name: 'Nguyễn An',
    meta: '28 tuổi · Nam · 0901234567',
    sev: 'mild',
    sevLabel: 'Nhẹ',
    proc: 'pending',
    procLabel: 'Chờ xử lý',
    vax: 'Viêm gan B · Mũi 2/3',
    inj: '17/08/2026 08:00',
    batch: 'HBV-2026-A1',
    report: '17/08/2026 14:05',
    symptoms: 'Sốt nhẹ 37.8°C, sưng đau tại chỗ tiêm.',
    note: '',
    severity: 'MILD',
    status: 'PENDING',
    f: 'pending mild',
  },
  3: {
    av: 'PH',
    name: 'Phạm Gia Huy',
    meta: '8 tháng · Nam · Phụ huynh: 0987654321',
    sev: 'mild',
    sevLabel: 'Nhẹ',
    proc: 'contacted',
    procLabel: 'Đã liên hệ',
    vax: 'DTaP · Mũi 3/5',
    inj: '17/08/2026 09:15',
    batch: 'DTAP-2026-01',
    report: '17/08/2026 20:10',
    symptoms: 'Khóc nhiều, quấy về đêm — đã tư vấn phụ huynh qua điện thoại.',
    note: 'Đã gọi lúc 20:30. Hướng dẫn theo dõi nhiệt độ, bú bình thường. Gọi lại nếu bỏ bú / sốt cao.',
    severity: 'MILD',
    status: 'CONTACTED',
    f: 'contacted mild',
  },
  4: {
    av: 'TV',
    name: 'Trần Văn Khoa',
    meta: '15 tuổi · Nam · 0933111222',
    sev: 'none',
    sevLabel: 'Không có',
    proc: 'resolved',
    procLabel: 'Đã giải quyết',
    vax: 'IPV · Mũi 2/4',
    inj: '16/08/2026 09:45',
    batch: 'IPV-2026-X1',
    report: '17/08/2026 09:00',
    symptoms: 'Không triệu chứng bất thường sau 24h.',
    note: 'Tự báo qua app — đóng case.',
    severity: 'NONE',
    status: 'RESOLVED',
    f: 'resolved none',
  },
  5: {
    av: 'HN',
    name: 'Hoàng Ngọc Mai',
    meta: '16 tuổi · Nữ · 0909888777',
    sev: 'mild',
    sevLabel: 'Nhẹ',
    proc: 'resolved',
    procLabel: 'Đã giải quyết',
    vax: 'HPV · Mũi 1/2',
    inj: '15/08/2026 10:30',
    batch: 'HPV-2026-G9A',
    report: '16/08/2026 08:00',
    symptoms: 'Đau cánh tay 1 ngày — tự khỏi.',
    note: 'Đã xác nhận ổn định sau 48h.',
    severity: 'MILD',
    status: 'RESOLVED',
    f: 'resolved mild',
  },
};

const SEV_MAP = {
  NONE: ['none', 'Không có'],
  MILD: ['mild', 'Nhẹ'],
  MODERATE: ['moderate', 'Trung bình'],
  SEVERE: ['severe', 'Nặng'],
};
const ST_MAP = {
  PENDING: ['pending', 'Chờ xử lý'],
  REVIEWED: ['reviewed', 'Đã xem xét'],
  CONTACTED: ['contacted', 'Đã liên hệ'],
  RESOLVED: ['resolved', 'Đã giải quyết'],
};

export default function StaffReactionsPage() {
  const { toast, showToast } = useStaffToast();
  const [data, setData] = useState(INITIAL);
  const [activeId, setActiveId] = useState('1');
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [severity, setSeverity] = useState(INITIAL[1].severity);
  const [status, setStatus] = useState(INITIAL[1].status);
  const [note, setNote] = useState(INITIAL[1].note);

  const load = (id) => {
    const d = data[id];
    if (!d) return;
    setActiveId(String(id));
    setSeverity(d.severity);
    setStatus(d.status);
    setNote(d.note || '');
  };

  const applyForm = (id, nextSeverity, nextStatus, nextNote) => {
    const [sev, sevLabel] = SEV_MAP[nextSeverity] || ['mild', 'Nhẹ'];
    const [proc, procLabel] = ST_MAP[nextStatus] || ['pending', 'Chờ xử lý'];
    setData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        severity: nextSeverity,
        status: nextStatus,
        sev,
        sevLabel,
        proc,
        procLabel,
        note: nextNote,
        f: `${proc} ${sev}`,
      },
    }));
  };

  const filteredIds = useMemo(() => {
    return Object.keys(data).filter((id) => {
      const d = data[id];
      if (tab === 'moderate') {
        if (!(d.f.includes('moderate') || d.f.includes('severe'))) return false;
      } else if (tab !== 'all' && !d.f.includes(tab)) return false;
      if (q && !`${d.name} ${d.symptoms} ${d.vax}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, tab, q]);

  const d = data[activeId];

  return (
    <>
      <StaffTopbar
        title="Theo dõi sau tiêm"
        subtitle="Phản ứng · Liên hệ · Xử lý"
        searchPlaceholder="Tìm theo tên, triệu chứng..."
        searchValue={q}
        onSearchChange={setQ}
      />

      <div className="staff-content">
        <section className="kpi-row cols-4">
          <div className="kpi c1">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </span>
            </div>
            <div className="num">2</div>
            <div className="lbl">Chờ xử lý</div>
          </div>
          <div className="kpi c2">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </span>
            </div>
            <div className="num">1</div>
            <div className="lbl">Mức trung bình / nặng</div>
          </div>
          <div className="kpi c3">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.1 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
            </div>
            <div className="num">3</div>
            <div className="lbl">Đã liên hệ hôm nay</div>
          </div>
          <div className="kpi c4">
            <div className="top">
              <span className="ic">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            </div>
            <div className="num">11</div>
            <div className="lbl">Đã giải quyết (7 ngày)</div>
          </div>
        </section>

        <div className="toolbar">
          <div className="seg-tabs">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'pending', label: 'Chờ xử lý' },
              { key: 'contacted', label: 'Đã liên hệ' },
              { key: 'resolved', label: 'Đã giải quyết' },
              { key: 'moderate', label: 'Trung bình+' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={tab === t.key ? 'active' : ''}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="layout-2">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Phản hồi sau tiêm</h3>
                <div className="sub">post_vaccination_reactions · Cập nhật realtime</div>
              </div>
            </div>
            <div className="rx-list">
              {filteredIds.map((id) => {
                const item = data[id];
                return (
                  <div
                    key={id}
                    className={`rx-card${activeId === id ? ' active' : ''}`}
                    onClick={() => load(id)}
                  >
                    <div className="av">{item.av}</div>
                    <div>
                      <div className="name">
                        {item.name}
                        <span className={`sev ${item.sev}`}>{item.sevLabel}</span>
                        <span className={`proc ${item.proc}`}>{item.procLabel}</span>
                      </div>
                      <div className="meta">
                        {item.vax} · Tiêm {item.inj}
                      </div>
                      <div className="symptoms">{item.symptoms}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {d && (
            <div className="panel detail-panel">
              <div className="detail-head">
                <div className="av">{d.av}</div>
                <div>
                  <div className="n">{d.name}</div>
                  <div className="m">{d.meta}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className={`sev ${d.sev}`}>{d.sevLabel}</span>
                    <span className={`proc ${d.proc}`}>{d.procLabel}</span>
                  </div>
                </div>
              </div>
              <div className="detail-body">
                <div className="section-title">Thông tin tiêm</div>
                <div className="detail-row">
                  <span className="lbl">Vắc xin</span>
                  <span className="val">{d.vax}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Ngày tiêm</span>
                  <span className="val">{d.inj}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Lô vắc xin</span>
                  <span className="val">{d.batch}</span>
                </div>
                <div className="detail-row">
                  <span className="lbl">Thời điểm báo cáo</span>
                  <span className="val">{d.report}</span>
                </div>

                <div className="section-title">Triệu chứng</div>
                <p style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 4 }}>{d.symptoms}</p>

                <div className="section-title">Xử lý</div>
                <div className="field">
                  <label>Mức độ (cập nhật)</label>
                  <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option value="NONE">Không có</option>
                    <option value="MILD">Nhẹ</option>
                    <option value="MODERATE">Trung bình</option>
                    <option value="SEVERE">Nặng</option>
                  </select>
                </div>
                <div className="field">
                  <label>Trạng thái xử lý</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="REVIEWED">Đã xem xét</option>
                    <option value="CONTACTED">Đã liên hệ</option>
                    <option value="RESOLVED">Đã giải quyết</option>
                  </select>
                </div>
                <div className="field">
                  <label>Ghi chú nhân viên</label>
                  <textarea
                    className="note-box"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nội dung tư vấn, hướng dẫn, kết quả liên hệ..."
                  />
                </div>
              </div>
              <div className="detail-foot">
                <button type="button" className="btn outline" onClick={() => showToast('Đang gọi phụ huynh (demo)…', 'ok')}>
                  Gọi phụ huynh
                </button>
                <button
                  type="button"
                  className="btn warn"
                  onClick={() => {
                    setStatus('CONTACTED');
                    applyForm(activeId, severity, 'CONTACTED', note);
                    showToast('Đã đánh dấu liên hệ', 'ok');
                  }}
                >
                  Đánh dấu đã liên hệ
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    applyForm(activeId, severity, status, note);
                    showToast('Đã lưu xử lý phản ứng sau tiêm', 'ok');
                  }}
                >
                  Lưu xử lý
                </button>
                <button
                  type="button"
                  className="btn ok"
                  onClick={() => {
                    setStatus('RESOLVED');
                    applyForm(activeId, severity, 'RESOLVED', note);
                    showToast('Case đã giải quyết xong', 'ok');
                  }}
                >
                  Giải quyết xong
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`staff-toast${toast.show ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>
        {toast.message}
      </div>
    </>
  );
}
