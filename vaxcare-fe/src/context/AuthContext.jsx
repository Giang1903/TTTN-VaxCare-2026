import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiClient } from "../services/apiClient";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadProfile = useCallback(async () => {
    if (!apiClient.getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await authService.getCurrentUser();
      setUser(profile);
    } catch {
      apiClient.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, [loadProfile]);

  async function login({ email, password }) {
    const data = await authService.login({ email, password });
    apiClient.setTokens(data);
    setUser({
      userId: data.accountId,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    });
    return data;
  }

  async function register(payload) {
    return authService.register(payload);
  }

  function logout() {
    apiClient.clearTokens();
    setUser(null);
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
