import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useCartStore, CartItem } from '../../src/store/cart';
import { useAuthStore } from '../../src/store/auth';
import { useParkedCartsStore, ParkedCart } from '../../src/store/parkedCarts';
import api from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/utils';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';
import { generateReceiptFromSale, printReceipt, shareReceipt } from '../../src/lib/receipt';
import { useOfflineQueueStore } from '../../src/store/offlineQueue';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  loyaltyPoints?: number;
}

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};
const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

const TAX_RATE = 0; // No VAT for now

export default function CartScreen() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showCashInput, setShowCashInput] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const [showLoyaltyPointsModal, setShowLoyaltyPointsModal] = useState(false);
  
  // Split payment state
  const [splitPaymentEnabled, setSplitPaymentEnabled] = useState(false);
  const [splitPayments, setSplitPayments] = useState<{ method: string; amount: string }[]>([]);
  const [activePaymentMethod, setActivePaymentMethod] = useState<string | null>(null);
  
  // Parked carts state
  const [showParkedCartsModal, setShowParkedCartsModal] = useState(false);

  // Get employee for receipt
  const employee = useAuthStore((state) => state.employee);
  
  // Parked carts
  const parkedCarts = useParkedCartsStore((state) => state.parkedCarts);
  const loadParkedCarts = useParkedCartsStore((state) => state.loadParkedCarts);
  const parkCart = useParkedCartsStore((state) => state.parkCart);
  const removeParkedCart = useParkedCartsStore((state) => state.removeParkedCart);

  // Offline queue
  const isOnline = useOfflineQueueStore((state) => state.isOnline);
  const addPendingSale = useOfflineQueueStore((state) => state.addPendingSale);
  const pendingSales = useOfflineQueueStore((state) => state.pendingSales);
  const pendingCount = pendingSales.filter((s) => !s.synced).length;

  // Fetch customers
  const { data: customersData, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers', customerSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '20' });
      if (customerSearch) params.append('search', customerSearch);
      const res = await api.get(`/customers?${params}`);
      return res.data.data;
    },
    enabled: showCustomerModal,
  });

  const customers: Customer[] = customersData || [];

  // Check if search looks like a phone number (only digits)
  const isPhoneSearch = /^\d+$/.test(customerSearch.trim());
  const hasNoResults = customerSearch.length > 0 && customers.length === 0;

  // Fetch loyalty points settings
  const { data: loyaltySettings } = useQuery({
    queryKey: ['loyalty-settings'],
    queryFn: async () => {
      const res = await api.get('/settings/loyalty-points');
      return res.data.data;
    },
  });

  const conversionRate = loyaltySettings?.conversionRate || 1.0; // Default 1:1
  const attributionRate = loyaltySettings?.attributionRate || 0.01; // Default 1%

  // Fetch customer details when selected
  const { data: customerDetails } = useQuery({
    queryKey: ['customer', selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return null;
      const res = await api.get(`/customers/${selectedCustomer.id}`);
      return res.data.data;
    },
    enabled: !!selectedCustomer?.id,
  });

  const customerLoyaltyPoints = customerDetails?.loyaltyPoints || 0;

  // Load parked carts on mount
  useEffect(() => {
    loadParkedCarts();
  }, []);

  // Park current cart
  const handleParkCart = async () => {
    if (items.length === 0) {
      Alert.alert('Panier vide', 'Ajoutez des articles avant de mettre en attente.');
      return;
    }

    Alert.alert(
      'Mettre en attente',
      'Voulez-vous mettre ce panier en attente ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            await parkCart({
              items,
              customerId: selectedCustomer?.id || null,
              customerName: selectedCustomer?.name,
              discountType: storeDiscountType,
              discountValue: storeDiscountValue,
              notes: '',
              parkedBy: employee?.fullName || 'Inconnu',
            });
            clearCart();
            setSelectedCustomer(null);
            setDiscountValue('');
            setLoyaltyPointsUsed(0);
            hapticNotification(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Succès', 'Panier mis en attente');
          },
        },
      ]
    );
  };

  // Retrieve parked cart
  const handleRetrieveCart = async (parkedCart: ParkedCart) => {
    if (items.length > 0) {
      Alert.alert(
        'Panier actif',
        'Votre panier actuel sera remplacé. Continuer ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Continuer',
            onPress: () => doRetrieveCart(parkedCart),
          },
        ]
      );
    } else {
      doRetrieveCart(parkedCart);
    }
  };

  const doRetrieveCart = async (parkedCart: ParkedCart) => {
    // Clear current cart and load parked cart data
    clearCart();
    
    // Add all items from parked cart
    parkedCart.items.forEach((item) => {
      // Add item multiple times for quantity
      for (let i = 0; i < item.quantity; i++) {
        addItem({
          id: item.productId,
          name: item.name,
          sku: item.sku,
          sellingPrice: item.unitPrice,
        });
      }
    });

    // Restore discount
    if (parkedCart.discountType && parkedCart.discountValue > 0) {
      setDiscount(parkedCart.discountType, parkedCart.discountValue);
    }

    // Restore customer
    if (parkedCart.customerId && parkedCart.customerName) {
      setSelectedCustomer({
        id: parkedCart.customerId,
        name: parkedCart.customerName,
        phone: null,
        email: null,
      });
    }

    // Remove from parked carts
    await removeParkedCart(parkedCart.id);
    setShowParkedCartsModal(false);
    hapticNotification(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    try {
      const response = await api.post('/customers', {
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || null,
      });
      const customer = response.data.data;
      setSelectedCustomer(customer);
      setShowAddCustomer(false);
      setShowCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setCustomerSearch(''); // Clear search
      refetchCustomers();
      hapticNotification(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer le client');
    }
  };

  // Quick create from phone search
  const handleQuickCreateFromPhone = () => {
    setNewCustomerPhone(customerSearch.trim());
    setNewCustomerName('');
    setShowAddCustomer(true);
  };

  // Handle closing add customer form - return to search if there was a search
  const handleCloseAddCustomer = () => {
    setShowAddCustomer(false);
    // Keep the search if it was a phone search, clear it otherwise
    if (!isPhoneSearch) {
      setCustomerSearch('');
    }
  };

  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    clearCart,
    setDiscount,
    discountType: storeDiscountType,
    discountValue: storeDiscountValue,
  } = useCartStore();

  // Sync discount state with store
  const handleApplyDiscount = () => {
    const value = parseFloat(discountValue) || 0;
    if (value > 0) {
      setDiscount(discountType, value);
    } else {
      setDiscount(null, 0);
    }
    setShowDiscountModal(false);
    hapticNotification(Haptics.NotificationFeedbackType.Success);
  };

  const handleClearDiscount = () => {
    setDiscount(null, 0);
    setDiscountValue('');
    hapticNotification(Haptics.NotificationFeedbackType.Warning);
  };

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const loyaltyDiscount = loyaltyPointsUsed > 0 ? loyaltyPointsUsed * conversionRate : 0;
  const tax = getTaxAmount(TAX_RATE);
  const total = getTotal(TAX_RATE) - loyaltyDiscount;

  // Show loyalty points alert when customer with points is selected
  useEffect(() => {
    if (selectedCustomer && customerLoyaltyPoints > 0 && items.length > 0) {
      const maxDiscount = customerLoyaltyPoints * conversionRate;
      const maxDiscountMessage = maxDiscount > subtotal 
        ? `Remise maximale possible: ${formatCurrency(subtotal)}`
        : `Remise maximale possible: ${formatCurrency(maxDiscount)} (${customerLoyaltyPoints} points)`;

      Alert.alert(
        'Points de fidélité disponibles',
        `Le client a ${customerLoyaltyPoints} points disponibles.\n${maxDiscountMessage}\n\nQue souhaitez-vous faire ?`,
        [
          {
            text: 'Accumuler les points',
            onPress: () => {
              setLoyaltyPointsUsed(0);
            },
          },
          {
            text: 'Utiliser les points',
            onPress: () => {
              setShowLoyaltyPointsModal(true);
            },
          },
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: () => {
              setLoyaltyPointsUsed(0);
            },
          },
        ]
      );
    }
  }, [selectedCustomer, customerLoyaltyPoints, items.length, subtotal, conversionRate]);

  const cashReceivedAmount = parseFloat(cashReceived) || 0;
  const changeAmount = cashReceivedAmount - total;

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Panier vide', 'Veuillez ajouter des articles au panier.');
      return;
    }

    // Validate payments
    if (splitPaymentEnabled) {
      const splitTotal = getSplitTotal();
      if (splitTotal < total) {
        Alert.alert(
          'Montant insuffisant',
          `Le total des paiements (${formatCurrency(splitTotal)}) est inférieur au total (${formatCurrency(total)})`
        );
        return;
      }
      // Validate cash payments have sufficient amount received
      const cashPayment = splitPayments.find(p => p.method === 'cash');
      if (cashPayment && cashReceivedAmount < parseFloat(cashPayment.amount || '0')) {
        Alert.alert(
          'Montant espèces insuffisant',
          `Le montant reçu est insuffisant pour le paiement en espèces`
        );
        return;
      }
    } else if (selectedPayment === 'cash') {
      if (!cashReceived || cashReceivedAmount < total) {
        Alert.alert(
          'Montant insuffisant',
          `Le montant reçu (${formatCurrency(cashReceivedAmount)}) est inférieur au total (${formatCurrency(total)})`
        );
        return;
      }
    }

    setIsProcessing(true);
    
    const saleItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice - (item.discountAmount || 0),
    }));

    // Calculate sale totals
    const saleSubtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
    const saleDiscountAmount = storeDiscountType === 'percentage'
      ? saleSubtotal * (storeDiscountValue / 100)
      : (storeDiscountValue || 0);
    const saleTaxAmount = (saleSubtotal - saleDiscountAmount) * TAX_RATE;
    const saleTotal = saleSubtotal - saleDiscountAmount + saleTaxAmount;

    // If offline, queue the sale
    if (!isOnline) {
      addPendingSale({
        items: saleItems,
        subtotal: saleSubtotal,
        discountAmount: saleDiscountAmount,
        taxAmount: saleTaxAmount,
        total: saleTotal,
        paymentMethod: selectedPayment,
        amountReceived: selectedPayment === 'cash' ? cashReceivedAmount : saleTotal,
        changeGiven: selectedPayment === 'cash' ? changeAmount : 0,
        customerId: selectedCustomer?.id,
      });

      hapticNotification(Haptics.NotificationFeedbackType.Success);
      clearCart();
      setCashReceived('');
      setShowCashInput(false);
      setSelectedCustomer(null);
      setIsProcessing(false);

      const changeMessage = selectedPayment === 'cash' && changeAmount > 0
        ? `\nMonnaie à rendre: ${formatCurrency(changeAmount)}`
        : '';

      Alert.alert(
        'Vente enregistrée hors ligne 📴',
        `Total: ${formatCurrency(saleTotal)}${changeMessage}\n\nLa vente sera synchronisée dès que la connexion sera rétablie.`,
        [
          { text: 'OK', onPress: () => router.push('/(app)') },
        ]
      );
      return;
    }

    try {
      // Build payments array
      const paymentsData = splitPaymentEnabled
        ? splitPayments.map(p => ({
            method: p.method,
            amount: parseFloat(p.amount) || 0,
            amountReceived: p.method === 'cash' ? cashReceivedAmount : parseFloat(p.amount) || 0,
          }))
        : [
            {
              method: selectedPayment,
              amount: total,
              amountReceived: selectedPayment === 'cash' ? cashReceivedAmount : total,
            },
          ];

      const saleData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
        })),
        payments: paymentsData,
        customerId: selectedCustomer?.id || null,
        loyaltyPointsUsed: loyaltyPointsUsed || 0,
        taxRate: TAX_RATE,
      };

      const response = await api.post('/sales', saleData);
      const sale = response.data.data;

      hapticNotification(Haptics.NotificationFeedbackType.Success);
      clearCart();
      setCashReceived('');
      setShowCashInput(false);
      setSelectedCustomer(null);

      const changeMessage = selectedPayment === 'cash' && changeAmount > 0
        ? `\nMonnaie à rendre: ${formatCurrency(changeAmount)}`
        : '';

      // Fetch full sale details for receipt
      const saleResponse = await api.get(`/sales/${sale.id}`);
      const fullSale = saleResponse.data.data;

      Alert.alert(
        'Vente réussie ! 🎉',
        `Facture: ${sale.invoiceNumber}\nTotal: ${formatCurrency(Number(sale.total))}${changeMessage}`,
        [
          { text: 'Nouvelle vente', onPress: () => router.push('/(app)') },
          {
            text: 'Imprimer',
            onPress: async () => {
              try {
                const receiptData = generateReceiptFromSale(
                  fullSale,
                  employee?.warehouse,
                  employee
                );
                await printReceipt(receiptData);
              } catch (err) {
                console.error('Print error:', err);
              }
              router.push('/(app)');
            },
          },
          {
            text: 'Partager',
            onPress: async () => {
              try {
                const receiptData = generateReceiptFromSale(
                  fullSale,
                  employee?.warehouse,
                  employee
                );
                await shareReceipt(receiptData);
              } catch (err) {
                console.error('Share error:', err);
              }
              router.push('/(app)');
            },
          },
        ]
      );
    } catch (error: any) {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Erreur',
        error.response?.data?.message || 'Échec du traitement de la vente'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick cash amounts for faster input
  const quickCashAmounts = [
    Math.ceil(total / 100) * 100, // Round up to nearest 100
    Math.ceil(total / 500) * 500, // Round up to nearest 500
    Math.ceil(total / 1000) * 1000, // Round up to nearest 1000
    Math.ceil(total / 5000) * 5000, // Round up to nearest 5000
  ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount >= total);

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemSku}>{item.sku}</Text>
        <Text style={styles.cartItemPrice}>
          {formatCurrency(item.unitPrice)} × {item.quantity}
        </Text>
      </View>
      <View style={styles.cartItemActions}>
        <Text style={styles.cartItemTotal}>{formatCurrency(item.total)}</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => {
              updateQuantity(item.productId, item.quantity - 1);
              hapticImpact(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name="remove" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => {
              updateQuantity(item.productId, item.quantity + 1);
              hapticImpact(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name="add" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            removeItem(item.productId);
            hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
          }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const paymentMethods = [
    { id: 'cash', name: 'Espèces', icon: 'cash-outline' },
    { id: 'card', name: 'Carte', icon: 'card-outline' },
    { id: 'mobile_money', name: 'Mobile', icon: 'phone-portrait-outline' },
  ];

  // Split payment helpers
  const getSplitTotal = () => {
    return splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const getSplitRemaining = () => {
    return total - getSplitTotal();
  };

  const addSplitPayment = (method: string) => {
    const remaining = getSplitRemaining();
    if (remaining <= 0) return;
    
    // Check if method already exists
    const existingIndex = splitPayments.findIndex(p => p.method === method);
    if (existingIndex >= 0) {
      setActivePaymentMethod(method);
      return;
    }
    
    setSplitPayments([...splitPayments, { method, amount: remaining.toString() }]);
    setActivePaymentMethod(method);
  };

  const updateSplitAmount = (method: string, amount: string) => {
    setSplitPayments(splitPayments.map(p => 
      p.method === method ? { ...p, amount } : p
    ));
  };

  const removeSplitPayment = (method: string) => {
    setSplitPayments(splitPayments.filter(p => p.method !== method));
    if (activePaymentMethod === method) {
      setActivePaymentMethod(null);
    }
  };

  const toggleSplitPayment = () => {
    if (splitPaymentEnabled) {
      // Disable split payment - clear split payments
      setSplitPayments([]);
      setActivePaymentMethod(null);
    } else {
      // Enable split payment - initialize with current payment
      setSplitPayments([{ method: selectedPayment, amount: total.toString() }]);
      setActivePaymentMethod(selectedPayment);
    }
    setSplitPaymentEnabled(!splitPaymentEnabled);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panier</Text>
        <View style={styles.headerActions}>
          {/* Parked Carts Button */}
          <TouchableOpacity
            onPress={() => setShowParkedCartsModal(true)}
            style={styles.headerButton}
          >
            <Ionicons name="time-outline" size={22} color={colors.primary} />
            {parkedCarts.length > 0 && (
              <View style={styles.parkedBadge}>
                <Text style={styles.parkedBadgeText}>{parkedCarts.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          {/* Park Cart Button */}
          <TouchableOpacity
            onPress={handleParkCart}
            style={styles.headerButton}
            disabled={items.length === 0}
          >
            <Ionicons 
              name="pause-circle-outline" 
              size={22} 
              color={items.length > 0 ? colors.warning : colors.textMuted} 
            />
          </TouchableOpacity>
          {/* Clear Cart Button */}
          <TouchableOpacity
            onPress={() => {
              if (items.length > 0) {
                Alert.alert('Vider le panier', 'Supprimer tous les articles ?', [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Vider', style: 'destructive', onPress: clearCart },
                ]);
              }
            }}
            style={styles.headerButton}
          >
            <Ionicons name="trash-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Indicator */}
      {(!isOnline || pendingCount > 0) && (
        <View style={[styles.offlineBar, isOnline && styles.syncBar]}>
          <Ionicons
            name={isOnline ? 'cloud-upload-outline' : 'cloud-offline-outline'}
            size={16}
            color={isOnline ? colors.warning : colors.textInverse}
          />
          <Text style={[styles.offlineText, isOnline && styles.syncText]}>
            {!isOnline
              ? 'Mode hors ligne - Les ventes seront synchronisées'
              : `${pendingCount} vente(s) en attente de synchronisation`}
          </Text>
        </View>
      )}

      {/* Customer Selection */}
      {items.length > 0 && (
        <TouchableOpacity
          style={styles.customerSelector}
          onPress={() => setShowCustomerModal(true)}
        >
          <View style={styles.customerSelectorIcon}>
            <Ionicons
              name={selectedCustomer ? 'person' : 'person-add-outline'}
              size={20}
              color={selectedCustomer ? colors.primary : colors.textMuted}
            />
          </View>
          <View style={styles.customerSelectorInfo}>
            <Text style={styles.customerSelectorLabel}>
              {selectedCustomer ? 'Client' : 'Ajouter un client'}
            </Text>
            {selectedCustomer && (
              <>
                <Text style={styles.customerSelectorName}>{selectedCustomer.name}</Text>
                {customerLoyaltyPoints > 0 && (
                  <Text style={styles.loyaltyPointsText}>
                    {customerLoyaltyPoints} points disponibles
                  </Text>
                )}
              </>
            )}
          </View>
          {selectedCustomer ? (
            <TouchableOpacity
              style={styles.customerClearButton}
              onPress={() => {
                setSelectedCustomer(null);
                setLoyaltyPointsUsed(0);
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      )}

      {/* Loyalty Points Discount Display */}
      {loyaltyPointsUsed > 0 && (
        <View style={styles.loyaltyDiscountBadge}>
          <Ionicons name="star" size={16} color={colors.success} />
          <Text style={styles.loyaltyDiscountText}>
            Remise points: {formatCurrency(loyaltyPointsUsed * conversionRate)} ({loyaltyPointsUsed} pts)
          </Text>
          <TouchableOpacity
            onPress={() => setLoyaltyPointsUsed(0)}
            style={styles.loyaltyDiscountRemove}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Discount Button */}
      {items.length > 0 && (
        <View style={styles.discountRow}>
          {storeDiscountValue > 0 ? (
            <View style={styles.discountApplied}>
              <View style={styles.discountAppliedInfo}>
                <Ionicons name="pricetag" size={18} color={colors.success} />
                <Text style={styles.discountAppliedText}>
                  Remise: {storeDiscountType === 'percentage' 
                    ? `${storeDiscountValue}%` 
                    : formatCurrency(storeDiscountValue)}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClearDiscount}>
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addDiscountButton}
              onPress={() => setShowDiscountModal(true)}
            >
              <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
              <Text style={styles.addDiscountText}>Ajouter une remise</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Cart Items */}
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyStateTitle}>Votre panier est vide</Text>
          <Text style={styles.emptyStateText}>Ajoutez des produits pour commencer</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(app)')}
          >
            <Text style={styles.browseButtonText}>Parcourir les produits</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.productId}
            renderItem={renderCartItem}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
          />

          {/* Payment Methods */}
          <View style={styles.paymentSection}>
            <View style={styles.paymentHeader}>
              <Text style={styles.sectionTitle}>Mode de paiement</Text>
              <TouchableOpacity
                style={[styles.splitToggle, splitPaymentEnabled && styles.splitToggleActive]}
                onPress={toggleSplitPayment}
              >
                <Ionicons
                  name="git-branch-outline"
                  size={16}
                  color={splitPaymentEnabled ? colors.textInverse : colors.primary}
                />
                <Text style={[styles.splitToggleText, splitPaymentEnabled && styles.splitToggleTextActive]}>
                  Diviser
                </Text>
              </TouchableOpacity>
            </View>

            {!splitPaymentEnabled ? (
              // Single payment mode
              <View style={styles.paymentMethods}>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethod,
                      selectedPayment === method.id && styles.paymentMethodActive,
                    ]}
                    onPress={() => {
                      setSelectedPayment(method.id);
                      setShowCashInput(method.id === 'cash');
                      if (method.id !== 'cash') setCashReceived('');
                    }}
                  >
                    <Ionicons
                      name={method.icon as any}
                      size={24}
                      color={selectedPayment === method.id ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.paymentMethodText,
                        selectedPayment === method.id && styles.paymentMethodTextActive,
                      ]}
                    >
                      {method.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              // Split payment mode
              <View style={styles.splitPaymentSection}>
                {/* Added payments */}
                {splitPayments.map((payment) => {
                  const methodInfo = paymentMethods.find(m => m.id === payment.method);
                  return (
                    <View key={payment.method} style={styles.splitPaymentItem}>
                      <View style={styles.splitPaymentHeader}>
                        <View style={styles.splitPaymentMethodInfo}>
                          <Ionicons name={methodInfo?.icon as any} size={20} color={colors.primary} />
                          <Text style={styles.splitPaymentMethodName}>{methodInfo?.name}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeSplitPayment(payment.method)}>
                          <Ionicons name="close-circle" size={24} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.splitPaymentAmountRow}>
                        <TextInput
                          style={styles.splitPaymentInput}
                          value={payment.amount}
                          onChangeText={(val) => updateSplitAmount(payment.method, val)}
                          keyboardType="numeric"
                          placeholder="0"
                          selectTextOnFocus
                        />
                        <Text style={styles.splitPaymentCurrency}>FCFA</Text>
                      </View>
                    </View>
                  );
                })}

                {/* Remaining amount indicator */}
                {getSplitRemaining() > 0 && (
                  <View style={styles.splitRemaining}>
                    <Text style={styles.splitRemainingText}>
                      Restant: {formatCurrency(getSplitRemaining())}
                    </Text>
                  </View>
                )}

                {/* Add payment method buttons */}
                <View style={styles.splitAddButtons}>
                  {paymentMethods
                    .filter(m => !splitPayments.find(p => p.method === m.id))
                    .map((method) => (
                      <TouchableOpacity
                        key={method.id}
                        style={styles.splitAddButton}
                        onPress={() => addSplitPayment(method.id)}
                      >
                        <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                        <Text style={styles.splitAddButtonText}>{method.name}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}

            {/* Cash Input Section */}
            {((selectedPayment === 'cash' && !splitPaymentEnabled) || 
              (splitPaymentEnabled && splitPayments.some(p => p.method === 'cash'))) && (
              <View style={styles.cashSection}>
                <Text style={styles.cashLabel}>Montant reçu</Text>
                <View style={styles.cashInputContainer}>
                  <TextInput
                    style={styles.cashInput}
                    value={cashReceived}
                    onChangeText={setCashReceived}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <Text style={styles.cashCurrency}>FCFA</Text>
                </View>

                {/* Quick Amount Buttons */}
                <View style={styles.quickAmounts}>
                  <TouchableOpacity
                    style={styles.quickAmountButton}
                    onPress={() => setCashReceived(total.toString())}
                  >
                    <Text style={styles.quickAmountText}>Exact</Text>
                  </TouchableOpacity>
                  {quickCashAmounts.slice(0, 3).map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.quickAmountButton}
                      onPress={() => setCashReceived(amount.toString())}
                    >
                      <Text style={styles.quickAmountText}>{formatCurrency(amount)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Change Display */}
                {cashReceivedAmount > 0 && (
                  <View style={[
                    styles.changeDisplay,
                    changeAmount >= 0 ? styles.changePositive : styles.changeNegative,
                  ]}>
                    <Text style={styles.changeLabel}>
                      {changeAmount >= 0 ? 'Monnaie à rendre' : 'Montant manquant'}
                    </Text>
                    <Text style={[
                      styles.changeAmount,
                      changeAmount >= 0 ? styles.changeAmountPositive : styles.changeAmountNegative,
                    ]}>
                      {formatCurrency(Math.abs(changeAmount))}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remise</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  -{formatCurrency(discount)}
                </Text>
              </View>
            )}
            {loyaltyDiscount > 0 && (
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelRow}>
                  <Ionicons name="star" size={16} color={colors.success} />
                  <Text style={styles.summaryLabel}>Remise points ({loyaltyPointsUsed} pts)</Text>
                </View>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  -{formatCurrency(loyaltyDiscount)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

          {/* Checkout Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.checkoutButton, isProcessing && styles.checkoutButtonDisabled]}
              onPress={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color={colors.textInverse} />
                  <Text style={styles.checkoutButtonText}>
                    Payer {formatCurrency(total)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCustomerModal(false);
          setShowAddCustomer(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {showAddCustomer ? 'Nouveau client' : 'Sélectionner un client'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowCustomerModal(false);
                setShowAddCustomer(false);
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {showAddCustomer ? (
            <View style={styles.addCustomerForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nom *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newCustomerName}
                  onChangeText={setNewCustomerName}
                  placeholder="Nom du client"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Téléphone</Text>
                <TextInput
                  style={styles.formInput}
                  value={newCustomerPhone}
                  onChangeText={setNewCustomerPhone}
                  placeholder="Numéro de téléphone"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.formButtonSecondary}
                  onPress={handleCloseAddCustomer}
                >
                  <Text style={styles.formButtonSecondaryText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.formButtonPrimary}
                  onPress={handleAddCustomer}
                >
                  <Text style={styles.formButtonPrimaryText}>Créer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Search Input */}
              <View style={styles.customerSearchContainer}>
                <Ionicons name={isPhoneSearch ? "call" : "search"} size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.customerSearchInput}
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  placeholder={isPhoneSearch ? "Rechercher par numéro..." : "Rechercher un client..."}
                  placeholderTextColor={colors.textMuted}
                  keyboardType={isPhoneSearch ? "phone-pad" : "default"}
                />
                {customerSearch.length > 0 && (
                  <TouchableOpacity onPress={() => {
                    setCustomerSearch('');
                    setShowAddCustomer(false);
                  }}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Create from Phone Search */}
              {isPhoneSearch && hasNoResults && (
                <TouchableOpacity
                  style={styles.quickCreateFromPhoneButton}
                  onPress={handleQuickCreateFromPhone}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                  <View style={styles.quickCreateFromPhoneTextContainer}>
                    <Text style={styles.quickCreateFromPhoneText}>
                      Créer un client avec ce numéro
                    </Text>
                    <Text style={styles.quickCreateFromPhoneNumber}>
                      {customerSearch}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Quick Add Button (when not searching by phone) */}
              {(!isPhoneSearch || !hasNoResults) && (
                <TouchableOpacity
                  style={styles.quickAddButton}
                  onPress={() => {
                    setNewCustomerPhone('');
                    setNewCustomerName('');
                    setShowAddCustomer(true);
                  }}
                >
                  <Ionicons name="add-circle" size={24} color={colors.primary} />
                  <Text style={styles.quickAddText}>Créer un nouveau client</Text>
                </TouchableOpacity>
              )}

              {/* Customer List */}
              <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.customerItem}
                    onPress={() => {
                      setSelectedCustomer(item);
                      setShowCustomerModal(false);
                      hapticImpact(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={styles.customerItemIcon}>
                      <Ionicons name="person" size={20} color={colors.primary} />
                    </View>
                    <View style={styles.customerItemInfo}>
                      <Text style={styles.customerItemName}>{item.name || 'Sans nom'}</Text>
                      {item.phone && (
                        <View style={styles.customerItemPhoneRow}>
                          <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                          <Text style={styles.customerItemPhone}>{item.phone}</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  !isPhoneSearch || !hasNoResults ? (
                    <View style={styles.emptyCustomers}>
                      <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                      <Text style={styles.emptyCustomersText}>
                        {customerSearch ? 'Aucun client trouvé' : 'Aucun client'}
                      </Text>
                      {customerSearch && !isPhoneSearch && (
                        <Text style={styles.emptyCustomersHint}>
                          Essayez de rechercher par numéro de téléphone
                        </Text>
                      )}
                    </View>
                  ) : null
                }
                ItemSeparatorComponent={() => <View style={styles.customerSeparator} />}
              />
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Discount Modal */}
      <Modal
        visible={showDiscountModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDiscountModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ajouter une remise</Text>
            <TouchableOpacity onPress={() => setShowDiscountModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.discountForm}>
            {/* Discount Type Toggle */}
            <Text style={styles.formLabel}>Type de remise</Text>
            <View style={styles.discountTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.discountTypeButton,
                  discountType === 'percentage' && styles.discountTypeButtonActive,
                ]}
                onPress={() => setDiscountType('percentage')}
              >
                <Ionicons
                  name="cellular"
                  size={20}
                  color={discountType === 'percentage' ? colors.textInverse : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.discountTypeText,
                    discountType === 'percentage' && styles.discountTypeTextActive,
                  ]}
                >
                  Pourcentage (%)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.discountTypeButton,
                  discountType === 'fixed' && styles.discountTypeButtonActive,
                ]}
                onPress={() => setDiscountType('fixed')}
              >
                <Ionicons
                  name="cash"
                  size={20}
                  color={discountType === 'fixed' ? colors.textInverse : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.discountTypeText,
                    discountType === 'fixed' && styles.discountTypeTextActive,
                  ]}
                >
                  Montant fixe
                </Text>
              </TouchableOpacity>
            </View>

            {/* Discount Value Input */}
            <Text style={[styles.formLabel, { marginTop: spacing.lg }]}>
              {discountType === 'percentage' ? 'Pourcentage' : 'Montant'}
            </Text>
            <View style={styles.discountInputContainer}>
              <TextInput
                style={styles.discountInput}
                value={discountValue}
                onChangeText={setDiscountValue}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={styles.discountSuffix}>
                {discountType === 'percentage' ? '%' : 'FCFA'}
              </Text>
            </View>

            {/* Quick Discount Buttons */}
            {discountType === 'percentage' && (
              <View style={styles.quickDiscounts}>
                {[5, 10, 15, 20, 25].map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={styles.quickDiscountButton}
                    onPress={() => setDiscountValue(pct.toString())}
                  >
                    <Text style={styles.quickDiscountText}>{pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Preview */}
            {parseFloat(discountValue) > 0 && (
              <View style={styles.discountPreview}>
                <Text style={styles.discountPreviewLabel}>Remise appliquée:</Text>
                <Text style={styles.discountPreviewValue}>
                  -{discountType === 'percentage'
                    ? formatCurrency((subtotal * parseFloat(discountValue)) / 100)
                    : formatCurrency(parseFloat(discountValue))}
                </Text>
              </View>
            )}

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyDiscountButton}
              onPress={handleApplyDiscount}
            >
              <Text style={styles.applyDiscountButtonText}>Appliquer la remise</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Loyalty Points Modal */}
      <Modal
        visible={showLoyaltyPointsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLoyaltyPointsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Utiliser les points de fidélité</Text>
            <TouchableOpacity onPress={() => setShowLoyaltyPointsModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.discountForm}>
            <View style={styles.loyaltyInfo}>
              <Text style={styles.loyaltyInfoLabel}>Points disponibles:</Text>
              <Text style={styles.loyaltyInfoValue}>{customerLoyaltyPoints} points</Text>
            </View>

            <View style={styles.loyaltyInfo}>
              <Text style={styles.loyaltyInfoLabel}>Taux de conversion:</Text>
              <Text style={styles.loyaltyInfoValue}>1 point = {formatCurrency(conversionRate)}</Text>
            </View>

            <Text style={styles.formLabel}>Nombre de points à utiliser</Text>
            <View style={styles.discountInputContainer}>
              <TextInput
                style={styles.discountInput}
                value={loyaltyPointsUsed > 0 ? loyaltyPointsUsed.toString() : ''}
                onChangeText={(text) => {
                  const points = parseInt(text) || 0;
                  const maxPoints = Math.min(customerLoyaltyPoints, Math.floor(subtotal / conversionRate));
                  setLoyaltyPointsUsed(Math.min(points, maxPoints));
                }}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={styles.discountSuffix}>points</Text>
            </View>

            {/* Quick Points Buttons */}
            <View style={styles.quickDiscounts}>
              {[100, 500, 1000, 2000, 5000].map((points) => {
                const maxPoints = Math.min(customerLoyaltyPoints, Math.floor(subtotal / conversionRate));
                if (points > maxPoints) return null;
                return (
                  <TouchableOpacity
                    key={points}
                    style={styles.quickDiscountButton}
                    onPress={() => setLoyaltyPointsUsed(points)}
                  >
                    <Text style={styles.quickDiscountText}>{points}</Text>
                  </TouchableOpacity>
                );
              })}
              {customerLoyaltyPoints > 0 && (
                <TouchableOpacity
                  style={styles.quickDiscountButton}
                  onPress={() => {
                    const maxPoints = Math.min(customerLoyaltyPoints, Math.floor(subtotal / conversionRate));
                    setLoyaltyPointsUsed(maxPoints);
                  }}
                >
                  <Text style={styles.quickDiscountText}>Max</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Preview */}
            {loyaltyPointsUsed > 0 && (
              <View style={styles.discountPreview}>
                <Text style={styles.discountPreviewLabel}>Remise appliquée:</Text>
                <Text style={styles.discountPreviewValue}>
                  -{formatCurrency(loyaltyPointsUsed * conversionRate)}
                </Text>
                <Text style={styles.discountPreviewSubtext}>
                  ({loyaltyPointsUsed} points utilisés)
                </Text>
              </View>
            )}

            {/* Apply Button */}
            <TouchableOpacity
              style={[styles.applyDiscountButton, loyaltyPointsUsed === 0 && styles.applyDiscountButtonDisabled]}
              onPress={() => {
                setShowLoyaltyPointsModal(false);
                hapticNotification(Haptics.NotificationFeedbackType.Success);
              }}
              disabled={loyaltyPointsUsed === 0}
            >
              <Text style={styles.applyDiscountButtonText}>
                {loyaltyPointsUsed > 0 ? `Utiliser ${loyaltyPointsUsed} points` : 'Annuler'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Parked Carts Modal */}
      <Modal
        visible={showParkedCartsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowParkedCartsModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Paniers en attente</Text>
            <View style={{ width: 24 }} />
          </View>

          {parkedCarts.length === 0 ? (
            <View style={styles.emptyParkedCarts}>
              <Ionicons name="time-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyParkedCartsTitle}>Aucun panier en attente</Text>
              <Text style={styles.emptyParkedCartsSubtitle}>
                Mettez un panier en attente pour le retrouver ici
              </Text>
            </View>
          ) : (
            <FlatList
              data={parkedCarts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: spacing.lg }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.parkedCartItem}
                  onPress={() => handleRetrieveCart(item)}
                >
                  <View style={styles.parkedCartInfo}>
                    <View style={styles.parkedCartHeader}>
                      <Text style={styles.parkedCartItemCount}>
                        {item.items.length} article(s)
                      </Text>
                      {item.customerName && (
                        <View style={styles.parkedCartCustomer}>
                          <Ionicons name="person" size={12} color={colors.primary} />
                          <Text style={styles.parkedCartCustomerName}>
                            {item.customerName}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.parkedCartTotal}>
                      {formatCurrency(
                        item.items.reduce((sum, i) => sum + i.total, 0) -
                        (item.discountType === 'percentage'
                          ? (item.items.reduce((sum, i) => sum + i.total, 0) * item.discountValue) / 100
                          : item.discountValue || 0)
                      )}
                    </Text>
                    <View style={styles.parkedCartMeta}>
                      <Text style={styles.parkedCartTime}>
                        {new Date(item.parkedAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text style={styles.parkedCartBy}>par {item.parkedBy}</Text>
                    </View>
                  </View>
                  <View style={styles.parkedCartActions}>
                    <TouchableOpacity
                      style={styles.retrieveButton}
                      onPress={() => handleRetrieveCart(item)}
                    >
                      <Ionicons name="play-circle" size={24} color={colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteParkedButton}
                      onPress={() => {
                        Alert.alert(
                          'Supprimer',
                          'Supprimer ce panier en attente ?',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            {
                              text: 'Supprimer',
                              style: 'destructive',
                              onPress: () => removeParkedCart(item.id),
                            },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
    position: 'relative',
  },
  parkedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parkedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
  },
  offlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.danger,
  },
  syncBar: {
    backgroundColor: colors.warning,
  },
  offlineText: {
    fontSize: fontSize.sm,
    color: colors.textInverse,
    flex: 1,
  },
  syncText: {
    color: colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  browseButton: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  browseButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  cartList: {
    padding: spacing.lg,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  cartItemSku: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cartItemActions: {
    alignItems: 'flex-end',
  },
  cartItemTotal: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  quantityButton: {
    padding: spacing.sm,
  },
  quantityText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: spacing.xs,
  },
  paymentSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  splitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '20',
  },
  splitToggleActive: {
    backgroundColor: colors.primary,
  },
  splitToggleText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.primary,
  },
  splitToggleTextActive: {
    color: colors.textInverse,
  },
  splitPaymentSection: {
    gap: spacing.sm,
  },
  splitPaymentItem: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  splitPaymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  splitPaymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  splitPaymentMethodName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  splitPaymentAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  splitPaymentInput: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  splitPaymentCurrency: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  splitRemaining: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.warningLight + '20',
    borderRadius: borderRadius.md,
  },
  splitRemainingText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.warning,
  },
  splitAddButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  splitAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight + '15',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
  },
  splitAddButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentMethod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  paymentMethodText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  paymentMethodTextActive: {
    color: colors.primary,
  },
  cashSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cashLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cashInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cashInput: {
    flex: 1,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlign: 'right',
  },
  cashCurrency: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
    paddingRight: spacing.md,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  changeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  changePositive: {
    backgroundColor: colors.successLight + '20',
  },
  changeNegative: {
    backgroundColor: colors.dangerLight + '20',
  },
  changeLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  changeAmount: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  changeAmountPositive: {
    color: colors.success,
  },
  changeAmountNegative: {
    color: colors.danger,
  },
  summary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textInverse,
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  customerSelectorIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerSelectorInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerSelectorLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  customerSelectorName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  loyaltyPointsText: {
    fontSize: fontSize.xs,
    color: colors.success,
    marginTop: spacing.xs / 2,
  },
  loyaltyDiscountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  loyaltyDiscountText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '500',
  },
  loyaltyDiscountRemove: {
    padding: spacing.xs,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loyaltyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  loyaltyInfoLabel: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  loyaltyInfoValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  discountPreviewSubtext: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  applyDiscountButtonDisabled: {
    opacity: 0.5,
  },
  customerClearButton: {
    padding: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  customerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerSearchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primaryLight + '15',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  quickAddText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  quickCreateFromPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.successLight + '20',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.success,
    gap: spacing.sm,
  },
  quickCreateFromPhoneTextContainer: {
    flex: 1,
  },
  quickCreateFromPhoneText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.success,
    marginBottom: spacing.xs / 2,
  },
  quickCreateFromPhoneNumber: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  customerItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerItemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  customerItemName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  customerItemPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginTop: 2,
  },
  customerItemPhone: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  customerSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  emptyCustomers: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyCustomersText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyCustomersHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  addCustomerForm: {
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  formButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  formButtonSecondary: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  formButtonSecondaryText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  formButtonPrimary: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  formButtonPrimaryText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  discountRow: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  addDiscountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight + '15',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderStyle: 'dashed',
  },
  addDiscountText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  discountApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.successLight + '20',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.successLight,
  },
  discountAppliedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  discountAppliedText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.success,
  },
  discountForm: {
    padding: spacing.lg,
  },
  discountTypeToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  discountTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  discountTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  discountTypeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  discountTypeTextActive: {
    color: colors.textInverse,
  },
  discountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  discountInput: {
    flex: 1,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlign: 'right',
  },
  discountSuffix: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textMuted,
    paddingRight: spacing.md,
  },
  quickDiscounts: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickDiscountButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  quickDiscountText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  discountPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.successLight + '20',
    borderRadius: borderRadius.lg,
  },
  discountPreviewLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  discountPreviewValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.success,
  },
  applyDiscountButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  applyDiscountButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textInverse,
  },
  // Parked Carts Styles
  emptyParkedCarts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyParkedCartsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyParkedCartsSubtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  parkedCartItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  parkedCartInfo: {
    flex: 1,
  },
  parkedCartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  parkedCartItemCount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  parkedCartCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.full,
  },
  parkedCartCustomerName: {
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  parkedCartTotal: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.success,
    marginVertical: spacing.xs,
  },
  parkedCartMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  parkedCartTime: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  parkedCartBy: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  parkedCartActions: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
  },
  retrieveButton: {
    padding: spacing.xs,
  },
  deleteParkedButton: {
    padding: spacing.xs,
  },
});

