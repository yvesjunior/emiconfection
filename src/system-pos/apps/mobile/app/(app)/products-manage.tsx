import { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/auth';
import { BarcodeScanner } from '../../src/components/BarcodeScanner';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

interface Category {
  id: string;
  name: string;
}

export default function ProductsManageScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { 
    productId, 
    barcode: initialBarcode,
    duplicate,
    dupName,
    dupSku,
    dupBarcode,
    dupCostPrice,
    dupSellingPrice,
    dupTransportFee,
    dupMinStock,
    dupDescription,
    dupCategories,
  } = useLocalSearchParams<{ 
    productId?: string; 
    barcode?: string;
    duplicate?: string;
    dupName?: string;
    dupSku?: string;
    dupBarcode?: string;
    dupCostPrice?: string;
    dupSellingPrice?: string;
    dupTransportFee?: string;
    dupMinStock?: string;
    dupDescription?: string;
    dupCategories?: string;
  }>();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const employee = useAuthStore((state) => state.employee);

  const isEditing = !!productId;

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [transportFee, setTransportFee] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('10');
  const [stock, setStock] = useState('0');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Check permissions
  const canCreate = hasPermission('products:create');
  const canUpdate = hasPermission('products:update');

  useEffect(() => {
    if (isEditing && !canUpdate) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission de modifier les produits');
      router.back();
    } else if (!isEditing && !canCreate) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission de créer des produits');
      router.back();
    }
  }, [isEditing, canCreate, canUpdate, router]);

  // Load duplicate data if coming from duplication
  useEffect(() => {
    if (duplicate === 'true') {
      if (dupName) setName(dupName);
      if (dupSku) setSku(dupSku);
      if (dupBarcode) setBarcode(dupBarcode);
      if (dupCostPrice) setCostPrice(dupCostPrice);
      if (dupSellingPrice) setSellingPrice(dupSellingPrice);
      if (dupTransportFee) setTransportFee(dupTransportFee);
      if (dupMinStock) setMinStockLevel(dupMinStock);
      if (dupDescription) setDescription(dupDescription);
      if (dupCategories) setSelectedCategoryIds(dupCategories.split(',').filter(Boolean));
    }
  }, [duplicate]);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  const categories: Category[] = categoriesData || [];

  // Fetch product if editing
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}`);
      return res.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (productData) {
      setName(productData.name || '');
      setSku(productData.sku || '');
      setBarcode(productData.barcode || '');
      setDescription(productData.description || '');
      setCostPrice(productData.costPrice?.toString() || '');
      setSellingPrice(productData.sellingPrice?.toString() || '');
      setTransportFee(productData.transportFee?.toString() || '');
      setMinStockLevel(productData.minStockLevel?.toString() || '10');
      setStock(productData.stock?.toString() || '0');
      setSelectedCategoryIds(productData.categories?.map((c: Category) => c.id) || []);
    }
  }, [productData]);

  // Generate SKU
  const generateSku = () => {
    if (name.length >= 3) {
      const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      setSku(`${prefix}-${random}`);
    }
  };

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const res = await api.put(`/products/${productId}`, data);
        return res.data;
      } else {
        const res = await api.post('/products', data);
        return res.data;
      }
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert(
        'Succès',
        isEditing ? 'Produit modifié avec succès' : 'Produit créé avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      const message = error.response?.data?.message || 'Une erreur est survenue';
      Alert.alert('Erreur', message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/products/${productId}`);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Succès', 'Produit supprimé avec succès', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      const message = error.response?.data?.message || 'Une erreur est survenue';
      Alert.alert('Erreur', message);
    },
  });

  const handleDuplicate = () => {
    Alert.alert(
      'Dupliquer le produit',
      `Créer une copie de "${name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Dupliquer',
          onPress: () => {
            // Navigate to create new product with current values pre-filled
            // We'll use a special URL parameter to indicate duplication
            router.replace({
              pathname: '/(app)/products-manage',
              params: {
                duplicate: 'true',
                dupName: `${name} (copie)`,
                dupSku: `${sku}-COPY`,
                dupBarcode: '', // Clear barcode for duplicates
                dupCostPrice: costPrice,
                dupSellingPrice: sellingPrice,
                dupTransportFee: transportFee,
                dupMinStock: minStockLevel,
                dupDescription: description,
                dupCategories: selectedCategoryIds.join(','),
              },
            });
            hapticNotification(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le produit',
      `Êtes-vous sûr de vouloir supprimer "${name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const canDelete = hasPermission('products:delete');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour ajouter des images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission requise', "L'accès à la caméra est nécessaire pour prendre des photos");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Ajouter une image',
      'Choisissez une option',
      [
        { text: 'Prendre une photo', onPress: takePhoto },
        { text: 'Choisir de la galerie', onPress: pickImage },
        ...(imageUri ? [{ text: 'Supprimer', onPress: () => setImageUri(null), style: 'destructive' as const }] : []),
        { text: 'Annuler', style: 'cancel' as const },
      ]
    );
  };

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est requis');
      return;
    }
    if (!sku.trim()) {
      Alert.alert('Erreur', 'Le SKU est requis');
      return;
    }
    if (!sellingPrice || isNaN(Number(sellingPrice))) {
      Alert.alert('Erreur', 'Le prix de vente est requis');
      return;
    }

    const data: any = {
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim() || null,
      description: description.trim() || null,
      costPrice: costPrice ? Number(costPrice) : null,
      sellingPrice: Number(sellingPrice),
      transportFee: transportFee ? Number(transportFee) : null,
      minStockLevel: Number(minStockLevel) || 10,
      categoryIds: selectedCategoryIds,
      isActive: true,
    };

    // Include stock only when creating
    if (!isEditing) {
      data.stock = Number(stock) || 0;
    }

    saveMutation.mutate(data);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (isEditing && isLoadingProduct) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, saveMutation.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Ionicons name="checkmark" size={24} color={colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Product Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageContainer} onPress={showImageOptions}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.imagePlaceholderText}>Ajouter une image</Text>
                </View>
              )}
              <View style={styles.imageEditBadge}>
                <Ionicons name="pencil" size={14} color={colors.textInverse} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de base</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom du produit *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Lait en poudre Nido 400g"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>SKU *</Text>
              <View style={styles.skuContainer}>
                <TextInput
                  style={[styles.input, styles.skuInput]}
                  value={sku}
                  onChangeText={setSku}
                  placeholder="Ex: NID-400G"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity style={styles.generateButton} onPress={generateSku}>
                  <Ionicons name="refresh" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Code-barres</Text>
              <View style={styles.barcodeContainer}>
                <TextInput
                  style={[styles.input, styles.barcodeInput]}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="Scanner ou saisir manuellement"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => setScannerVisible(true)}
                >
                  <Ionicons name="barcode-outline" size={24} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description du produit..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Categories Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégories</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.categorySelectorText}>
                {selectedCategoryIds.length > 0
                  ? `${selectedCategoryIds.length} catégorie(s) sélectionnée(s)`
                  : 'Sélectionner des catégories'}
              </Text>
              <Ionicons
                name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.categoryPicker}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategoryIds.includes(category.id) && styles.categoryOptionSelected,
                    ]}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        selectedCategoryIds.includes(category.id) &&
                          styles.categoryOptionTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                    {selectedCategoryIds.includes(category.id) && (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
                {categories.length === 0 && (
                  <Text style={styles.noCategoriesText}>Aucune catégorie disponible</Text>
                )}
              </View>
            )}
          </View>

          {/* Pricing Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tarification</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Prix d'achat</Text>
                <TextInput
                  style={styles.input}
                  value={costPrice}
                  onChangeText={setCostPrice}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Prix de vente *</Text>
                <TextInput
                  style={styles.input}
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frais de transport</Text>
              <TextInput
                style={styles.input}
                value={transportFee}
                onChangeText={setTransportFee}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Stock Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock</Text>

            <View style={styles.row}>
              {!isEditing && (
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Stock initial</Text>
                  <TextInput
                    style={styles.input}
                    value={stock}
                    onChangeText={setStock}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={[styles.inputGroup, isEditing ? styles.fullWidth : styles.halfWidth]}>
                <Text style={styles.label}>Stock minimum</Text>
                <TextInput
                  style={styles.input}
                  value={minStockLevel}
                  onChangeText={setMinStockLevel}
                  placeholder="10"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {isEditing && (
              <View style={styles.stockInfo}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
                <Text style={styles.stockInfoText}>
                  Pour modifier le stock, utilisez la fonction d'ajustement d'inventaire
                </Text>
              </View>
            )}
          </View>

          {/* Delete Button */}
          {isEditing && canDelete && (
            <View style={styles.dangerSection}>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.duplicateButton}
                  onPress={handleDuplicate}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.primary} />
                  <Text style={styles.duplicateButtonText}>Dupliquer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                      <Text style={styles.deleteButtonText}>Supprimer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.deleteWarning}>
                Cette action est irréversible et supprimera toutes les données associées
              </Text>
            </View>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Barcode Scanner */}
      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={(scannedBarcode) => {
          setBarcode(scannedBarcode);
        }}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textMuted,
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
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.primaryLight,
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
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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
  skuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  skuInput: {
    flex: 1,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  fullWidth: {
    flex: 1,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categorySelectorText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  categoryPicker: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryOptionSelected: {
    backgroundColor: colors.primaryLight + '20',
  },
  categoryOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  categoryOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  noCategoriesText: {
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  stockInfoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  dangerSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.dangerLight + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.dangerLight,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  duplicateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  duplicateButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.danger,
  },
  deleteWarning: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  imageEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});

