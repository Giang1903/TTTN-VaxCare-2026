import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyVaccinationHistory } from '../../services/vaccinationService';
import { searchVaccines } from '../../services/vaccineService';
import { getFacilities } from '../../services/facilityService';
import { getAvailableSlots, getMyAppointments } from '../../services/appointmentService';

const DOW_LABELS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysIso(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

function formatVnDate(iso) {
  if (!iso) return '';
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${DOW_LABELS[d.getDay()]} ${dd}/${mm}/${yyyy}`;
}

function formatTimeRange(timeSlot, durationMin = 30) {
  const raw = String(timeSlot || '').slice(0, 5);
  if (!raw || raw.length < 4) return raw || '—';
  const [h, m] = raw.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return raw;
  const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const endDate = new Date(2000, 0, 1, h, m + durationMin);
  const end = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
  return `${start}–${end}`;
}

function isSuccess(result) {
  const r = String(result || 'SUCCESS').toUpperCase();
  return r === 'SUCCESS' || r === 'PARTIAL';
}

function slotTimeKey(s) {
  const t = s?.timeSlot;
  if (t == null) return '';
  return String(t).slice(0, 5);
}

function isSlotOpen(s) {
  if (!s) return false;
  if (s.full) return false;
  if (s.availableCount != null && Number(s.availableCount) <= 0) return false;
  return true;
}

/**
 * Chọn vắc xin cần đề xuất:
 * 1) Ưu tiên phác đồ chưa đủ mũi (đã có SUCCESS, còn thiếu)
 * 2) Bỏ qua nếu đã có lịch PENDING/CONFIRMED/CHECKED_IN
 * 3) Nếu không còn phác đồ dở → gợi ý vắc xin phổ biến chưa từng tiêm
 */
function pickTargetVaccine(historyDetails, vaccines, upcomingAppts) {
  const catalog = Array.isArray(vaccines) ? vaccines : [];
  const byId = new Map();
  for (const v of catalog) {
    const id = v.vaccineId ?? v.id;
    if (id == null) continue;
    byId.set(Number(id), v);
  }

  const bookedVaccineIds = new Set();
  for (const a of upcomingAppts || []) {
    const st = String(a.status || '').toUpperCase();
    if (!['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(st)) continue;
    if (a.vaccineId != null) bookedVaccineIds.add(Number(a.vaccineId));
  }

  const progress = new Map(); // vaccineId -> { doses, lastDate, required, name, interval }
  for (const d of historyDetails || []) {
    if (!isSuccess(d.result)) continue;
    const vid = d.vaccineId != null ? Number(d.vaccineId) : null;
    if (vid == null) continue;
    const cat = byId.get(vid);
    const required =
      Number(d.requiredDoses) ||
      Number(cat?.requiredDoses ?? cat?.required_doses) ||
      1;
    const interval =
      Number(cat?.doseIntervalDays ?? cat?.dose_interval_days) || 0;
    if (!progress.has(vid)) {
      progress.set(vid, {
        vaccineId: vid,
        name: d.vaccineName || cat?.vaccineName || 'Vắc xin',
        doses: 0,
        lastDate: null,
        required,
        interval,
      });
    }
    const row = progress.get(vid);
    row.doses += 1;
    row.required = Math.max(row.required, required);
    const iso = d.injectionDate ? String(d.injectionDate).slice(0, 10) : null;
    if (iso && (!row.lastDate || iso > row.lastDate)) row.lastDate = iso;
    if (cat) {
      row.name = cat.vaccineName || row.name;
      const iv = Number(cat.doseIntervalDays ?? cat.dose_interval_days) || 0;
      if (iv > 0) row.interval = iv;
    }
  }

  // Phác đồ chưa hoàn thành, chưa đặt lịch
  const incomplete = [...progress.values()]
    .filter((p) => p.doses < p.required && !bookedVaccineIds.has(p.vaccineId))
    .map((p) => {
      const nextDose = p.doses + 1;
      let earliest = toIsoDate(new Date());
      if (p.lastDate && p.interval > 0) {
        const suggested = addDaysIso(p.lastDate, p.interval);
        if (suggested && suggested > earliest) earliest = suggested;
      }
      return { ...p, nextDose, earliest };
    })
    .sort((a, b) => String(a.earliest).localeCompare(String(b.earliest)));

  if (incomplete.length) return incomplete[0];

  // Chưa có mũi nào / đã xong hết → gợi ý vắc xin chưa tiêm
  const neverTried = catalog.find((v) => {
    const id = Number(v.vaccineId ?? v.id);
    if (Number.isNaN(id)) return false;
    if (bookedVaccineIds.has(id)) return false;
    if (progress.has(id)) return false;
    return true;
  });
  if (neverTried) {
    const id = Number(neverTried.vaccineId);
    return {
      vaccineId: id,
      name: neverTried.vaccineName || 'Vắc xin',
      doses: 0,
      nextDose: 1,
      required: Number(neverTried.requiredDoses ?? neverTried.required_doses) || 1,
      interval: Number(neverTried.doseIntervalDays ?? neverTried.dose_interval_days) || 0,
      earliest: toIsoDate(new Date()),
      isNew: true,
    };
  }

  return null;
}

async function findBestSlot(facilityId, fromIso, maxDays = 10) {
  const start = new Date(`${fromIso}T00:00:00`);
  if (Number.isNaN(start.getTime())) start.setTime(Date.now());
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) start.setTime(today.getTime());

  for (let i = 0; i < maxDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    // Bỏ qua chủ nhật nếu muốn — giữ cả tuần để linh hoạt
    const iso = toIsoDate(d);
    // eslint-disable-next-line no-useless-assignment
    let slots = [];
    try {
      slots = await getAvailableSlots(facilityId, iso);
    } catch {
      continue;
    }
    const list = Array.isArray(slots) ? slots.filter(isSlotOpen) : [];
    if (!list.length) continue;

    const aiSlots = list
      .filter((s) => s.aiRecommended)
      .sort((a, b) => (a.aiEstimatedWaitMinutes ?? 999) - (b.aiEstimatedWaitMinutes ?? 999));
    const pick = aiSlots[0] || list[0];
    if (!pick) continue;

    return {
      dateIso: iso,
      timeSlot: slotTimeKey(pick),
      aiRecommended: !!pick.aiRecommended,
      waitMinutes: pick.aiEstimatedWaitMinutes ?? null,
      overload: pick.aiOverloadProbability ?? null,
    };
  }
  return null;
}

export default function AISuggestion() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      setSuggestion(null);
      try {
        const [history, vaccines, appts] = await Promise.all([
          getMyVaccinationHistory().catch(() => null),
          searchVaccines({}).catch(() => []),
          getMyAppointments().catch(() => []),
        ]);
        if (cancelled) return;

        const details = history?.details || history?.detailList || [];
        const target = pickTargetVaccine(details, vaccines || [], appts || []);
        if (!target) {
          setSuggestion(null);
          return;
        }

        const facilities = await getFacilities(target.vaccineId).catch(() => []);
        if (cancelled) return;
        const facList = Array.isArray(facilities) ? facilities : [];
        if (!facList.length) {
          setSuggestion({
            kind: 'no-facility',
            vaccineName: target.name,
            nextDose: target.nextDose,
            message: `Bạn nên tiêm ${target.name} – Mũi ${target.nextDose}, nhưng hiện chưa có cơ sở còn loại vắc xin này.`,
          });
          return;
        }

        // Thử tối đa 2 cơ sở
        const tryFacilities = facList.slice(0, 2);
        let best = null;
        let chosenFac = null;
        for (const f of tryFacilities) {
          const slot = await findBestSlot(f.facilityId, target.earliest || toIsoDate(new Date()), 10);
          if (cancelled) return;
          if (slot) {
            best = slot;
            chosenFac = f;
            break;
          }
        }

        if (!best || !chosenFac) {
          setSuggestion({
            kind: 'no-slot',
            vaccineId: target.vaccineId,
            vaccineName: target.name,
            nextDose: target.nextDose,
            facilityId: facList[0].facilityId,
            facilityName: facList[0].facilityName,
            message: `Đề xuất tiêm ${target.name} – Mũi ${target.nextDose} tại ${facList[0].facilityName}. Hiện chưa tìm thấy khung giờ trống gần đây — bạn có thể chọn ngày khác khi đặt lịch.`,
          });
          return;
        }

        setSuggestion({
          kind: 'ok',
          vaccineId: target.vaccineId,
          vaccineName: target.name,
          nextDose: target.nextDose,
          facilityId: chosenFac.facilityId,
          facilityName: chosenFac.facilityName,
          dateIso: best.dateIso,
          timeSlot: best.timeSlot,
          aiRecommended: best.aiRecommended,
          waitMinutes: best.waitMinutes,
          isNew: !!target.isNew,
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không tải được đề xuất AI');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="ai-suggest">
        <div className="ai-suggest-head">
          <span className="ai-badge">AI GỢI Ý</span>
          <h3>Đang phân tích lịch tiêm phù hợp…</h3>
        </div>
        <p style={{ color: 'var(--gray-500)', margin: 0 }}>
          Dựa trên hồ sơ tiêm chủng, khoảng cách mũi và khung giờ còn chỗ tại các cơ sở.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-suggest">
        <div className="ai-suggest-head">
          <span className="ai-badge">AI GỢI Ý</span>
          <h3>Tạm thời chưa có đề xuất</h3>
        </div>
        <p style={{ marginBottom: 12 }}>{error}</p>
        <Link to="/booking" className="btn btn-primary">
          Đặt lịch thủ công
        </Link>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="ai-suggest">
        <div className="ai-suggest-head">
          <span className="ai-badge">AI GỢI Ý</span>
          <h3>Bạn đang theo kịp lịch tiêm</h3>
        </div>
        <p style={{ marginBottom: 12 }}>
          Không còn phác đồ cần đặt mũi tiếp theo, hoặc lịch sắp tới đã được xếp. Bạn vẫn có thể đặt thêm vắc xin
          khác khi cần.
        </p>
        <Link to="/booking" className="btn btn-primary">
          Đặt lịch tiêm
        </Link>
      </div>
    );
  }

  if (suggestion.kind === 'no-facility') {
    return (
      <div className="ai-suggest">
        <div className="ai-suggest-head">
          <span className="ai-badge">AI GỢI Ý</span>
          <h3>Đề xuất lịch tiêm phù hợp cho bạn</h3>
        </div>
        <p style={{ marginBottom: 12 }}>{suggestion.message}</p>
        <Link to="/booking" className="btn btn-primary">
          Xem danh sách vắc xin
        </Link>
      </div>
    );
  }

  if (suggestion.kind === 'no-slot') {
    const qs = new URLSearchParams({
      vaccineId: String(suggestion.vaccineId),
      facilityId: String(suggestion.facilityId),
    });
    return (
      <div className="ai-suggest">
        <div className="ai-suggest-head">
          <span className="ai-badge">AI GỢI Ý</span>
          <h3>Đề xuất lịch tiêm phù hợp cho bạn</h3>
        </div>
        <p style={{ marginBottom: 12 }}>{suggestion.message}</p>
        <Link to={`/booking?${qs}`} className="btn btn-primary">
          Đặt theo đề xuất AI
        </Link>
      </div>
    );
  }

  const timeLabel = formatTimeRange(suggestion.timeSlot);
  const dateLabel = formatVnDate(suggestion.dateIso);
  const waitHint =
    suggestion.waitMinutes != null
      ? ` Thời gian chờ dự kiến khoảng ${suggestion.waitMinutes} phút.`
      : suggestion.aiRecommended
        ? ' Xác suất còn chỗ cao, thời gian chờ dự kiến thấp.'
        : ' Khung giờ còn chỗ trống.';

  const qs = new URLSearchParams({
    vaccineId: String(suggestion.vaccineId),
    facilityId: String(suggestion.facilityId),
    date: suggestion.dateIso,
    time: suggestion.timeSlot,
  });

  return (
    <div className="ai-suggest">
      <div className="ai-suggest-head">
        <span className="ai-badge">AI GỢI Ý</span>
        <h3>Đề xuất lịch tiêm phù hợp cho bạn</h3>
      </div>
      <p>
        Dựa trên hồ sơ tiêm chủng
        {suggestion.isNew ? ' và danh mục vắc xin' : ' (mũi còn thiếu trong phác đồ)'}
        {' '}cùng sức tải cơ sở, VaxCare đề xuất tiêm{' '}
        <strong>
          {suggestion.vaccineName} – Mũi {suggestion.nextDose}
        </strong>{' '}
        vào khung <strong>{timeLabel}, {dateLabel}</strong> tại{' '}
        <strong>{suggestion.facilityName}</strong>.
        {waitHint}
      </p>
      <Link to={`/booking?${qs.toString()}`} className="btn btn-primary">
        Đặt theo đề xuất AI
      </Link>
    </div>
  );
}