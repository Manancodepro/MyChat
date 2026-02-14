import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:8001/api",
  withCredentials: true,
});
