import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from './cart';

const PARKED_CARTS_KEY = '@parked_carts';

export interface ParkedCart {
  id: string;
  items: CartItem[];
  customerId: string | null;
  customerName?: string;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  notes: string;
  parkedAt: string;
  parkedBy: string;
}

interface ParkedCartsState {
  parkedCarts: ParkedCart[];
  isLoading: boolean;

  // Actions
  loadParkedCarts: () => Promise<void>;
  parkCart: (cart: Omit<ParkedCart, 'id' | 'parkedAt'>) => Promise<string>;
  retrieveCart: (id: string) => ParkedCart | undefined;
  removeParkedCart: (id: string) => Promise<void>;
  clearAllParkedCarts: () => Promise<void>;
}

export const useParkedCartsStore = create<ParkedCartsState>((set, get) => ({
  parkedCarts: [],
  isLoading: false,

  loadParkedCarts: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(PARKED_CARTS_KEY);
      if (stored) {
        const carts = JSON.parse(stored) as ParkedCart[];
        // Sort by most recent first
        carts.sort((a, b) => new Date(b.parkedAt).getTime() - new Date(a.parkedAt).getTime());
        set({ parkedCarts: carts });
      }
    } catch (error) {
      console.error('Error loading parked carts:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  parkCart: async (cart) => {
    const id = `cart_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const parkedCart: ParkedCart = {
      ...cart,
      id,
      parkedAt: new Date().toISOString(),
    };

    const { parkedCarts } = get();
    const updatedCarts = [parkedCart, ...parkedCarts];
    
    set({ parkedCarts: updatedCarts });

    try {
      await AsyncStorage.setItem(PARKED_CARTS_KEY, JSON.stringify(updatedCarts));
    } catch (error) {
      console.error('Error saving parked cart:', error);
    }

    return id;
  },

  retrieveCart: (id) => {
    return get().parkedCarts.find((cart) => cart.id === id);
  },

  removeParkedCart: async (id) => {
    const { parkedCarts } = get();
    const updatedCarts = parkedCarts.filter((cart) => cart.id !== id);
    
    set({ parkedCarts: updatedCarts });

    try {
      await AsyncStorage.setItem(PARKED_CARTS_KEY, JSON.stringify(updatedCarts));
    } catch (error) {
      console.error('Error removing parked cart:', error);
    }
  },

  clearAllParkedCarts: async () => {
    set({ parkedCarts: [] });
    try {
      await AsyncStorage.removeItem(PARKED_CARTS_KEY);
    } catch (error) {
      console.error('Error clearing parked carts:', error);
    }
  },
}));

