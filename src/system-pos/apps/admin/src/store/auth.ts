import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Warehouse {
  id: string;
  name: string;
  code: string;
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
  isAuthenticated: boolean;
  currentWarehouse: Warehouse | null;
  setAuth: (employee: Employee, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setCurrentWarehouse: (warehouse: Warehouse | null) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      employee: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      currentWarehouse: null,

      setAuth: (employee, accessToken, refreshToken) => {
        set({
          employee,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          // Set current warehouse to employee's assigned warehouse by default
          currentWarehouse: employee.warehouse,
        });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      setCurrentWarehouse: (warehouse) => {
        set({ currentWarehouse: warehouse });
      },

      logout: () => {
        set({
          employee: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          currentWarehouse: null,
        });
      },

      hasPermission: (permission: string) => {
        const { employee } = get();
        if (!employee) return false;
        if (employee.role.name === "Admin") return true;
        return employee.permissions.includes(permission);
      },

      isAdmin: () => {
        const { employee } = get();
        return employee?.role.name === "Admin";
      },
    }),
    {
      name: "pos-auth",
      partialize: (state) => ({
        employee: state.employee,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        currentWarehouse: state.currentWarehouse,
      }),
    }
  )
);

