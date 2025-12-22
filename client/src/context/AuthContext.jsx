import React, { createContext, useEffect, useMemo, useState } from "react";
import { http, setAuthToken } from "../api/http";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("monstac_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("monstac_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    setAuthToken(token);
    if (token) localStorage.setItem("monstac_token", token);
    else localStorage.removeItem("monstac_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("monstac_user", JSON.stringify(user));
    else localStorage.removeItem("monstac_user");
  }, [user]);

  async function login(email, password) {
    const { data } = await http.post("/api/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
  }

  async function register(name, email, password) {
    const { data } = await http.post("/api/auth/register", { name, email, password });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }

  async function updateMe(patch) {
    const { data } = await http.put("/api/auth/me", patch);
    setUser(data.user);
  }

  const value = useMemo(
    () => ({ token, user, login, register, logout, updateMe }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
