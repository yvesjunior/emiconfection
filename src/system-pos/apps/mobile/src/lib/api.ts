import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Update this to your API URL
// For development with Expo Go, use your computer's local IP
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.15:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token and warehouse ID
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add selected warehouse ID to headers for backend to use
    const selectedWarehouse = await SecureStore.getItemAsync('selectedWarehouse');
    if (selectedWarehouse) {
      try {
        const warehouse = JSON.parse(selectedWarehouse);
        if (warehouse?.id) {
          config.headers['x-warehouse-id'] = warehouse.id;
        }
      } catch (e) {
        // Ignore parsing errors
      }
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

      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          await SecureStore.setItemAsync('accessToken', accessToken);
          await SecureStore.setItemAsync('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear auth
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          await SecureStore.deleteItemAsync('employee');
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

