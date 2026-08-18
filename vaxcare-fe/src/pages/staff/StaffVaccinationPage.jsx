import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';

const QUEUE = {
  3: {
    id: 3,
    time: '09:15',
    name: 'Phạm Gia Huy',
    initials: 'PH',
    age: '8 tháng · Nam',
    phone: 'Phụ huynh: 0987654321',
    vaccine: 'DTaP',
    dose: '3/5',
    doseNum: 3,
    qr: 'VXC-20260817-003',
    checkedInAt: '09:08',
    batches: [
      { id: 6, number: 'DTAP-2026-01', expiry: '01/09/2027', importDate: '10/01/2026', stock: 240, expiring: true },
      { id: 7, number: 'DTAP-2026-02', expiry: '01/10/2027', importDate: '01/02/2026', stock: 190 },
    ],
    history: [
      { date: '12/06/2026', title: 'DTaP · Mũi 2/5', detail: 'Lô DTAP-2025-08 · Thành công · Không phản ứng' },
      { date: '15/04/2026', title: 'DTaP · Mũi 1/5', detail: 'Lô DTAP-2025-08 · Thành công · Sưng nhẹ tại chỗ' },
      { date: '10/02/2026', title: 'Viêm gan B · Mũi 3/3', detail: 'Lô HBV-2025-A2 · Thành công' },
    ],
    protocolNote:
      'Mũi 3 — cách mũi 2 tối thiểu 60 ngày. Tiêm bắp (IM). Quan sát tối thiểu 30 phút.',
  },
  4: {
    id: 4,
    time: '09:45',
    name: 'Trần Văn Khoa',
    initials: 'TV',
    age: '15 tuổi · Nam',
    phone: '0933111222',
    vaccine: 'IPV',
    dose: '2/4',
    doseNum: 2,
    qr: 'VXC-20260817-004',
    checkedInAt: '09:40',
    batches: [
      { id: 8, number: 'IPV-2026-X1', expiry: '15/08/2027', importDate: '25/01/2026', stock: 260 },
      { id: 9, number: 'IPV-2026-X2', expiry: '20/09/2027', importDate: '12/02/2026', stock: 210 },
    ],
    history: [{ date: '20/05/2026', title: 'IPV · Mũi 1/4', detail: 'Lô IPV-2025-B1 · Thành công' }],
    protocolNote: 'Mũi 2 — cách mũi 1 tối thiểu 60 ngày. Tiêm bắp hoặc dưới da.',
  },
  11: {
    id: 11,
    time: '10:00',
    name: 'Ngô Bảo Châu',
    initials: 'NC',
    age: '6 tháng · Nữ',
    phone: 'Phụ huynh: 0966777888',
    vaccine: 'Hib',
    dose: '2/3',
    doseNum: 2,
    qr: 'VXC-20260817-011',
    checkedInAt: '09:55',
    batches: [
      { id: 10, number: 'HIB-2026-01', expiry: '20/09/2027', importDate: '18/01/2026', stock: 230 },
      { id: 11, number: 'HIB-2026-02', expiry: '15/10/2027', importDate: '08/02/2026', stock: 180 },
    ],
    history: [{ date: '05/06/2026', title: 'Hib · Mũi 1/3', detail: 'Lô HIB-2025-03 · Thành công' }],
    protocolNote: 'Mũi 2 — cách mũi 1 khoảng 60 ngày. Tiêm bắp.',
  },
  12: {
    id: 12,
    time: '10:15',
    name: 'Lý Thị Hoa',
    initials: 'LH',
    age: '4 tuổi · Nữ',
    phone: 'Phụ huynh: 0911999888',
    vaccine: 'MMR',
    dose: '2/2',
    doseNum: 2,
    qr: 'VXC-20260817-012',
    checkedInAt: '10:10',
    batches: [
      { id: 12, number: 'MMR-2026-01', expiry: '10/10/2027', importDate: '22/01/2026', stock: 320 },
      { id: 13, number: 'MMR-2026-02', expiry: '05/11/2027', importDate: '08/02/2026', stock: 270 },
    ],
    history: [
      { date: '18/03/2026', title: 'MMR · Mũi 1/2', detail: 'Lô MMR-2025-11 · Thành công · Không phản ứng' },
    ],
    protocolNote: 'Mũi 2 — cách mũi 1 tối thiểu 28 ngày. Tiêm dưới da hoặc bắp.',
  },
};

export default function StaffVaccinationPage() {
  const [searchParams] = useSearchParams();
  const { toast, showToast } = useStaffToast();
  const [currentId, setCurrentId] = useState(3);
  const [selectedBatchId, setSelectedBatchId] = useState(6);
  const [doneIds, setDoneIds] = useState(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [result, setResult] = useState('SUCCESS');
  const [reaction, setReaction] = useState('NONE');
  const [staffNote, setStaffNote] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const qid = searchParams.get('id');
    if (qid && QUEUE[qid]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentId(Number(qid));
      setSelectedBatchId(QUEUE[qid].batches[0]?.id);
      setShowSuccess(false);
    }
  }, [searchParams]);

  const patient = QUEUE[currentId];
  const certCode = `VXC-CERT-20260817-${String(currentId).padStart(3, '0')}`;

  const queueList = useMemo(() => {
    return Object.values(QUEUE).filter(
      (p) => !q || `${p.name} ${p.vaccine} ${p.time}`.toLowerCase().includes(q.toLowerCase())
    );
  }, [q]);

  const selectPatient = (id) => {
    setCurrentId(id);
    setSelectedBatchId(QUEUE[id].batches[0]?.id);
    setShowSuccess(false);
    setStaffNote('');
    setReaction('NONE');
    setResult('SUCCESS');
  };

  const handleSubmit = () => {
    if (!selectedBatchId) {
      showToast('Vui lòng chọn lô vắc xin.', 'warn');
      return;
    }
    setDoneIds((prev) => new Set(prev).add(currentId));
    setShowSuccess(true);
    setSuccessMsg(
      `Đã ghi nhận ${patient.vaccine} mũi ${patient.dose} cho ${patient.name}. Tồn kho lô đã trừ 1 liều. Chứng nhận: ${certCode}` +
        (reaction !== 'NONE' ? ' · Đã tạo bản ghi theo dõi sau tiêm.' : '')
    );
    showToast('Ghi nhận tiêm thành công!', 'ok');
  };

  const printCert = () => {
    const w = window.open('', '_blank', 'width=640,height=720');
    if (!w) {
      showToast('Trình duyệt chặn popup. Cho phép để in chứng nhận.', 'warn');
      return;
    }
    w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Chứng nhận tiêm chủng</title>
      <style>body{font-family:system-ui,sans-serif;padding:40px;color:#0e1f1c;max-width:560px;margin:0 auto}
      h1{font-size:20px;margin:0 0 4px}.sub{color:#6b7b79;font-size:13px;margin-bottom:24px}
      .box{border:2px solid #24408c;border-radius:12px;padding:24px;margin-bottom:20px}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef2f2;font-size:14px}
      .row:last-child{border-bottom:none}.lbl{color:#6b7b79}.val{font-weight:700}
      .code{font-family:ui-monospace,monospace;font-size:15px;background:#f2f7ff;padding:10px 14px;border-radius:8px;text-align:center;margin-top:16px}
      .foot{font-size:12px;color:#6b7b79;margin-top:28px;text-align:center}@media print{button{display:none}}</style></head>
      <body><h1>VaxCare — Chứng nhận tiêm chủng</h1>
      <div class="sub">VaxCare Phú Nhuận · 198 Hoàng Văn Thụ, TP.HCM</div>
      <div class="box">
        <div class="row"><span class="lbl">Họ tên</span><span class="val">${patient.name}</span></div>
        <div class="row"><span class="lbl">Vắc xin</span><span class="val">${patient.vaccine} · Mũi ${patient.dose}</span></div>
        <div class="row"><span class="lbl">Ngày tiêm</span><span class="val">17/08/2026</span></div>
        <div class="row"><span class="lbl">Cơ sở</span><span class="val">VaxCare Phú Nhuận</span></div>
        <div class="row"><span class="lbl">Nhân viên</span><span class="val">BS. Trần Minh · STF-PN-001</span></div>
        <div class="code">Mã CN: ${certCode}</div>
      </div>
      <div class="foot">Tài liệu demo giao diện VaxCare<br/>
      <button onclick="window.print()" style="margin-top:16px;padding:10px 20px;border-radius:999px;border:none;background:#5b8ae0;color:#fff;font-weight:700;cursor:pointer">In chứng nhận</button></div>
      </body></html>`);
    w.document.close();
    showToast('Đã mở chứng nhận — bấm In trong cửa sổ mới', 'ok');
  };

  const nextPatient = () => {
    const next = queueList.find((p) => !doneIds.has(p.id) && p.id !== currentId);
    if (next) selectPatient(next.id);
    else showToast('Không còn ca nào trong hàng chờ.', 'warn');
  };

  return (
    <>
      <StaffTopbar
        title="Ghi nhận tiêm chủng"
        subtitle="Hàng chờ check-in · Chọn lô · Xuất chứng nhận"
        searchPlaceholder="Tìm trong hàng chờ..."
        searchValue={q}
        onSearchChange={setQ}
      />

      <div className="staff-content">
        <div className="vax-layout">
          <div>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Hàng chờ đã check-in</h3>
                  <div className="sub">Sẵn sàng ghi nhận tiêm</div>
                </div>
              </div>
              <div className="queue-list">
                {queueList.map((p) => {
                  const done = doneIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`queue-item${currentId === p.id && !done ? ' active' : ''}`}
                      style={done ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
                      onClick={() => !done && selectPatient(p.id)}
                    >
                      <div className="queue-time">{p.time}</div>
                      <div className="queue-who">
                        <div className="name">{p.name}</div>
                        <div className="meta">
                          {p.vaccine} · Mũi {p.dose}
                        </div>
                      </div>
                      <span
                        className="queue-badge"
                        style={
                          done
                            ? { background: 'var(--ok-bg)', color: 'var(--ok-text)' }
                            : undefined
                        }
                      >
                        {done ? 'Đã tiêm' : currentId === p.id ? 'Đang chọn' : 'Chờ'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Phiếu ghi nhận tiêm</h3>
                  <div className="sub">
                    Lịch hẹn #{patient.id} · {patient.qr}
                  </div>
                </div>
              </div>

              {!showSuccess ? (
                <div className="panel-body">
                  <div className="form-section">
                    <h4>
                      <span className="step">1</span> Người được tiêm
                    </h4>
                    <div className="patient-banner">
                      <div className="av">{patient.initials}</div>
                      <div>
                        <div className="n">{patient.name}</div>
                        <div className="m">
                          {patient.age} · {patient.phone}
                        </div>
                        <div className="tags">
                          <span className="chip">
                            {patient.vaccine} · Mũi {patient.dose}
                          </span>
                          <span className="chip ok">Đã check-in {patient.checkedInAt}</span>
                          <span className="chip warn">Cần quan sát 30 phút</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>
                      <span className="step">2</span> Chọn lô vắc xin
                    </h4>
                    <div className="batch-list">
                      {patient.batches.map((b) => (
                        <div
                          key={b.id}
                          className={`batch-card${selectedBatchId === b.id ? ' selected' : ''}`}
                          onClick={() => setSelectedBatchId(b.id)}
                        >
                          <div>
                            <div className="bn">{b.number}</div>
                            <div className="meta">
                              Hạn dùng {b.expiry} · Nhập {b.importDate} · {b.stock} liều
                              {b.expiring ? ' · Ưu tiên FEFO' : ''}
                            </div>
                          </div>
                          <div className="stock">
                            <div className="num">{b.stock}</div>
                            <div className="lbl">còn lại</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>
                      <span className="step">3</span> Kết quả tiêm
                    </h4>
                    <div className="field-grid">
                      <div className="field">
                        <label>Số mũi</label>
                        <input type="text" value={patient.doseNum} readOnly />
                      </div>
                      <div className="field">
                        <label>Kết quả</label>
                        <div className="radio-pills">
                          {[
                            { v: 'SUCCESS', l: 'Thành công' },
                            { v: 'PARTIAL', l: 'Một phần' },
                            { v: 'FAILED', l: 'Không tiêm được' },
                          ].map((o) => (
                            <label
                              key={o.v}
                              className={`radio-pill${result === o.v ? ' checked' : ''}`}
                              onClick={() => setResult(o.v)}
                            >
                              <input type="radio" name="result" checked={result === o.v} readOnly />
                              {o.l}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="field" style={{ marginTop: 12 }}>
                      <label>Phản ứng ngay sau tiêm</label>
                      <select value={reaction} onChange={(e) => setReaction(e.target.value)}>
                        <option value="NONE">Không có</option>
                        <option value="MILD">Nhẹ (sưng/đau)</option>
                        <option value="MODERATE">Trung bình</option>
                        <option value="SEVERE">Nặng — cần xử lý ngay</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Ghi chú nhân viên</label>
                      <textarea
                        value={staffNote}
                        onChange={(e) => setStaffNote(e.target.value)}
                        placeholder="Ghi chú kỹ thuật, vị trí tiêm, phản ứng quan sát..."
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>
                      <span className="step">4</span> Chứng nhận tiêm
                    </h4>
                    <div className="cert-preview">
                      <div className="clabel">Mã chứng nhận (tự sinh)</div>
                      <div className="ccode">{certCode}</div>
                      <div className="cmeta">
                        Sẽ được lưu vào vaccination_details.certificate_code · Gửi kèm thông báo cho người dùng
                      </div>
                    </div>
                  </div>

                  <div className="action-bar">
                    <button type="button" className="btn outline" onClick={() => showToast('Đã hủy phiếu ghi nhận hiện tại', 'warn')}>
                      Hủy
                    </button>
                    <button type="button" className="btn ghost" onClick={() => showToast('Đã lưu nháp phiếu ghi nhận', 'ok')}>
                      Lưu nháp
                    </button>
                    <button type="button" className="btn primary" onClick={handleSubmit}>
                      Xác nhận đã tiêm
                    </button>
                  </div>
                </div>
              ) : (
                <div className="success-banner show">
                  <div className="icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <h3>Ghi nhận tiêm thành công</h3>
                  <p>{successMsg}</p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button type="button" className="btn outline" onClick={printCert}>
                      In chứng nhận
                    </button>
                    <button type="button" className="btn primary" onClick={nextPatient}>
                      Ca tiếp theo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Lịch sử tiêm gần đây</h3>
                  <div className="sub">Của người được chọn</div>
                </div>
              </div>
              <div className="panel-body">
                {patient.history.map((h) => (
                  <div key={h.date + h.title} className="hist-item">
                    <div className="hist-date">{h.date}</div>
                    <div className="hist-body">
                      <div className="t">{h.title}</div>
                      <div className="d">{h.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Hướng dẫn nhanh</h3>
                  <div className="sub">Theo phác đồ {patient.vaccine}</div>
                </div>
              </div>
              <div className="panel-body" style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.55 }}>
                <p style={{ marginBottom: 10 }}>{patient.protocolNote}</p>
                <p style={{ color: 'var(--gray-500)', fontSize: 12.5 }}>
                  Nguồn: phác đồ vaccination_protocols / protocol_details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`staff-toast${toast.show ? ' show' : ''}${toast.type ? ` ${toast.type}` : ''}`}>
        {toast.message}
      </div>
    </>
  );
}
