import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    authService
      .me()
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");

        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password, remember = true) => {
    const data = await authService.login({
      email,
      password,
    });

    const storage = remember
      ? localStorage
      : sessionStorage;

    storage.setItem("accessToken", data.accessToken);
    storage.setItem("refreshToken", data.refreshToken);

    setUser(data);

    return data;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}