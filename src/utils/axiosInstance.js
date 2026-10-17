import axios from "axios";
import { API_BASE_URL, API_TIMEOUT_MS } from "../config/api";
import { clearAuthSession, getAccessToken } from "./authStorage";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getAccessToken()) {
      clearAuthSession();
      window.dispatchEvent(new Event("carspar:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export default api;
