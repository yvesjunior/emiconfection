import { create } from 'zustand';

interface Shift {
  id: string;
  warehouseId: string;
  warehouseName: string;
  startTime: string;
  openingCash: number;
  status: 'open' | 'closed';
}

interface ShiftState {
  currentShift: Shift | null;
  setShift: (shift: Shift | null) => void;
  clearShift: () => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  currentShift: null,

  setShift: (shift) => {
    set({ currentShift: shift });
  },

  clearShift: () => {
    set({ currentShift: null });
  },
}));

