// client/src/api.ts
import axios from "axios";

// ✅ 1. Create an axios instance with your backend URL
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api", // change port if different
  withCredentials: false, // usually false unless using cookies
});

// ✅ 2. Add a request interceptor to attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 3. Optional: Response interceptor to handle expired tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized — token may be invalid or expired");
      localStorage.removeItem("token");
      // optional redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
