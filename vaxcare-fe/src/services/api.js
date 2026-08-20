const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let body;

  try {
    body = await res.json();
  } catch {
    body = {
      message: "Không thể kết nối đến server",
    };
  }

  if (!res.ok) {
    const msg = body?.message || body?.error || `Lỗi ${res.status}`;

    throw new Error(msg);
  }

  return body;
}
