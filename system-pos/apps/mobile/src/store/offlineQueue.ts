import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineSale {
  id: string; // Local UUID
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  amountReceived?: number;
  changeGiven?: number;
  customerId?: string;
  notes?: string;
  createdAt: string;
  synced: boolean;
  syncError?: string;
}

interface OfflineQueueState {
  isOnline: boolean;
  pendingSales: OfflineSale[];
  syncInProgress: boolean;
  lastSyncAttempt: string | null;
  
  // Actions
  setIsOnline: (online: boolean) => void;
  addPendingSale: (sale: Omit<OfflineSale, 'id' | 'createdAt' | 'synced'>) => void;
  removePendingSale: (id: string) => void;
  markSaleSynced: (id: string) => void;
  markSaleSyncError: (id: string, error: string) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  setLastSyncAttempt: (timestamp: string) => void;
  clearSyncedSales: () => void;
  getPendingSalesCount: () => number;
  getUnSyncedSales: () => OfflineSale[];
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      pendingSales: [],
      syncInProgress: false,
      lastSyncAttempt: null,

      setIsOnline: (online) => set({ isOnline: online }),

      addPendingSale: (sale) => {
        const newSale: OfflineSale = {
          ...sale,
          id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          synced: false,
        };
        set((state) => ({
          pendingSales: [...state.pendingSales, newSale],
        }));
      },

      removePendingSale: (id) => {
        set((state) => ({
          pendingSales: state.pendingSales.filter((s) => s.id !== id),
        }));
      },

      markSaleSynced: (id) => {
        set((state) => ({
          pendingSales: state.pendingSales.map((s) =>
            s.id === id ? { ...s, synced: true, syncError: undefined } : s
          ),
        }));
      },

      markSaleSyncError: (id, error) => {
        set((state) => ({
          pendingSales: state.pendingSales.map((s) =>
            s.id === id ? { ...s, syncError: error } : s
          ),
        }));
      },

      setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),

      setLastSyncAttempt: (timestamp) => set({ lastSyncAttempt: timestamp }),

      clearSyncedSales: () => {
        set((state) => ({
          pendingSales: state.pendingSales.filter((s) => !s.synced),
        }));
      },

      getPendingSalesCount: () => {
        return get().pendingSales.filter((s) => !s.synced).length;
      },

      getUnSyncedSales: () => {
        return get().pendingSales.filter((s) => !s.synced);
      },
    }),
    {
      name: 'offline-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

