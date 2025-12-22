import axios from "axios";

export const http = axios.create({
  baseURL: "https://monstac-backend.onrender.com" || "http://localhost:5000"
});

export function setAuthToken(token) {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}
