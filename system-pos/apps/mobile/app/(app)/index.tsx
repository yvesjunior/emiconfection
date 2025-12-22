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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
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

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  sellingPrice: string;
  imageUrl: string | null;
  categories: Array<{ id: string; name: string }>;
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

export default function POSScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const employee = useAuthStore((state) => state.employee);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const appMode = useAppModeStore((state) => state.mode);
  const canSwitchMode = useAppModeStore((state) => state.canSwitchMode);

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
    queryKey: ['products', search, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
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
      // In sell mode, check stock before adding
      const currentStock = product.stock || 0;
      const cartQty = getCartQuantity(product.id);
      const availableQty = currentStock - cartQty;

      if (currentStock <= 0) {
        // Out of stock
        Alert.alert(
          'Rupture de stock',
          `${product.name} est en rupture de stock.`,
          [{ text: 'OK' }]
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
  }, [addItem, appMode, router, getCartQuantity]);

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

  const getStock = (product: Product) => {
    return product.stock || 0;
  };

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
          <Text style={[styles.productStock, styles.productStockOut]}>Rupture</Text>
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
            {appMode === 'manage' ? '✏️ Mode Gestion' : employee?.warehouse?.name || 'POS Mobile'}
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

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'Tout' }, ...categories]}
          keyExtractor={(item) => item.id || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                (selectedCategory === item.id || (item.id === null && !selectedCategory)) &&
                  styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  (selectedCategory === item.id || (item.id === null && !selectedCategory)) &&
                    styles.categoryChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

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
  categoryChipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
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
});

