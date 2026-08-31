import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchVaccines } from "../../services/vaccineService";
import { getFacilities } from "../../services/facilityService";
import { getAvailableSlots } from "../../services/appointmentService";

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function addDaysISO(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function displayTime(t) {
  if (!t) return "—";
  return String(t).slice(0, 5);
}

export default function QuickBooking() {
  const navigate = useNavigate();
  const [vaccines, setVaccines] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [vaccineId, setVaccineId] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const minDate = todayISO();
  const maxDate = addDaysISO(30);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [vax, facs] = await Promise.all([searchVaccines({}), getFacilities()]);
        if (cancelled) return;
        const vList = Array.isArray(vax) ? vax : vax?.data || [];
        const fList = Array.isArray(facs) ? facs : facs?.data || [];
        setVaccines(vList);
        setFacilities(fList);
        if (vList[0]) setVaccineId(String(vList[0].vaccineId ?? vList[0].id));
        if (fList[0]) setFacilityId(String(fList[0].facilityId ?? fList[0].id));
      } catch (e) {
        if (!cancelled) setError(e.message || "Không tải được danh mục");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSearch(e) {
    e?.preventDefault?.();
    setError("");
    setSlots([]);
    setSearched(false);
    if (!facilityId || !date) {
      setError("Vui lòng chọn cơ sở và ngày");
      return;
    }
    setLoading(true);
    try {
      const data = await getAvailableSlots(facilityId, date);
      const list = Array.isArray(data) ? [...data] : data?.data || [];

      // Tất cả khung giờ; AI lên trước, rồi theo xác suất quá tải
      list.sort((a, b) => {
        const ar = a.aiRecommended ? 0 : 1;
        const br = b.aiRecommended ? 0 : 1;
        if (ar !== br) return ar - br;
        return (a.aiOverloadProbability ?? 1) - (b.aiOverloadProbability ?? 1);
      });

      setSlots(list);
      setSearched(true);
      if (!list.length) setError("Không còn khung giờ trống ngày này");
    } catch (err) {
      setSlots([]);
      setError(err.message || "Không tải được khung giờ (kiểm tra backend / AI)");
    } finally {
      setLoading(false);
    }
  }

  function goBooking(slotTime) {
    const params = new URLSearchParams({
      vaccineId: String(vaccineId),
      facilityId: String(facilityId),
      date,
    });
    if (slotTime) params.set("slot", displayTime(slotTime));
    navigate(`/booking?${params.toString()}`);
  }

  const openSlots = slots.filter(
    (s) => s.remainingCapacity == null || s.remainingCapacity > 0
  );

  return (
    <div className="wrap quick-booking-wrap">
      <div className="quick-booking">
        <div className="qb-top">
          <h3>Tìm lịch tiêm phù hợp</h3>
          <div className="qb-note">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            AI sẽ hỗ trợ phân tích lịch và đề xuất khung giờ phù hợp
          </div>
        </div>

        <form className="qb-grid" onSubmit={handleSearch}>
          <div className="field">
            <label>Vắc xin</label>
            <select
              className="field-input"
              value={vaccineId}
              onChange={(e) => setVaccineId(e.target.value)}
            >
              {vaccines.length === 0 && <option value="">Chọn vắc xin</option>}
              {vaccines.map((v) => {
                const id = v.vaccineId ?? v.id;
                return (
                  <option key={id} value={id}>
                    {v.vaccineName || v.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="field">
            <label>Cơ sở</label>
            <select
              className="field-input"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
            >
              {facilities.length === 0 && <option value="">Chọn cơ sở</option>}
              {facilities.map((f) => {
                const id = f.facilityId ?? f.id;
                return (
                  <option key={id} value={id}>
                    {f.facilityName || f.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="field">
            <label>Ngày</label>
            <input
              type="date"
              className="field-input"
              value={date}
              min={minDate}
              max={maxDate}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary qb-submit" disabled={loading}>
            {loading ? "Đang tìm..." : "Tìm lịch"}
          </button>
        </form>

        {error ? (
          <div className="qb-note" style={{ marginTop: 12, color: "#dc2626" }}>
            {error}
          </div>
        ) : null}

        {searched && openSlots.length > 0 ? (
          <div style={{ marginTop: 16 }}>
            <div className="qb-note" style={{ marginBottom: 8 }}>
              Tất cả khung giờ AI gợi ý
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {openSlots.map((s) => {
                const t = displayTime(s.timeSlot);
                const isAi = !!s.aiRecommended;
                const wait =
                  s.aiEstimatedWaitMinutes != null
                    ? ` · ~${s.aiEstimatedWaitMinutes}p`
                    : "";
                const left =
                  s.remainingCapacity != null ? ` · còn ${s.remainingCapacity}` : "";
                return (
                  <button
                    key={t}
                    type="button"
                    className="btn btn-primary qb-submit"
                    onClick={() => goBooking(s.timeSlot)}
                    style={
                      isAi
                        ? undefined
                        : {
                            background: "#fff",
                            color: "inherit",
                            border: "1px solid #cbd5e1",
                          }
                    }
                    title={isAi ? "AI đề xuất" : "Khung giờ còn chỗ"}
                  >
                    {t}
                    {wait}
                    {left}
                  </button>
                );
              })}
            </div>
            <p style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
              Chọn một giờ để sang trang đặt lịch, hoặc{" "}
              <Link to="/booking">đặt lịch đầy đủ</Link>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}