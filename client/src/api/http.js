import axios from "axios";

export const http = axios.create({
  baseURL: "https://monstac-backend.onrender.com", // ✅ correct way
  withCredentials: false                 // ✅ JWT-based auth
});

// ✅ Automatically attach token on EVERY request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional helper (keep if other files use it)
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("token", token);
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete http.defaults.headers.common.Authorization;
  }
}
