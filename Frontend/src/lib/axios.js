import axios from "axios";

const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8001/api"
    : import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL}/api`
      : "/api";

console.log("[axios] API_BASE_URL:", API_BASE_URL);
console.log("[axios] MODE:", import.meta.env.MODE);
console.log("[axios] VITE_BACKEND_URL:", import.meta.env.VITE_BACKEND_URL);

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Debug interceptor
axiosInstance.interceptors.request.use((config) => {
  console.log("[axios interceptor] Request:", {
    url: config.url,
    method: config.method,
    withCredentials: config.withCredentials,
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
      allHeaders: response.headers,
    });
    return response;
  },
  (error) => {
    console.log("[axios interceptor] Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  },
);
