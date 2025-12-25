import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};
import { useCartStore } from '../../src/store/cart';
import { useAuthStore } from '../../src/store/auth';
import { useAppModeStore } from '../../src/store/appMode';
import { BarcodeScanner, ScanMode } from '../../src/components/BarcodeScanner';
import api from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/utils';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

interface InventoryItem {
  id: string;
  quantity: string;
  warehouse: {
    id: string;
    name: string;
    code: string;
    type: 'BOUTIQUE' | 'STOCKAGE';
  };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: string;
  imageUrl: string | null;
  categories: Array<{ id: string; name: string }>;
  stock: number;
  inventory?: InventoryItem[];
}

interface Category {
  id: string;
  name: string;
}

export default function POSScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  
  // Number of quick filter categories to show (rest goes in modal)
  const QUICK_FILTER_COUNT = 2;
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const employee = useAuthStore((state) => state.employee);
  const getEffectiveWarehouse = useAuthStore((state) => state.getEffectiveWarehouse);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const appMode = useAppModeStore((state) => state.mode);
  const canSwitchMode = useAppModeStore((state) => state.canSwitchMode);
  
  const currentWarehouse = getEffectiveWarehouse();

  // Check if user can manage products
  const canManageProducts = hasPermission('products:create') || hasPermission('products:update');
  
  // In sell mode, always scan for selling. In manage mode, allow mode toggle if user has permission
  const showModeToggle = appMode === 'manage' && canManageProducts;

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  // Fetch products
  const { data: productsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products', search, selectedCategories],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.append('search', search);
      // Support multiple categories
      selectedCategories.forEach(catId => params.append('categoryId', catId));
      const res = await api.get(`/products?${params}`);
      return res.data.data;
    },
  });

  const categories: Category[] = categoriesData || [];
  const products: Product[] = productsData || [];

  // Get current quantity in cart for a product
  const getCartQuantity = useCallback((productId: string) => {
    const item = cartItems.find((i) => i.productId === productId);
    return item?.quantity || 0;
  }, [cartItems]);

  const handleAddToCart = useCallback((product: Product) => {
    if (appMode === 'manage') {
      // In manage mode, open product for editing
      router.push(`/(app)/products-manage?productId=${product.id}`);
      hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Check if current connected warehouse is a Boutique
      if (!isBoutiqueWarehouse) {
        Alert.alert(
          'Vente impossible',
          `Vous êtes connecté à l'entrepôt "${currentWarehouse?.name || 'Stockage'}". Les ventes ne peuvent être effectuées que depuis un entrepôt de type Boutique. Veuillez vous connecter à un entrepôt Boutique pour effectuer des ventes.`,
          [{ text: 'OK' }]
        );
        hapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      }

      // In sell mode, check stock before adding
      const currentStock = getStock(product);
      const cartQty = getCartQuantity(product.id);
      const availableQty = currentStock - cartQty;

      if (currentStock <= 0) {
        // Out of stock - offer to check other warehouses or request transfer
        Alert.alert(
          'Rupture de stock',
          `${product.name} est en rupture de stock dans votre boutique.`,
          [
            { text: 'Voir autres entrepôts', onPress: () => {
              setSelectedProductForStock(product);
              setShowStockModal(true);
            }},
            { text: 'OK', style: 'cancel' }
          ]
        );
        hapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      }

      if (availableQty <= 0) {
        // Already added max available to cart
        Alert.alert(
          'Stock insuffisant',
          `Vous avez déjà ajouté tout le stock disponible (${currentStock}) au panier.`,
          [{ text: 'OK' }]
        );
        hapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      }

      // Add to cart
      addItem({
        id: product.id,
        name: product.name,
        sku: product.sku,
        sellingPrice: Number(product.sellingPrice),
      });
      hapticImpact(Haptics.ImpactFeedbackStyle.Medium);

      // Warn if stock is getting low (less than 5 remaining after this add)
      if (availableQty <= 5 && availableQty > 1) {
        // Light haptic to indicate low stock warning
        setTimeout(() => {
          hapticImpact(Haptics.ImpactFeedbackStyle.Light);
        }, 100);
      }
    }
  }, [addItem, appMode, router, getCartQuantity, isBoutiqueWarehouse]);

  const handleBarcodeScan = useCallback(async (barcode: string, mode: ScanMode) => {
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data.data;
      
      if (mode === 'sell') {
        // Sell mode: Add to cart
        if (product) {
          handleAddToCart(product);
          Alert.alert('Ajouté au panier', `${product.name} ajouté au panier`);
        }
      } else {
        // Manage mode: Navigate to edit
        if (product) {
          router.push(`/(app)/products-manage?productId=${product.id}`);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        if (mode === 'sell') {
          Alert.alert('Produit non trouvé', `Aucun produit avec le code-barres: ${barcode}`);
        } else {
          // Manage mode: Navigate to create with barcode pre-filled
          Alert.alert(
            'Nouveau produit',
            `Aucun produit trouvé avec ce code-barres. Voulez-vous le créer ?`,
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Créer',
                onPress: () => router.push(`/(app)/products-manage?barcode=${barcode}`),
              },
            ]
          );
        }
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la recherche');
      }
    }
  }, [handleAddToCart, router]);

  // Get stock available in the current connected warehouse
  const getStock = (product: Product) => {
    if (!currentWarehouse) return 0;
    
    // If product has inventory by warehouse, use that
    if (product.inventory && product.inventory.length > 0) {
      const warehouseInventory = product.inventory.find(
        (inv) => inv.warehouse.id === currentWarehouse.id
      );
      return warehouseInventory ? Number(warehouseInventory.quantity || 0) : 0;
    }
    
    // Fallback to product.stock
    return product.stock || 0;
  };

  // Check if current connected warehouse is a Boutique
  const isBoutiqueWarehouse = currentWarehouse?.type === 'BOUTIQUE' || (!currentWarehouse?.type && currentWarehouse);

  // Handle barcode input submission
  const handleBarcodeSubmit = useCallback(async () => {
    if (!barcodeInput.trim()) return;
    
    const barcode = barcodeInput.trim();
    setBarcodeInput('');
    
    // Use the same logic as scanner
    await handleBarcodeScan(barcode, appMode === 'manage' ? 'manage' : 'sell');
  }, [barcodeInput, appMode, handleBarcodeScan]);

  const renderProduct = ({ item }: { item: Product }) => {
    const stock = getStock(item);
    const cartQty = getCartQuantity(item.id);
    const availableStock = stock - cartQty;
    const isOutOfStock = stock <= 0;
    const isFullyInCart = availableStock <= 0 && stock > 0;
    const isLowStock = stock > 0 && stock <= 5;
    const isManageMode = appMode === 'manage';
    // In manage mode, products are always tappable (for editing)
    const isDisabled = !isManageMode && (isOutOfStock || isFullyInCart);

    return (
      <TouchableOpacity
        style={[
          styles.productCard, 
          isDisabled && styles.productCardDisabled,
          isManageMode && styles.productCardManage,
        ]}
        onPress={() => !isDisabled && handleAddToCart(item)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {/* Cart quantity badge */}
        {cartQty > 0 && !isManageMode && (
          <View style={styles.cartQtyBadge}>
            <Text style={styles.cartQtyBadgeText}>{cartQty}</Text>
          </View>
        )}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={[styles.productImage, isDisabled && styles.productImageDisabled]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productIcon, isManageMode && styles.productIconManage]}>
            <Ionicons
              name={isManageMode ? 'create-outline' : 'cube-outline'}
              size={24}
              color={isManageMode ? colors.success : (isOutOfStock ? colors.textMuted : colors.primary)}
            />
          </View>
        )}
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productSku}>{item.sku}</Text>
        <Text style={styles.productPrice}>
          {formatCurrency(Number(item.sellingPrice))}
        </Text>
        {isManageMode ? (
          <Text style={styles.productEdit}>Appuyer pour modifier</Text>
        ) : isOutOfStock ? (
          <View>
            <Text style={[styles.productStock, styles.productStockOut]}>Rupture</Text>
            {item.inventory && item.inventory.length > 0 && (
              <TouchableOpacity
                style={styles.viewStocksButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedProductForStock(item);
                  setShowStockModal(true);
                }}
              >
                <Ionicons name="eye-outline" size={14} color={colors.primary} />
                <Text style={styles.viewStocksButtonText}>Voir autres entrepôts</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : isFullyInCart ? (
          <Text style={[styles.productStock, styles.productStockInCart]}>Dans panier</Text>
        ) : (
          <View style={styles.stockContainer}>
            <Text style={[styles.productStock, isLowStock && styles.productStockLow]}>
              {availableStock} dispo
            </Text>
            {isLowStock && (
              <Ionicons name="warning" size={12} color={colors.warning} style={{ marginLeft: 4 }} />
            )}
            {item.inventory && item.inventory.length > 1 && (
              <TouchableOpacity
                style={styles.viewStocksButtonSmall}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedProductForStock(item);
                  setShowStockModal(true);
                }}
              >
                <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {employee?.fullName?.split(' ')[0]}</Text>
          <Text style={[styles.shiftInfo, appMode === 'manage' && styles.shiftInfoManage]}>
            {appMode === 'manage' ? '✏️ Mode Gestion' : currentWarehouse?.name || 'POS Mobile'}
          </Text>
        </View>
        {appMode === 'sell' ? (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/(app)/cart')}
          >
            <Ionicons name="cart" size={24} color={colors.primary} />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.cartButton, styles.addButton]}
            onPress={() => router.push('/(app)/products-manage')}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TouchableOpacity onPress={() => setShowBarcodeInput(!showBarcodeInput)}>
            <Ionicons 
              name={showBarcodeInput ? 'barcode' : 'search'} 
              size={20} 
              color={showBarcodeInput ? colors.primary : colors.textMuted} 
            />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder={showBarcodeInput ? "Entrer le code-barres..." : "Rechercher par nom..."}
            value={showBarcodeInput ? barcodeInput : search}
            onChangeText={showBarcodeInput ? setBarcodeInput : setSearch}
            placeholderTextColor={colors.textMuted}
            keyboardType={showBarcodeInput ? 'number-pad' : 'default'}
            returnKeyType={showBarcodeInput ? 'search' : 'done'}
            onSubmitEditing={showBarcodeInput ? handleBarcodeSubmit : undefined}
          />
          {(showBarcodeInput ? barcodeInput.length > 0 : search.length > 0) && (
            <TouchableOpacity onPress={() => showBarcodeInput ? setBarcodeInput('') : setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          {showBarcodeInput && barcodeInput.length > 0 && (
            <TouchableOpacity 
              onPress={handleBarcodeSubmit}
              style={styles.searchSubmitButton}
            >
              <Ionicons name="arrow-forward-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={() => setScannerVisible(true)}
        >
          <Ionicons name="camera-outline" size={24} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Categories - Quick Pills + More Modal */}
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {/* Quick filter categories (first N) */}
          {categories.slice(0, QUICK_FILTER_COUNT).map((cat: Category) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
                onPress={() => {
                  setSelectedCategories(prev =>
                    prev.includes(cat.id)
                      ? prev.filter(id => id !== cat.id)
                      : [...prev, cat.id]
                  );
                  hapticImpact(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color={colors.textInverse} style={{ marginRight: 4 }} />
                )}
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* "More" button - only show if there are more categories */}
          {categories.length > QUICK_FILTER_COUNT && (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                styles.categoryChipMore,
                // Highlight if any hidden categories are selected
                selectedCategories.some(id => 
                  !categories.slice(0, QUICK_FILTER_COUNT).find((c: Category) => c.id === id)
                ) && styles.categoryChipMoreActive,
              ]}
              onPress={() => {
                setCategoryModalVisible(true);
                hapticImpact(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons 
                name="options-outline" 
                size={16} 
                color={
                  selectedCategories.some(id => 
                    !categories.slice(0, QUICK_FILTER_COUNT).find((c: Category) => c.id === id)
                  ) ? colors.textInverse : colors.primary
                } 
                style={{ marginRight: 4 }} 
              />
              <Text
                style={[
                  styles.categoryChipText,
                  styles.categoryChipMoreText,
                  selectedCategories.some(id => 
                    !categories.slice(0, QUICK_FILTER_COUNT).find((c: Category) => c.id === id)
                  ) && styles.categoryChipTextActive,
                ]}
              >
                Plus
              </Text>
              {/* Badge showing count of hidden selected categories */}
              {(() => {
                const hiddenSelectedCount = selectedCategories.filter(id =>
                  !categories.slice(0, QUICK_FILTER_COUNT).find((c: Category) => c.id === id)
                ).length;
                return hiddenSelectedCount > 0 ? (
                  <View style={styles.moreBadge}>
                    <Text style={styles.moreBadgeText}>{hiddenSelectedCount}</Text>
                  </View>
                ) : null;
              })()}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Catégories</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* Selected count & clear button */}
          <View style={styles.modalSubheader}>
            <Text style={styles.modalSubtitle}>
              {selectedCategories.length === 0 
                ? 'Aucun filtre actif' 
                : `${selectedCategories.length} filtre${selectedCategories.length > 1 ? 's' : ''} actif${selectedCategories.length > 1 ? 's' : ''}`}
            </Text>
            {selectedCategories.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategories([]);
                  hapticImpact(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.clearButton}>Effacer tout</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.modalContent}>
            {categories.map((cat: Category) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.modalCategoryItem,
                    isSelected && styles.modalCategoryItemActive,
                  ]}
                  onPress={() => {
                    setSelectedCategories(prev =>
                      prev.includes(cat.id)
                        ? prev.filter(id => id !== cat.id)
                        : [...prev, cat.id]
                    );
                    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.modalCategoryText,
                      isSelected && styles.modalCategoryTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxActive,
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Apply button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                setCategoryModalVisible(false);
                hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <Text style={styles.applyButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Products Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.productsList}
        columnWrapperStyle={styles.productsRow}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>
              {isLoading ? 'Chargement...' : 'Aucun produit trouvé'}
            </Text>
          </View>
        }
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleBarcodeScan}
        showModeToggle={showModeToggle}
        initialMode={appMode === 'manage' ? 'manage' : 'sell'}
      />

      {/* Stock by Warehouse Modal */}
      <Modal
        visible={showStockModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowStockModal(false);
          setSelectedProductForStock(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Stocks par entrepôt</Text>
              {selectedProductForStock && (
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {selectedProductForStock.name}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowStockModal(false);
                setSelectedProductForStock(null);
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={selectedProductForStock?.inventory || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: InventoryItem }) => {
              const qty = Number(item.quantity || 0);
              const isBoutique = item.warehouse.type === 'BOUTIQUE';
              const isStockage = item.warehouse.type === 'STOCKAGE';
              const isCurrentWarehouse = item.warehouse.id === currentWarehouse?.id;
              
              return (
                <View style={[
                  styles.stockItem,
                  isCurrentWarehouse && styles.stockItemCurrent
                ]}>
                  <View style={styles.stockItemHeader}>
                    <View style={styles.stockItemInfo}>
                      <View style={styles.stockItemTitleRow}>
                        <Text style={styles.stockWarehouseName}>{item.warehouse.name}</Text>
                        {isCurrentWarehouse && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Actuel</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.stockWarehouseCode}>{item.warehouse.code}</Text>
                    </View>
                    <View style={[
                      styles.stockTypeBadge,
                      isBoutique ? styles.stockTypeBadgeBoutique : styles.stockTypeBadgeStockage
                    ]}>
                      <Ionicons
                        name={isBoutique ? 'storefront' : 'archive'}
                        size={14}
                        color={isBoutique ? colors.primary : colors.success}
                      />
                      <Text style={[
                        styles.stockTypeBadgeText,
                        isBoutique ? styles.stockTypeBadgeTextBoutique : styles.stockTypeBadgeTextStockage
                      ]}>
                        {isBoutique ? 'Boutique' : 'Stockage'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.stockQuantityRow}>
                    <Text style={styles.stockQuantityLabel}>Quantité disponible:</Text>
                    <Text style={[
                      styles.stockQuantity,
                      qty === 0 && styles.stockQuantityZero,
                      qty > 0 && qty <= 5 && styles.stockQuantityLow
                    ]}>
                      {qty}
                    </Text>
                  </View>
                  {isBoutique && qty === 0 && isCurrentWarehouse && (
                    <TouchableOpacity
                      style={styles.transferButton}
                      onPress={async () => {
                        // Find a stockage warehouse with stock
                        const stockageInv = selectedProductForStock?.inventory?.find((inv: InventoryItem) => 
                          inv.warehouse.type === 'STOCKAGE' && Number(inv.quantity) > 0
                        );
                        if (stockageInv) {
                          setShowStockModal(false);
                          Alert.alert(
                            'Demander un transfert',
                            `Transférer depuis ${stockageInv.warehouse.name} vers ${item.warehouse.name} ?`,
                            [
                              { text: 'Annuler', style: 'cancel' },
                              {
                                text: 'Demander',
                                onPress: async () => {
                                  try {
                                    await api.post('/inventory/transfer', {
                                      productId: selectedProductForStock?.id,
                                      fromWarehouseId: stockageInv.warehouse.id,
                                      toWarehouseId: item.warehouse.id,
                                      quantity: Number(stockageInv.quantity),
                                      notes: 'Transfert demandé depuis le POS',
                                    });
                                    hapticNotification(Haptics.NotificationFeedbackType.Success);
                                    queryClient.invalidateQueries({ queryKey: ['products'] });
                                    Alert.alert('Succès', 'Transfert demandé avec succès', [
                                      { text: 'OK', onPress: () => {
                                        setShowStockModal(false);
                                        setSelectedProductForStock(null);
                                      }}
                                    ]);
                                  } catch (error: any) {
                                    hapticNotification(Haptics.NotificationFeedbackType.Error);
                                    const message = error.response?.data?.message || 'Une erreur est survenue';
                                    Alert.alert('Erreur', message);
                                  }
                                }
                              }
                            ]
                          );
                        } else {
                          Alert.alert('Aucun stock disponible', 'Aucun entrepôt Stockage n\'a de stock disponible pour ce produit');
                        }
                      }}
                    >
                      <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
                      <Text style={styles.transferButtonText}>Demander un transfert</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            contentContainerStyle={styles.stockListContent}
            ListEmptyComponent={
              <View style={styles.emptyStockState}>
                <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyStockStateText}>Aucun stock enregistré</Text>
              </View>
            }
          />
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
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  shiftInfo: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shiftInfoManage: {
    color: colors.success,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.success,
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  searchSubmitButton: {
    marginLeft: spacing.xs,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  categoriesContainer: {
    marginBottom: spacing.sm,
  },
  categoriesList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipMore: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  categoryChipMoreActive: {
    backgroundColor: colors.primary,
    borderStyle: 'solid',
  },
  categoryChipMoreText: {
    color: colors.primary,
  },
  moreBadge: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.textInverse,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  clearButton: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  modalCategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCategoryItemActive: {
    backgroundColor: colors.primaryLight + '10',
  },
  modalCategoryText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  modalCategoryTextActive: {
    fontWeight: '600',
    color: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  applyButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textInverse,
  },
  productsList: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  productsRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  productCardDisabled: {
    opacity: 0.5,
  },
  productCardManage: {
    borderWidth: 1,
    borderColor: colors.successLight,
  },
  productImage: {
    width: '100%',
    height: 80,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  productImageDisabled: {
    opacity: 0.5,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  productIconManage: {
    backgroundColor: colors.successLight + '20',
  },
  productName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productSku: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  productPrice: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  productStock: {
    fontSize: fontSize.xs,
    color: colors.success,
    marginTop: 4,
  },
  productStockOut: {
    color: colors.danger,
  },
  productStockInCart: {
    color: colors.primary,
    fontWeight: '600',
  },
  productStockLow: {
    color: colors.warning,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cartQtyBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartQtyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textInverse,
  },
  productEdit: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  viewStocksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  viewStocksButtonText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  viewStocksButtonSmall: {
    marginLeft: spacing.xs,
  },
  // Stock modal styles
  stockListContent: {
    padding: spacing.lg,
  },
  stockItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stockItemCurrent: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight + '05',
  },
  stockItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stockItemInfo: {
    flex: 1,
  },
  stockItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stockWarehouseName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  currentBadge: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  stockWarehouseCode: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stockTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  stockTypeBadgeBoutique: {
    backgroundColor: colors.primaryLight + '20',
  },
  stockTypeBadgeStockage: {
    backgroundColor: colors.successLight + '20',
  },
  stockTypeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  stockTypeBadgeTextBoutique: {
    color: colors.primary,
  },
  stockTypeBadgeTextStockage: {
    color: colors.success,
  },
  stockQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  stockQuantityLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stockQuantity: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.success,
  },
  stockQuantityZero: {
    color: colors.danger,
  },
  stockQuantityLow: {
    color: colors.warning,
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  transferButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyStockState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStockStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});

