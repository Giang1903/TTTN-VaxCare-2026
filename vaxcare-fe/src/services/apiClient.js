const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

const ACCESS_TOKEN_KEY = "vx_access_token";
const REFRESH_TOKEN_KEY = "vx_refresh_token";

function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens({ accessToken, refreshToken } = {}) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function rawRequest(endpoint, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // Không có body trả về
  }

  return { ok: res.ok, status: res.status, payload };
}

async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const { ok, payload } = await rawRequest("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });

  if (!ok || !payload?.data) return false;

  setTokens(payload.data);
  return true;
}

async function request(endpoint, { method = "GET", body, auth = true, _retried = false } = {}) {
  const token = auth ? getAccessToken() : null;
  const { ok, status, payload } = await rawRequest(endpoint, { method, body, token });

  if (!ok && status === 401 && auth && !_retried) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request(endpoint, { method, body, auth, _retried: true });
    }
    clearTokens();
  }

  if (!ok) {
    const message = payload?.message || "Đã có lỗi xảy ra, vui lòng thử lại.";
    const error = new Error(message);
    error.status = status;
    error.fieldErrors =
      payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)
        ? payload.data
        : null;
    throw error;
  }

  return payload?.data;
}

export const apiClient = {
  request,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
};
