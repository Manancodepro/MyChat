import axios from "axios";

const API_BASE_URL = 
  import.meta.env.MODE === "development" 
    ? "http://localhost:8001/api"
    : import.meta.env.VITE_BACKEND_URL || "/api";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
