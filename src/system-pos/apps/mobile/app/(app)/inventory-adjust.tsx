import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth';
import { BarcodeScanner } from '../../src/components/BarcodeScanner';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  stock: number;
}

type AdjustmentType = 'add' | 'remove' | 'set';

export default function InventoryAdjustScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { productId: initialProductId } = useLocalSearchParams<{ productId?: string }>();
  const employee = useAuthStore((state) => state.employee);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Fetch products for search
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'search', productSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '10' });
      if (productSearch) params.append('search', productSearch);
      const res = await api.get(`/products?${params}`);
      return res.data.data;
    },
    enabled: productSearch.length > 0,
  });

  const products: Product[] = productsData || [];

  // Fetch initial product if provided
  useQuery({
    queryKey: ['product', initialProductId],
    queryFn: async () => {
      const res = await api.get(`/products/${initialProductId}`);
      const product = res.data.data;
      setSelectedProduct(product);
      return product;
    },
    enabled: !!initialProductId,
  });

  const adjustMutation = useMutation({
    mutationFn: async (data: { productId: string; quantity: number; reason: string; type: string }) => {
      const res = await api.post('/inventory/adjust', data);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert(
        'Succès',
        'Stock ajusté avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de l\'ajustement');
    },
  });

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      const product = response.data.data;
      if (product) {
        setSelectedProduct(product);
        setProductSearch('');
      }
    } catch (error) {
      Alert.alert('Produit non trouvé', `Aucun produit avec le code-barres: ${barcode}`);
    }
  };

  const handleSubmit = () => {
    if (!selectedProduct) {
      Alert.alert('Erreur', 'Veuillez sélectionner un produit');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une quantité valide');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une raison');
      return;
    }

    // Calculate the actual adjustment quantity
    let adjustQuantity = qty;
    if (adjustmentType === 'remove') {
      adjustQuantity = -qty;
    } else if (adjustmentType === 'set') {
      adjustQuantity = qty - (selectedProduct.stock || 0);
    }

    adjustMutation.mutate({
      productId: selectedProduct.id,
      quantity: adjustQuantity,
      reason: reason.trim(),
      type: adjustmentType === 'set' ? 'adjustment' : adjustmentType === 'add' ? 'in' : 'out',
    });
  };

  const getNewStockPreview = () => {
    if (!selectedProduct || !quantity) return null;
    const currentStock = selectedProduct.stock || 0;
    const qty = parseInt(quantity) || 0;

    switch (adjustmentType) {
      case 'add':
        return currentStock + qty;
      case 'remove':
        return Math.max(0, currentStock - qty);
      case 'set':
        return qty;
      default:
        return currentStock;
    }
  };

  const newStock = getNewStockPreview();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustement de stock</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          {/* Product Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produit</Text>

            {selectedProduct ? (
              <View style={styles.selectedProduct}>
                <View style={styles.selectedProductInfo}>
                  <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
                  <Text style={styles.selectedProductSku}>{selectedProduct.sku}</Text>
                  <View style={styles.currentStockBadge}>
                    <Text style={styles.currentStockLabel}>Stock actuel:</Text>
                    <Text style={styles.currentStockValue}>{selectedProduct.stock || 0}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.clearProductButton}
                  onPress={() => setSelectedProduct(null)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    value={productSearch}
                    onChangeText={setProductSearch}
                    placeholder="Rechercher un produit..."
                    placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.scanButtonSmall}
                    onPress={() => setScannerVisible(true)}
                  >
                    <Ionicons name="barcode-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {productSearch.length > 0 && (
                  <View style={styles.searchResults}>
                    {isLoadingProducts ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <TouchableOpacity
                          key={product.id}
                          style={styles.searchResultItem}
                          onPress={() => {
                            setSelectedProduct(product);
                            setProductSearch('');
                          }}
                        >
                          <View>
                            <Text style={styles.searchResultName}>{product.name}</Text>
                            <Text style={styles.searchResultSku}>{product.sku}</Text>
                          </View>
                          <Text style={styles.searchResultStock}>Stock: {product.stock || 0}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noResults}>Aucun produit trouvé</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Adjustment Type */}
          {selectedProduct && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Type d'ajustement</Text>
                <View style={styles.adjustmentTypes}>
                  <TouchableOpacity
                    style={[
                      styles.adjustmentTypeButton,
                      adjustmentType === 'add' && styles.adjustmentTypeButtonActive,
                    ]}
                    onPress={() => setAdjustmentType('add')}
                  >
                    <Ionicons
                      name="add-circle"
                      size={24}
                      color={adjustmentType === 'add' ? colors.textInverse : colors.success}
                    />
                    <Text
                      style={[
                        styles.adjustmentTypeText,
                        adjustmentType === 'add' && styles.adjustmentTypeTextActive,
                      ]}
                    >
                      Ajouter
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.adjustmentTypeButton,
                      styles.adjustmentTypeButtonRemove,
                      adjustmentType === 'remove' && styles.adjustmentTypeButtonActiveRemove,
                    ]}
                    onPress={() => setAdjustmentType('remove')}
                  >
                    <Ionicons
                      name="remove-circle"
                      size={24}
                      color={adjustmentType === 'remove' ? colors.textInverse : colors.danger}
                    />
                    <Text
                      style={[
                        styles.adjustmentTypeText,
                        adjustmentType === 'remove' && styles.adjustmentTypeTextActive,
                      ]}
                    >
                      Retirer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.adjustmentTypeButton,
                      styles.adjustmentTypeButtonSet,
                      adjustmentType === 'set' && styles.adjustmentTypeButtonActiveSet,
                    ]}
                    onPress={() => setAdjustmentType('set')}
                  >
                    <Ionicons
                      name="create"
                      size={24}
                      color={adjustmentType === 'set' ? colors.textInverse : colors.primary}
                    />
                    <Text
                      style={[
                        styles.adjustmentTypeText,
                        adjustmentType === 'set' && styles.adjustmentTypeTextActive,
                      ]}
                    >
                      Définir
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quantity */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {adjustmentType === 'set' ? 'Nouveau stock' : 'Quantité'}
                </Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  selectTextOnFocus
                />

                {newStock !== null && (
                  <View style={styles.stockPreview}>
                    <Text style={styles.stockPreviewLabel}>
                      {adjustmentType === 'set' ? 'Nouveau stock:' : 'Stock après ajustement:'}
                    </Text>
                    <Text style={[
                      styles.stockPreviewValue,
                      newStock < (selectedProduct.stock || 0) && styles.stockPreviewValueDecrease,
                      newStock > (selectedProduct.stock || 0) && styles.stockPreviewValueIncrease,
                    ]}>
                      {newStock}
                    </Text>
                  </View>
                )}
              </View>

              {/* Reason */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Raison</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Ex: Inventaire, casse, vol, réception..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                />

                {/* Quick Reason Buttons */}
                <View style={styles.quickReasons}>
                  {['Inventaire', 'Réception', 'Casse', 'Vol', 'Retour'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.quickReasonButton,
                        reason === r && styles.quickReasonButtonActive,
                      ]}
                      onPress={() => setReason(r)}
                    >
                      <Text
                        style={[
                          styles.quickReasonText,
                          reason === r && styles.quickReasonTextActive,
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Button */}
              <View style={styles.submitContainer}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    adjustMutation.isPending && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={adjustMutation.isPending}
                >
                  {adjustMutation.isPending ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color={colors.textInverse} />
                      <Text style={styles.submitButtonText}>Confirmer l'ajustement</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barcode Scanner */}
      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={(barcode) => handleBarcodeScan(barcode)}
        showModeToggle={false}
        initialMode="manage"
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  scanButtonSmall: {
    padding: spacing.sm,
  },
  searchResults: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  searchResultSku: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  searchResultStock: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  noResults: {
    padding: spacing.md,
    textAlign: 'center',
    color: colors.textMuted,
  },
  selectedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.primaryLight + '15',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  selectedProductSku: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  currentStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  currentStockLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  currentStockValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  clearProductButton: {
    padding: spacing.sm,
  },
  adjustmentTypes: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  adjustmentTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.successLight + '20',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.success,
    gap: spacing.xs,
  },
  adjustmentTypeButtonRemove: {
    backgroundColor: colors.dangerLight + '20',
    borderColor: colors.danger,
  },
  adjustmentTypeButtonSet: {
    backgroundColor: colors.primaryLight + '20',
    borderColor: colors.primary,
  },
  adjustmentTypeButtonActive: {
    backgroundColor: colors.success,
  },
  adjustmentTypeButtonActiveRemove: {
    backgroundColor: colors.danger,
  },
  adjustmentTypeButtonActiveSet: {
    backgroundColor: colors.primary,
  },
  adjustmentTypeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  adjustmentTypeTextActive: {
    color: colors.textInverse,
  },
  quantityInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  stockPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
  },
  stockPreviewLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  stockPreviewValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  stockPreviewValueDecrease: {
    color: colors.danger,
  },
  stockPreviewValueIncrease: {
    color: colors.success,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quickReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickReasonButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.full,
  },
  quickReasonButtonActive: {
    backgroundColor: colors.primary,
  },
  quickReasonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  quickReasonTextActive: {
    color: colors.textInverse,
  },
  submitContainer: {
    padding: spacing.lg,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textInverse,
  },
});

