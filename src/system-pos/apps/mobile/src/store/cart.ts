import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  total: number;
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number;
  notes: string;
  
  // Actions
  addItem: (product: { id: string; name: string; sku: string; sellingPrice: number }) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setItemDiscount: (productId: string, discount: number) => void;
  setCustomer: (customerId: string | null) => void;
  setDiscount: (type: 'percentage' | 'fixed' | null, value: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  
  // Computed
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: (taxRate: number) => number;
  getTotal: (taxRate: number) => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  discountType: null,
  discountValue: 0,
  notes: '',

  addItem: (product) => {
    const { items } = get();
    const existingItem = items.find((item) => item.productId === product.id);

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice - item.discountAmount,
              }
            : item
        ),
      });
    } else {
      set({
        items: [
          ...items,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unitPrice: product.sellingPrice,
            quantity: 1,
            discountAmount: 0,
            total: product.sellingPrice,
          },
        ],
      });
    }
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              total: quantity * item.unitPrice - item.discountAmount,
            }
          : item
      ),
    });
  },

  removeItem: (productId) => {
    set({
      items: get().items.filter((item) => item.productId !== productId),
    });
  },

  setItemDiscount: (productId, discount) => {
    set({
      items: get().items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              discountAmount: discount,
              total: item.quantity * item.unitPrice - discount,
            }
          : item
      ),
    });
  },

  setCustomer: (customerId) => {
    set({ customerId });
  },

  setDiscount: (type, value) => {
    set({ discountType: type, discountValue: value });
  },

  setNotes: (notes) => {
    set({ notes });
  },

  clearCart: () => {
    set({
      items: [],
      customerId: null,
      discountType: null,
      discountValue: 0,
      notes: '',
    });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.total, 0);
  },

  getDiscountAmount: () => {
    const { discountType, discountValue } = get();
    const subtotal = get().getSubtotal();

    if (!discountType || !discountValue) return 0;

    if (discountType === 'percentage') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  },

  getTaxAmount: (taxRate: number) => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    return ((subtotal - discount) * taxRate) / 100;
  },

  getTotal: (taxRate: number) => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const tax = get().getTaxAmount(taxRate);
    return subtotal - discount + tax;
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

