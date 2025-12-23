import axios from "axios";
import { useAuthStore } from "@/store/auth";

// API_URL should include /api suffix
// Local: http://localhost:3001/api
// Production: https://emishops.net/system/api
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token and warehouse context
api.interceptors.request.use(
  (config) => {
    const { accessToken, currentWarehouse } = useAuthStore.getState();
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Add selected warehouse as header for scoping
    if (currentWarehouse?.id) {
      config.headers["X-Warehouse-Id"] = currentWarehouse.id;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          useAuthStore.getState().setTokens(accessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          window.location.href = `${BASE_PATH}/login`;
          return Promise.reject(refreshError);
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = `${BASE_PATH}/login`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

