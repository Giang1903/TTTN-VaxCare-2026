/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StaffTopbar from '../../components/staff/StaffTopbar';
import useStaffToast from '../../hooks/useStaffToast';
import { useAuth } from '../../context/AuthContext';
import * as staffService from '../../services/staffService';

export default function StaffVaccinationPage() {
  const [searchParams] = useSearchParams();
  const { toast, showToast } = useStaffToast();
  const { user } = useAuth();
  const facilityId = user?.facilityId;

  const [queue, setQueue] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batches, setBatches] = useState([]);
  const [doneIds, setDoneIds] = useState(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [lastDetailId, setLastDetailId] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [result, setResult] = useState('SUCCESS');
  const [reaction, setReaction] = useState('NONE');
  const [staffNote, setStaffNote] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const toLocalDateString = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const mapQueueItem = (a) => {
    const ui = staffService.mapAppointmentToUi(a);
    return {
      id: ui.id,
      time: ui.time,
      name: ui.name,
      initials: ui.initials,
      age: ui.age || '',
      phone: ui.phone,
      vaccine: ui.vaccine,
      vaccineId: a.vaccineId,
      dose: ui.dose || '',
      doseNum: undefined,
      qr: ui.qr,
      checkedInAt: ui.time,
      batches: [],
      history: [],
      protocolNote: a.note || '',
      userId: a.userId,
      _raw: a,
    };
  };

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      // Ngày theo máy local (VN) — tránh lệch UTC của toISOString()
      const today = toLocalDateString();
      const qid = searchParams.get('id');

      let list =
        (await staffService.searchAppointments({
          date: today,
          status: 'CHECKED_IN',
        })) || [];

      // Vào từ Lịch hẹn với ?id= — nếu không có trong hàng chờ hôm nay thì tìm rộng hơn
      if (qid && !list.some((a) => String(a.appointmentId) === String(qid))) {
        const broader =
          (await staffService.searchAppointments({ status: 'CHECKED_IN' })) || [];
        const found = broader.find((a) => String(a.appointmentId) === String(qid));
        if (found) {
          list = [found, ...list.filter((a) => String(a.appointmentId) !== String(qid))];
        }
      }

      const mapped = list.map(mapQueueItem);
      setQueue(mapped);

      let pick = mapped[0]?.id ?? null;
      if (qid) {
        const found = mapped.find((item) => String(item.id) === String(qid));
        if (found) {
          pick = found.id;
        } else if (mapped.length === 0) {
          showToast('Không tìm thấy lịch đã check-in với mã này trong hàng chờ.', 'warn');
        }
      }
      setCurrentId(pick);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không tải hàng chờ tiêm', 'warn');
      setQueue([]);
      setCurrentId(null);
    } finally {
      setLoading(false);
    }
  }, [searchParams, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQueue();
  }, [loadQueue]);

  // Load batches for current patient's vaccine when facility known
  useEffect(() => {
    const patient = queue.find((p) => p.id === currentId);
    if (!patient || !facilityId || !patient.vaccineId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBatches([]);
      setSelectedBatchId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Chỉ lấy lô còn dùng được; backend order FEFO (HSD tăng dần)
        const list = await staffService.getBatches(facilityId, {
          vaccineId: patient.vaccineId,
          status: 'AVAILABLE',
        });
        if (cancelled) return;
        const mapped = (list || [])
          .map((b) => {
            const stock = b.stockQuantity ?? b.remainingQuantity ?? b.quantity ?? 0;
            let expiring = false;
            if (b.expiryDate) {
              const days = (new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
              expiring = days >= 0 && days <= 90;
            }
            return {
              id: b.batchId || b.id,
              number: b.batchNumber || b.lotNumber || '',
              expiry: b.expiryDate ? String(b.expiryDate).split('-').reverse().join('/') : '',
              importDate: b.importDate ? String(b.importDate).split('-').reverse().join('/') : '',
              stock,
              expiring,
            };
          })
          // Ẩn lô hết hàng khỏi form ghi nhận tiêm
          .filter((b) => b.stock > 0);
        setBatches(mapped);
        setSelectedBatchId(mapped[0]?.id ?? null);
      } catch (err) {
        console.error(err);
        setBatches([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentId, facilityId, queue]);

  // Load real vaccination history for selected patient
  useEffect(() => {
    const patient = queue.find((p) => p.id === currentId);
    if (!patient?.userId) {
      setHistoryItems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const hist = await staffService.getVaccinationHistory(patient.userId);
        if (cancelled) return;
        const details = hist?.details || [];
        setHistoryItems(
          details
            .slice()
            .sort((a, b) => String(b.injectionDate || '').localeCompare(String(a.injectionDate || '')))
            .slice(0, 8)
            .map((d) => ({
              date: d.injectionDate
                ? String(d.injectionDate).split('-').reverse().join('/')
                : '',
              title: d.vaccineName || 'Vắc xin',
              detail: [
                d.doseNumber != null ? `Mũi ${d.doseNumber}` : null,
                d.batchNumber ? `Lô ${d.batchNumber}` : null,
                d.result || null,
                d.facilityName || null,
              ]
                .filter(Boolean)
                .join(' · '),
            }))
        );
      } catch (err) {
        console.error(err);
        if (!cancelled) setHistoryItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentId, queue]);

  const patientRaw = queue.find((p) => p.id === currentId) || null;
  const patient = patientRaw
    ? { ...patientRaw, batches: batches, history: historyItems }
    : {
        id: '',
        time: '',
        name: '—',
        initials: '??',
        age: '',
        phone: '',
        vaccine: '',
        dose: '',
        doseNum: '',
        qr: '',
        checkedInAt: '',
        batches: [],
        history: [],
        protocolNote: 'Chọn bệnh nhân trong hàng chờ để ghi nhận tiêm.',
      };
  const hasPatient = !!patientRaw;
  const certCode = patient
    ? `VXC-CERT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(patient.id).padStart(3, '0')}`
    : '';

  const queueList = useMemo(() => {
    if (!q) return queue;
    const qq = q.toLowerCase();
    return queue.filter(
      (p) =>
        `${p.name} ${p.vaccine} ${p.qr} ${p.phone}`.toLowerCase().includes(qq)
    );
  }, [queue, q]);

  const selectPatient = (id) => {
    setCurrentId(id);
    setResult('SUCCESS');
    setReaction('NONE');
    setStaffNote('');
    setShowSuccess(false);
    setLastDetailId(null);
  };

  const handleSubmit = async () => {
    if (!patient) return;
    try {
      const detail = await staffService.recordVaccination({
        appointmentId: patient.id,
        result,
        note: staffNote || undefined,
      });
      setDoneIds((prev) => new Set(prev).add(patient.id));
      setLastDetailId(detail?.detailId ?? null);
      setSuccessMsg(`Đã ghi nhận tiêm ${patient.vaccine} cho ${patient.name}`);
      setShowSuccess(true);
      showToast(`Đã ghi nhận tiêm cho ${patient.name}`, 'ok');
      // refresh queue (remove completed)
      setQueue((list) => list.filter((p) => p.id !== patient.id));
    } catch (err) {
      showToast(err.message || 'Ghi nhận tiêm thất bại', 'warn');
    }
  };

  const downloadCert = async () => {
    if (!lastDetailId) {
      showToast('Chưa có chứng nhận để tải (chỉ áp dụng sau khi ghi nhận SUCCESS)', 'warn');
      return;
    }
    try {
      await staffService.downloadCertificate(lastDetailId);
      showToast('Đã tải chứng nhận PDF', 'ok');
    } catch (err) {
      showToast(err.message || 'Tải chứng nhận thất bại', 'warn');
    }
  };

  const nextPatient = () => {
    const next = queueList.find((p) => !doneIds.has(p.id) && p.id !== currentId);
    if (next) selectPatient(next.id);
    else showToast('Không còn bệnh nhân trong hàng chờ', 'ok');
  };


  return (
    <>
      <StaffTopbar
        title="Ghi nhận tiêm chủng"
        subtitle="Hàng chờ check-in · Ghi nhận tiêm · Chứng nhận PDF"
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
                      <div className="clabel">Mã chứng nhận</div>
                      <div className="ccode">{certCode}</div>
                      <div className="cmeta">
                      </div>
                    </div>
                  </div>

                  <div className="action-bar">
                    <button type="button" className="btn outline" onClick={() => showToast('Đã hủy phiếu ghi nhận hiện tại', 'warn')}>
                      Hủy
                    </button>
                    <button type="button" className="btn primary" onClick={handleSubmit} disabled={!hasPatient}>
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
                    <button type="button" className="btn outline" onClick={downloadCert}>
                      Tải chứng nhận PDF
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