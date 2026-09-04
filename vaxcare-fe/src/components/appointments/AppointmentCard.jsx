import { useEffect, useState } from "react";
import QrCodeModal from "./QrCodeModal";
import PaymentModal from "./PaymentModal";
import { getAvailableSlots, rescheduleAppointment, cancelAppointment } from "../../services/appointmentService";
// eslint-disable-next-line no-unused-vars
import { formatTime } from "../../utils/format";

export default function AppointmentCard({ appt, onRescheduled }) {
  const [qrOpen, setQrOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const raw = String(appt.rawStatus || "").toUpperCase();
  const canModify =
    appt.status === "upcoming" && (raw === "PENDING" || raw === "CONFIRMED");
  const showPay = canModify && (raw === "PENDING" || raw === "CONFIRMED");

  useEffect(() => {
    if (!rescheduleOpen || !rescheduleDate || !appt.facilityId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSlots([]);
      setSelectedSlot("");
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setError("");
    getAvailableSlots(appt.facilityId, rescheduleDate)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setSlots(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "Không tải được khung giờ");
        setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rescheduleOpen, rescheduleDate, appt.facilityId]);

  function openReschedule() {
    setRescheduleDate(appt.appointmentDate || "");
    setSelectedSlot("");
    setError("");
    setRescheduleOpen(true);
  }

  async function handleRescheduleSubmit() {
    if (!appt.appointmentId) return;
    if (!rescheduleDate || !selectedSlot) {
      setError("Chọn ngày và khung giờ mới");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await rescheduleAppointment(appt.appointmentId, {
        appointmentDate: rescheduleDate,
        timeSlot: selectedSlot,
      });
      setRescheduleOpen(false);
      onRescheduled?.(updated);
    } catch (err) {
      setError(err.message || "Đổi lịch thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelSubmit() {
    if (!appt.appointmentId) return;
    if (raw === "CONFIRMED" && !(cancelReason || "").trim()) {
      setCancelError("Vui lòng nhập lý do hủy. Lịch đã thanh toán sẽ không được hoàn tiền.");
      return;
    }
    setCancelling(true);
    setCancelError("");
    try {
      const updated = await cancelAppointment(appt.appointmentId, cancelReason);
      setCancelModalOpen(false);
      onRescheduled?.(updated);
    } catch (err) {
      setCancelError(err.message || "Hủy lịch hẹn thất bại");
    } finally {
      setCancelling(false);
    }
  }

  function slotLabel(s) {
    const t = s.timeSlot;
    if (!t) return "";
    return typeof t === "string" ? t.slice(0, 5) : String(t).slice(0, 5);
  }

  return (
    <>
      <div className="appt-full-card" data-status={appt.status}>
        <div className="appt-date" style={appt.dateStyle}>
          <div className="d" style={appt.dayStyle}>
            {appt.day}
          </div>
          <div className="m" style={appt.monthStyle}>
            {appt.month}
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "6px" }}>
            {appt.title}
          </h3>
          <p style={{ fontSize: "13px", color: "var(--gray-500)", marginBottom: "8px" }}>
            {appt.meta}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <span className={`status-pill status-${appt.status}`}>{appt.statusLabel}</span>
            {appt.time && (
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--teal-700)" }}>
                {appt.time}
              </span>
            )}
            {appt.facility && (
              <span style={{ fontSize: "13px", color: "var(--gray-600)" }}>{appt.facility}</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
          {canModify && (
            <>
              {raw === "CONFIRMED" && appt.appointmentId && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setQrOpen(true)}
                >
                  Mã QR
                </button>
              )}
              {showPay && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPayOpen(true)}
                >
                  {raw === "PENDING" ? "Thanh toán" : "Hóa đơn / TT"}
                </button>
              )}
              <button
                type="button"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--teal-600)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={openReschedule}
              >
                Đổi ngày/giờ
              </button>
              {(raw === "PENDING" || raw === "CONFIRMED") && (
                <button
                  type="button"
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#ef4444",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setCancelReason(
                      raw === "CONFIRMED"
                        ? ""
                        : "Người dùng chủ động hủy lịch hẹn chưa thanh toán"
                    );
                    setCancelError("");
                    setCancelModalOpen(true);
                  }}
                >
                  Hủy lịch
                </button>
              )}
            </>
          )}

          {appt.status === "completed" && (
            <>
              <a href="/record" className="btn btn-primary btn-sm">
                Xem chứng nhận
              </a>
              <button
                type="button"
                style={{ fontSize: "13px", fontWeight: 600, color: "var(--teal-600)", background: "none", border: "none", cursor: "pointer" }}
                onClick={() => setPayOpen(true)}
              >
                Xem hóa đơn
              </button>
              <a href="/reactions" style={{ fontSize: "13px", fontWeight: 600, color: "var(--teal-600)" }}>
                Báo phản ứng
              </a>
            </>
          )}
        </div>
      </div>

      <QrCodeModal
        open={qrOpen}
        appointmentId={appt.appointmentId}
        title={appt.title}
        onClose={() => setQrOpen(false)}
      />
      <PaymentModal
        open={payOpen}
        appointmentId={appt.appointmentId}
        title={appt.title}
        onClose={() => setPayOpen(false)}
      />

      {rescheduleOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => !saving && setRescheduleOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>Đổi ngày / giờ tiêm</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--gray-500)" }}>
              Chỉ đổi được ngày và khung giờ. Vắc xin và cơ sở giữ nguyên
              {appt.facility ? ` (${appt.facility})` : ""}.
            </p>

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Ngày mới
            </label>
            <input
              type="date"
              value={rescheduleDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => {
                setRescheduleDate(e.target.value);
                setSelectedSlot("");
              }}
              disabled={saving}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                marginBottom: 14,
              }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Khung giờ
            </label>
            {loadingSlots && (
              <p style={{ fontSize: 13, color: "var(--gray-500)" }}>Đang tải khung giờ…</p>
            )}
            {!loadingSlots && rescheduleDate && slots.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--gray-500)" }}>Không có khung giờ trống.</p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {slots
                .filter((s) => !s.full || slotLabel(s) === String(appt.time || "").slice(0, 5))
                .map((s) => {
                  const label = slotLabel(s);
                  const active = selectedSlot === label || selectedSlot === s.timeSlot;
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={saving || (s.full && !active)}
                      onClick={() => setSelectedSlot(label)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: active ? "2px solid var(--teal-600)" : "1px solid #e2e8f0",
                        background: active ? "rgba(13,148,136,0.08)" : "#fff",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                      {s.aiRecommended ? " · AI" : ""}
                    </button>
                  );
                })}
            </div>

            {error && (
              <p className="form-error" style={{ marginBottom: 12 }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={() => setRescheduleOpen(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || !rescheduleDate || !selectedSlot}
                onClick={handleRescheduleSubmit}
              >
                {saving ? "Đang lưu…" : "Xác nhận đổi lịch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => !cancelling && setCancelModalOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 420,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#dc2626" }}>
              Xác nhận hủy lịch hẹn
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--gray-600)", lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn hủy lịch hẹn tiêm <strong>{appt.title}</strong> vào ngày <strong>{appt.appointmentDate}</strong> ({appt.time})?
              <br />
              <span style={{ color: "#d97706", fontWeight: 600, marginTop: "6px", display: "block" }}>
                ⚠️ Khung giờ tiêm này sẽ được trả lại ngay lập tức cho hệ thống để người khác có thể đăng ký.
              </span>
              {raw === "CONFIRMED" && (
                <span style={{ color: "#dc2626", fontWeight: 700, marginTop: "8px", display: "block" }}>
                  Lịch này đã thanh toán. Khi hủy, bạn sẽ KHÔNG được hoàn tiền.
                </span>
              )}
            </p>

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Lý do hủy {raw === "CONFIRMED" ? "(bắt buộc)" : "(không bắt buộc)"}:
            </label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy lịch..."
              disabled={cancelling}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                marginBottom: 14,
                fontSize: 13,
              }}
            />

            {cancelError && (
              <p className="form-error" style={{ marginBottom: 12 }}>
                {cancelError}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={cancelling}
                onClick={() => setCancelModalOpen(false)}
              >
                Giữ lại lịch
              </button>
              <button
                type="button"
                className="btn"
                style={{
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontWeight: 600,
                  cursor: cancelling ? "not-allowed" : "pointer",
                }}
                disabled={cancelling}
                onClick={handleCancelSubmit}
              >
                {cancelling ? "Đang hủy..." : "Hủy lịch & Trả slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}