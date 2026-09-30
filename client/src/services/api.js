import axios from "axios";

// In dev, Vite proxies /api to the backend. In production set VITE_API_URL.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

// Attach the JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getError = (err) =>
  err.response?.data?.message || "Something went wrong. Is the server running?";

export default api;
