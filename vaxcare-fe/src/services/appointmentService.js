import { apiClient } from "./apiClient";

export function getAvailableSlots(facilityId, date) {
  const params = new URLSearchParams({
    facilityId: String(facilityId),
    date: date, // yyyy-MM-dd
  });
  // Public endpoint (BE permitAll) — vẫn gửi token nếu đã login để đồng bộ session
  return apiClient.request(`/appointments/available-slots?${params}`, {
    method: "GET",
    auth: true,
  });
}
export function getMyAppointments() {
  return apiClient.request("/appointments", { method: "GET" });
}
export function getAppointmentById(id) {
  return apiClient.request(`/appointments/${id}`, { method: "GET" });
}
export function bookAppointment({ facilityId, vaccineId, appointmentDate, timeSlot, note }) {
  return apiClient.request("/appointments", {
    method: "POST",
    body: {
      facilityId: Number(facilityId),
      vaccineId: Number(vaccineId),
      appointmentDate, // "yyyy-MM-dd"
      timeSlot, // "HH:mm:ss" hoặc "HH:mm"
      note: note || undefined,
    },
  });
}
/** PUT /appointments/{id} — chỉ đổi ngày + khung giờ */
export function rescheduleAppointment(id, { appointmentDate, timeSlot }) {
  const slot = timeSlot && String(timeSlot).length === 5 ? `${timeSlot}:00` : timeSlot;
  return apiClient.request(`/appointments/${id}`, {
    method: "PUT",
    body: {
      appointmentDate, // yyyy-MM-dd
      timeSlot: slot,
    },
  });
}
/** POST /api/v1/payments/create-vnpay — tạo URL thanh toán VNPay */
export function createVnpayPayment(appointmentId) {
  return apiClient.request("/payments/create-vnpay", {
    method: "POST",
    body: { appointmentId: Number(appointmentId) },
  });
}

/** GET /api/v1/payments/appointments/{id} */
export function getPaymentByAppointment(appointmentId) {
  return apiClient.request(`/payments/appointments/${appointmentId}`, {
    method: "GET",
  });
}

/** GET /api/v1/appointments/{id}/qr-code → { qrCodeToken, qrCodeImageBase64 } */
export function getAppointmentQrCode(appointmentId) {
  return apiClient.request(`/appointments/${appointmentId}/qr-code`, { method: "GET" });
}