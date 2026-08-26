import { apiClient } from "./apiClient";

export function getAvailableSlots(facilityId, date) {
  const params = new URLSearchParams({
    facilityId: String(facilityId),
    date: date, // yyyy-MM-dd
  });
  return apiClient.request(`/appointments/available-slots?${params}`, {
    method: "GET",
    auth: false,
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
export function cancelAppointment(id, reason) {
  return apiClient.request(`/appointments/${id}/cancel`, {
    method: "PATCH",
    body: reason ? { reason } : undefined,
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