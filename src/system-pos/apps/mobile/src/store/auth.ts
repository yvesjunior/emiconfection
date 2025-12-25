import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  type?: 'BOUTIQUE' | 'STOCKAGE';
}

interface Employee {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: {
    id: string;
    name: string;
  };
  warehouse: Warehouse | null;
  permissions: string[];
}

interface AuthState {
  employee: Employee | null;
  accessToken: string | null;
  refreshToken: string | null;
  selectedWarehouse: Warehouse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (employee: Employee, accessToken: string, refreshToken: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setSelectedWarehouse: (warehouse: Warehouse | null) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  getEffectiveWarehouse: () => Warehouse | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  employee: null,
  accessToken: null,
  refreshToken: null,
  selectedWarehouse: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (employee, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('employee', JSON.stringify(employee));
    
    set({
      employee,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setTokens: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  setSelectedWarehouse: async (warehouse) => {
    if (warehouse) {
      await SecureStore.setItemAsync('selectedWarehouse', JSON.stringify(warehouse));
    } else {
      await SecureStore.deleteItemAsync('selectedWarehouse');
    }
    set({ selectedWarehouse: warehouse });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('employee');
    await SecureStore.deleteItemAsync('selectedWarehouse');
    
    set({
      employee: null,
      accessToken: null,
      refreshToken: null,
      selectedWarehouse: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadStoredAuth: async () => {
    try {
      const [accessToken, refreshToken, employeeStr, selectedWarehouseStr] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('refreshToken'),
        SecureStore.getItemAsync('employee'),
        SecureStore.getItemAsync('selectedWarehouse'),
      ]);

      if (accessToken && refreshToken && employeeStr) {
        const employee = JSON.parse(employeeStr);
        const selectedWarehouse = selectedWarehouseStr ? JSON.parse(selectedWarehouseStr) : null;
        set({
          employee,
          accessToken,
          refreshToken,
          selectedWarehouse,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      set({ isLoading: false });
    }
  },

  hasPermission: (permission: string) => {
    const { employee } = get();
    if (!employee) return false;
    if (employee.role.name === 'admin') return true;
    return employee.permissions.includes(permission);
  },

  getEffectiveWarehouse: () => {
    const { employee, selectedWarehouse } = get();
    // Priority: selectedWarehouse > employee.warehouse
    return selectedWarehouse || employee?.warehouse || null;
  },
}));

