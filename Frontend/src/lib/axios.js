import axios from "axios";

const API_BASE_URL = 
  import.meta.env.MODE === "development" 
    ? "http://localhost:8001/api"
    : (import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : "/api");

console.log("[axios] API_BASE_URL:", API_BASE_URL);
console.log("[axios] MODE:", import.meta.env.MODE);
console.log("[axios] VITE_BACKEND_URL:", import.meta.env.VITE_BACKEND_URL);

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
