import { request } from "./api";

export const authService = {
  register: (payload) =>
    request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => request("/api/v1/auth/me"),

  refresh: (refreshToken) =>
    request("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};