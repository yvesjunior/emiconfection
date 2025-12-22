import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type AppMode = 'sell' | 'manage';

interface AppModeState {
  mode: AppMode;
  isLoading: boolean;
  setMode: (mode: AppMode) => Promise<void>;
  loadStoredMode: () => Promise<void>;
  canSwitchMode: boolean;
  setCanSwitchMode: (canSwitch: boolean) => void;
}

export const useAppModeStore = create<AppModeState>((set) => ({
  mode: 'sell',
  isLoading: true,
  canSwitchMode: false,

  setMode: async (mode: AppMode) => {
    await SecureStore.setItemAsync('appMode', mode);
    set({ mode });
  },

  loadStoredMode: async () => {
    try {
      const storedMode = await SecureStore.getItemAsync('appMode');
      if (storedMode === 'sell' || storedMode === 'manage') {
        set({ mode: storedMode, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load app mode:', error);
      set({ isLoading: false });
    }
  },

  setCanSwitchMode: (canSwitch: boolean) => {
    set({ canSwitchMode: canSwitch });
  },
}));

