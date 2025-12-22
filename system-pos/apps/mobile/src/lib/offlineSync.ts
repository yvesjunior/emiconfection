import NetInfo from '@react-native-community/netinfo';
import { useOfflineQueueStore, OfflineSale } from '../store/offlineQueue';
import api from './api';

let syncInterval: NodeJS.Timeout | null = null;

export const initNetworkListener = () => {
  // Subscribe to network state changes
  const unsubscribe = NetInfo.addEventListener((state) => {
    const isOnline = state.isConnected && state.isInternetReachable !== false;
    useOfflineQueueStore.getState().setIsOnline(!!isOnline);
    
    // Trigger sync when coming back online
    if (isOnline) {
      syncPendingSales();
    }
  });

  // Start periodic sync check (every 30 seconds when online)
  syncInterval = setInterval(() => {
    const { isOnline, pendingSales } = useOfflineQueueStore.getState();
    if (isOnline && pendingSales.some((s) => !s.synced)) {
      syncPendingSales();
    }
  }, 30000);

  return () => {
    unsubscribe();
    if (syncInterval) {
      clearInterval(syncInterval);
    }
  };
};

export const syncPendingSales = async (): Promise<{ synced: number; failed: number }> => {
  const store = useOfflineQueueStore.getState();
  
  if (store.syncInProgress) {
    return { synced: 0, failed: 0 };
  }

  const unSyncedSales = store.getUnSyncedSales();
  
  if (unSyncedSales.length === 0) {
    return { synced: 0, failed: 0 };
  }

  store.setSyncInProgress(true);
  store.setLastSyncAttempt(new Date().toISOString());

  let syncedCount = 0;
  let failedCount = 0;

  for (const sale of unSyncedSales) {
    try {
      await syncSingleSale(sale);
      store.markSaleSynced(sale.id);
      syncedCount++;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Sync failed';
      store.markSaleSyncError(sale.id, errorMessage);
      failedCount++;
    }
  }

  store.setSyncInProgress(false);
  
  // Clear successfully synced sales after a delay
  if (syncedCount > 0) {
    setTimeout(() => {
      store.clearSyncedSales();
    }, 5000);
  }

  return { synced: syncedCount, failed: failedCount };
};

const syncSingleSale = async (sale: OfflineSale): Promise<void> => {
  const saleData = {
    items: sale.items,
    subtotal: sale.subtotal,
    discountAmount: sale.discountAmount,
    taxAmount: sale.taxAmount,
    total: sale.total,
    customerId: sale.customerId,
    notes: sale.notes,
    payments: [
      {
        method: sale.paymentMethod,
        amount: sale.total,
        amountReceived: sale.amountReceived,
        changeGiven: sale.changeGiven,
      },
    ],
    // Include original creation timestamp
    offlineCreatedAt: sale.createdAt,
  };

  await api.post('/sales', saleData);
};

export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    const isOnline = state.isConnected && state.isInternetReachable !== false;
    useOfflineQueueStore.getState().setIsOnline(!!isOnline);
    return !!isOnline;
  } catch {
    return false;
  }
};

export const forceSync = async (): Promise<{ synced: number; failed: number }> => {
  // First check if we're actually online
  const isOnline = await checkNetworkStatus();
  
  if (!isOnline) {
    return { synced: 0, failed: 0 };
  }

  return syncPendingSales();
};

