import { apiClient } from "./apiClient";

export function register({ fullName, email, phone, password, address, dateOfBirth, gender }) {
  return apiClient.request("/auth/register", {
    method: "POST",
    auth: false,
    body: { fullName, email, phone, password, address, dateOfBirth, gender },
  });
}

export function login({ email, password }) {
  return apiClient.request("/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
}

export function getCurrentUser() {
  return apiClient.request("/auth/me", { method: "GET" });
}

export function updateProfile(data) {
  return apiClient.request("/auth/profile", { method: "PUT", body: data });
}

export function logout() {
  apiClient.clearTokens();
}

/** GET /auth/verify?token= */
export function verifyEmail(token) {
  return apiClient.request(`/auth/verify?token=${encodeURIComponent(token)}`, {
    method: "GET",
    auth: false,
  });
}

/** POST /auth/resend-verification { email } */
export function resendVerification(email) {
  return apiClient.request("/auth/resend-verification", {
    method: "POST",
    auth: false,
    body: { email },
  });
}