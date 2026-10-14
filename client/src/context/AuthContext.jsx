import { createContext, useState, useEffect, useCallback } from "react";
import api from "@/api/axios";
import { useQueryClient } from "@tanstack/react-query";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const existing = sessionStorage.getItem("pcic_token") || localStorage.getItem("pcic_token");
    if (existing) sessionStorage.setItem("pcic_token", existing);
    localStorage.removeItem("pcic_token");
    localStorage.removeItem("pcic_user");
    return existing;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch {
        sessionStorage.removeItem("pcic_token");
        sessionStorage.removeItem("pcic_user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    queryClient.clear();
    sessionStorage.setItem("pcic_token", data.token);
    sessionStorage.setItem("pcic_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, [queryClient]);

  const signup = useCallback(async (values) => {
    const { data } = await api.post("/auth/signup", values);
    queryClient.clear();
    sessionStorage.setItem("pcic_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, [queryClient]);

  const completeOnboarding = useCallback(async (fullName, newPassword) => {
    const { data } = await api.post("/auth/complete-onboarding", { fullName, newPassword });
    sessionStorage.setItem("pcic_token", data.token);
    sessionStorage.setItem("pcic_user", JSON.stringify(data.user));
    // Force the welcome popup once for this freshly-onboarded member, even if
    // "Don't show again" was previously set in this browser.
    sessionStorage.setItem("pcic_force_welcome", "true");
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* Clear this browser session even if offline. */ }
    queryClient.clear();
    sessionStorage.removeItem("pcic_token");
    sessionStorage.removeItem("pcic_user");
    setToken(null);
    setUser(null);
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      sessionStorage.setItem("pcic_user", JSON.stringify(data.user));
      return data.user;
    } catch {
      return null;
    }
  }, [token]);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{ user, token, login, signup, logout, completeOnboarding, refreshUser, isAuthenticated, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
