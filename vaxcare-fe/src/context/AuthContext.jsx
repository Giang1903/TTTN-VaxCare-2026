import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { apiClient } from "../services/apiClient";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  /** Tăng mỗi lần login/logout để bỏ kết quả loadProfile cũ (tránh lần 1 bị clearTokens sau khi đã login). */
  const sessionGen = useRef(0);

  const loadProfile = useCallback(async () => {
    const gen = sessionGen.current;
    if (!apiClient.getAccessToken()) {
      if (gen === sessionGen.current) {
        setUser(null);
        setLoading(false);
      }
      return;
    }
    try {
      const profile = await authService.getCurrentUser();
      if (gen !== sessionGen.current) return; // đã login/logout trong lúc chờ
      setUser(profile);
    } catch {
      if (gen !== sessionGen.current) return;
      apiClient.clearTokens();
      setUser(null);
    } finally {
      if (gen === sessionGen.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, [loadProfile]);

  async function login({ email, password }) {
    const data = await authService.login({ email, password });
    // Vô hiệu hóa mọi loadProfile đang chạy (token hết hạn từ session trước)
    sessionGen.current += 1;
    const gen = sessionGen.current;

    apiClient.setTokens(data);
    setLoading(false);

    try {
      const profile = await authService.getCurrentUser();
      if (gen === sessionGen.current) {
        setUser(profile);
      }
    } catch {
      // Fallback từ AuthResponse nếu /me lỗi tạm thời
      if (gen === sessionGen.current) {
        setUser({
          userId: data.accountId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        });
      }
    }
    return data;
  }

  async function register(payload) {
    return authService.register(payload);
  }

  function logout() {
    sessionGen.current += 1;
    apiClient.clearTokens();
    setUser(null);
    setLoading(false);
  }

  const value = {
    user,
    role: user?.role ?? null,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refreshProfile: loadProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() phải được gọi bên trong <AuthProvider>");
  }
  return ctx;
}