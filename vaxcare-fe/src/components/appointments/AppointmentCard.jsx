import { useState } from "react";
import { Link } from "react-router-dom";
import QrCodeModal from "./QrCodeModal";
import PaymentModal from "./PaymentModal";

export default function AppointmentCard({ appt, onCancel, cancellingId }) {
  const isCancelling = cancellingId === appt.appointmentId;
  const [qrOpen, setQrOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const raw = String(appt.rawStatus || "").toUpperCase();
  const showPay =
    appt.status === "upcoming" && (raw === "PENDING" || raw === "CONFIRMED");

  function handleCancel() {
    if (!appt.appointmentId) return;
    if (!confirm("Bạn chắc chắn muốn hủy lịch tiêm này?")) return;
    onCancel?.(appt.appointmentId);
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
          <h3
            style={{ fontSize: "17px", fontWeight: 700, marginBottom: "6px" }}
          >
            {appt.title}
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "var(--gray-500)",
              marginBottom: "4px",
            }}
          >
            {appt.line1}
          </p>
          {appt.line2 && (
            <p style={{ fontSize: "13px", color: "var(--gray-500)" }}>
              {appt.line2}
            </p>
          )}
          <p style={{ fontSize: "13px", marginTop: "8px" }}>
            <span className={`status-pill ${appt.status}`}>
              {appt.statusLabel}
            </span>
            {appt.displayCode && (
              <>
                {" "}
                · Mã lịch: <strong>{appt.displayCode}</strong>
              </>
            )}
          </p>
        </div>

        {appt.status === "upcoming" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setQrOpen(true)}
              disabled={!appt.appointmentId}
            >
              Mã QR
            </button>
            {showPay && (
              <button
                type="button"
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--teal-600)",
                }}
                onClick={() => setPayOpen(true)}
              >
                {raw === "PENDING" ? "Thanh toán" : "Hóa đơn / TT"}
              </button>
            )}
            <Link
              to="/booking"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--teal-600)",
              }}
            >
              Đổi lịch
            </Link>
            <button
              type="button"
              style={{ fontSize: "13px", color: "var(--gray-500)" }}
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Đang hủy…" : "Hủy lịch"}
            </button>
          </div>
        )}

        {appt.status === "completed" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            <Link to="/record" className="btn btn-primary btn-sm">
              Xem chứng nhận
            </Link>
            <button
              type="button"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--teal-600)",
              }}
              onClick={() => setPayOpen(true)}
            >
              Xem hóa đơn
            </button>
            <Link
              to="/reactions"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--teal-600)",
              }}
            >
              Báo phản ứng
            </Link>
          </div>
        )}

        {appt.status === "cancelled" && (
          <div>
            <Link
              to="/booking"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--teal-600)",
              }}
            >
              Đặt lại
            </Link>
          </div>
        )}
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
    </>
  );
}