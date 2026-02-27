import axios from "axios";

const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8001/api"
    : import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL}/api`
      : `${window.location.protocol}//${window.location.hostname}.onrender.com:${import.meta.env.VITE_BACKEND_PORT || 8001}/api`;

console.log("[axios] API_BASE_URL:", API_BASE_URL);
console.log("[axios] MODE:", import.meta.env.MODE);
console.log("[axios] VITE_BACKEND_URL:", import.meta.env.VITE_BACKEND_URL);
console.log("[axios] window.location:", window.location.origin);
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Debug interceptor
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("[axios interceptor] Request:", {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    authHeader: config.headers.Authorization ? "Set ✓" : "Not set ❌",
    cookies: document.cookie,
  });
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    const setCookie = response.headers["set-cookie"];
    console.log("[axios interceptor] Response:", {
      url: response.config.url,
      status: response.status,
      "set-cookie": setCookie,
    });
    return response;
  },
  (error) => {
    console.log("[axios interceptor] Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      authHeaderSent: error.config?.headers?.Authorization ? "Yes" : "No",
    });
    return Promise.reject(error);
  },
);
