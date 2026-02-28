"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiFetch } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("synthesis_token");
    if (stored) {
      setToken(stored);
    } else {
      setLoading(false);
    }
  }, []);

  // Whenever token changes, try to fetch the current user
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadUser() {
      try {
        const data = await apiFetch("/api/auth/me", {}, token);
        if (!ignore) setUser(data.user);
      } catch {
        if (!ignore) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("synthesis_token");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadUser();
    return () => { ignore = true; };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("synthesis_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    localStorage.setItem("synthesis_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" }, token);
    } catch {
      // ignore
    }
    localStorage.removeItem("synthesis_token");
    setToken(null);
    setUser(null);
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
