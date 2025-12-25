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
  Modal,
  FlatList,
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
  const [categorySearch, setCategorySearch] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromWarehouse, setTransferFromWarehouse] = useState<string | null>(null);
  const [transferQuantity, setTransferQuantity] = useState('');
  const [editingWarehouseStock, setEditingWarehouseStock] = useState<{ warehouseId: string; quantity: string } | null>(null);

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
  
  // Filter categories based on search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

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
      if (!productId) {
        throw new Error('Product ID is required');
      }
      const res = await api.delete(`/products/${productId}`);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      // Invalidate all product queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.removeQueries({ queryKey: ['product', productId] });
      queryClient.removeQueries({ queryKey: ['products'] });
      // Force refetch to ensure the product is removed from the list
      queryClient.refetchQueries({ queryKey: ['products'] });
      Alert.alert('Succès', 'Produit supprimé avec succès', [
        { text: 'OK', onPress: () => router.replace('/(app)/') },
      ]);
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      console.error('Delete error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      let message = 'Une erreur est survenue lors de la suppression';
      if (error.response) {
        if (error.response.status === 403) {
          message = 'Vous n\'avez pas la permission de supprimer des produits';
        } else if (error.response.status === 404) {
          message = 'Produit introuvable';
        } else if (error.response.status === 400) {
          // Bad request - product used in sales or purchase orders
          message = error.response.data?.message || 'Ce produit ne peut pas être supprimé car il a été utilisé dans des ventes ou des commandes d\'achat.';
        } else if (error.response.data?.message) {
          message = error.response.data.message;
        }
      } else if (error.message) {
        message = error.message;
      }
      
      Alert.alert('Impossible de supprimer', message);
    },
  });

  // Update stock for specific warehouse mutation
  const updateWarehouseStockMutation = useMutation({
    mutationFn: async ({ warehouseId, quantity }: { warehouseId: string; quantity: number }) => {
      const res = await api.put(`/products/${productId}`, {
        warehouseId,
        stock: quantity,
      });
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingWarehouseStock(null);
      Alert.alert('Succès', 'Stock mis à jour avec succès');
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
      `Êtes-vous sûr de vouloir supprimer définitivement "${name}" ?\n\nCette action est irréversible et supprimera toutes les données associées (catégories, stocks).\n\nNote: Le produit ne peut pas être supprimé s'il a été utilisé dans des ventes ou des commandes d'achat.`,
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
      stock: Number(stock) || 0,
    };

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
              onPress={() => {
                setShowCategoryPicker(!showCategoryPicker);
                if (showCategoryPicker) {
                  setCategorySearch(''); // Clear search when closing
                }
              }}
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
                {/* Search Input */}
                <View style={styles.categorySearchContainer}>
                  <Ionicons name="search" size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.categorySearchInput}
                    placeholder="Rechercher une catégorie..."
                    placeholderTextColor={colors.textMuted}
                    value={categorySearch}
                    onChangeText={setCategorySearch}
                    autoCapitalize="none"
                  />
                  {categorySearch.length > 0 && (
                    <TouchableOpacity onPress={() => setCategorySearch('')}>
                      <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Categories List */}
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
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
                  ))
                ) : (
                  <Text style={styles.noCategoriesText}>
                    {categorySearch ? 'Aucune catégorie trouvée' : 'Aucune catégorie disponible'}
                  </Text>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Stock</Text>
              {isEditing && productData?.inventory && (
                <TouchableOpacity
                  style={styles.viewStocksButton}
                  onPress={() => setShowStockModal(true)}
                >
                  <Ionicons name="eye-outline" size={18} color={colors.primary} />
                  <Text style={styles.viewStocksButtonText}>Voir par entrepôt</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Stock {isEditing ? 'actuel' : 'initial'}</Text>
                <TextInput
                  style={styles.input}
                  value={stock}
                  onChangeText={setStock}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  editable={true}
                />
                {isEditing && productData?.inventory && (
                  <Text style={styles.helperText}>
                    Total: {productData.inventory.reduce((sum: number, inv: InventoryItem) => 
                      sum + Number(inv.quantity || 0), 0
                    )}
                  </Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
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
                Cette action supprimera définitivement le produit et toutes ses données (catégories, stocks). Le produit ne peut pas être supprimé s'il a été utilisé dans des ventes ou des commandes d'achat.
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

      {/* Stock by Warehouse Modal */}
      <Modal
        visible={showStockModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStockModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Stocks par entrepôt</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowStockModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={productData?.inventory || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: InventoryItem }) => {
              const qty = Number(item.quantity || 0);
              const isBoutique = item.warehouse.type === 'BOUTIQUE';
              const isStockage = item.warehouse.type === 'STOCKAGE';
              const currentWarehouse = employee?.warehouse || null;
              const isCurrentWarehouse = currentWarehouse?.id === item.warehouse.id;
              const canEdit = hasPermission('inventory:adjust') && isCurrentWarehouse;
              
              return (
                <View style={[
                  styles.stockItem,
                  !isCurrentWarehouse && styles.stockItemReadOnly
                ]}>
                  <View style={styles.stockItemHeader}>
                    <View style={styles.stockItemInfo}>
                      <View style={styles.stockItemTitleRow}>
                        <Text style={styles.stockWarehouseName}>{item.warehouse.name}</Text>
                        {isCurrentWarehouse && (
                          <View style={styles.currentWarehouseBadge}>
                            <Text style={styles.currentWarehouseBadgeText}>Connecté</Text>
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
                    {editingWarehouseStock?.warehouseId === item.warehouse.id ? (
                      <View style={styles.stockEditContainer}>
                        <TextInput
                          style={styles.stockEditInput}
                          value={editingWarehouseStock.quantity}
                          onChangeText={(text) => setEditingWarehouseStock({ 
                            warehouseId: item.warehouse.id, 
                            quantity: text 
                          })}
                          placeholder="0"
                          keyboardType="numeric"
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.stockEditSaveButton}
                          onPress={() => {
                            const newQty = Number(editingWarehouseStock.quantity);
                            if (isNaN(newQty) || newQty < 0) {
                              Alert.alert('Erreur', 'Veuillez entrer une quantité valide');
                              return;
                            }
                            updateWarehouseStockMutation.mutate({
                              warehouseId: item.warehouse.id,
                              quantity: newQty,
                            });
                          }}
                          disabled={updateWarehouseStockMutation.isPending}
                        >
                          {updateWarehouseStockMutation.isPending ? (
                            <ActivityIndicator size="small" color={colors.textInverse} />
                          ) : (
                            <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.stockEditCancelButton}
                          onPress={() => setEditingWarehouseStock(null)}
                        >
                          <Ionicons name="close" size={16} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <Text style={[
                          styles.stockQuantity,
                          qty === 0 && styles.stockQuantityZero,
                          qty > 0 && qty <= 5 && styles.stockQuantityLow
                        ]}>
                          {qty}
                        </Text>
                        {canEdit ? (
                          <TouchableOpacity
                            style={styles.stockEditButton}
                            onPress={() => setEditingWarehouseStock({ 
                              warehouseId: item.warehouse.id, 
                              quantity: qty.toString() 
                            })}
                          >
                            <Ionicons name="pencil" size={14} color={colors.primary} />
                          </TouchableOpacity>
                        ) : !isCurrentWarehouse && (
                          <View style={styles.readOnlyBadge}>
                            <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.readOnlyBadgeText}>Lecture seule</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                  {isBoutique && qty === 0 && !editingWarehouseStock && (
                    <TouchableOpacity
                      style={styles.transferButton}
                      onPress={() => {
                        setShowStockModal(false);
                        // Find a stockage warehouse with stock
                        const stockageInv = productData?.inventory?.find((inv: InventoryItem) => 
                          inv.warehouse.type === 'STOCKAGE' && Number(inv.quantity) > 0
                        );
                        if (stockageInv) {
                          setTransferFromWarehouse(stockageInv.warehouse.id);
                          setShowTransferModal(true);
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

      {/* Transfer Stock Modal */}
      <Modal
        visible={showTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowTransferModal(false);
          setTransferFromWarehouse(null);
          setTransferQuantity('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Demander un transfert</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowTransferModal(false);
                setTransferFromWarehouse(null);
                setTransferQuantity('');
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>
              Transférer depuis un entrepôt Stockage vers une Boutique
            </Text>

            {/* Source Warehouse Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Depuis (Stockage) *</Text>
              <FlatList
                data={productData?.inventory?.filter((inv: InventoryItem) => 
                  inv.warehouse.type === 'STOCKAGE' && Number(inv.quantity) > 0
                ) || []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }: { item: InventoryItem }) => (
                  <TouchableOpacity
                    style={[
                      styles.warehouseOption,
                      transferFromWarehouse === item.warehouse.id && styles.warehouseOptionSelected
                    ]}
                    onPress={() => setTransferFromWarehouse(item.warehouse.id)}
                  >
                    <View style={styles.warehouseOptionInfo}>
                      <Text style={styles.warehouseOptionName}>{item.warehouse.name}</Text>
                      <Text style={styles.warehouseOptionStock}>
                        Disponible: {Number(item.quantity)}
                      </Text>
                    </View>
                    {transferFromWarehouse === item.warehouse.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Destination Warehouse Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vers (Boutique) *</Text>
              <Text style={styles.helperText}>
                {employee?.warehouse?.name || 'Votre entrepôt actuel'}
              </Text>
            </View>

            {/* Quantity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantité *</Text>
              <TextInput
                style={styles.input}
                value={transferQuantity}
                onChangeText={setTransferQuantity}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
              {transferFromWarehouse && (
                <Text style={{ fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs }}>
                  Maximum disponible: {
                    productData?.inventory?.find((inv: InventoryItem) => 
                      inv.warehouse.id === transferFromWarehouse
                    )?.quantity || 0
                  }
                </Text>
              )}
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Raison du transfert..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!transferFromWarehouse || !transferQuantity || Number(transferQuantity) <= 0) &&
                  styles.submitButtonDisabled
              ]}
              onPress={async () => {
                if (!transferFromWarehouse || !transferQuantity || Number(transferQuantity) <= 0) {
                  Alert.alert('Erreur', 'Veuillez remplir tous les champs requis');
                  return;
                }

                const fromInv = productData?.inventory?.find((inv: InventoryItem) => 
                  inv.warehouse.id === transferFromWarehouse
                );
                const maxQty = Number(fromInv?.quantity || 0);

                if (Number(transferQuantity) > maxQty) {
                  Alert.alert('Erreur', `Quantité insuffisante. Maximum: ${maxQty}`);
                  return;
                }

                try {
                  const currentWarehouse = employee?.warehouse;
                  if (!currentWarehouse) {
                    Alert.alert('Erreur', 'Aucun entrepôt sélectionné');
                    return;
                  }

                  // Create transfer request instead of direct transfer
                  await api.post('/inventory/transfer-requests', {
                    productId: productId,
                    fromWarehouseId: transferFromWarehouse,
                    toWarehouseId: currentWarehouse.id,
                    quantity: Number(transferQuantity),
                    notes: 'Transfert demandé depuis l\'application mobile',
                  });

                  hapticNotification(Haptics.NotificationFeedbackType.Success);
                  Alert.alert(
                    'Demande créée',
                    'Votre demande de transfert a été créée. Elle sera examinée par un Manager.',
                    [
                      { text: 'OK', onPress: () => {
                        setShowTransferModal(false);
                        setTransferFromWarehouse(null);
                        setTransferQuantity('');
                        queryClient.invalidateQueries({ queryKey: ['product', productId] });
                        queryClient.invalidateQueries({ queryKey: ['transfer-requests'] });
                      }}
                    ]
                  );
                } catch (error: any) {
                  hapticNotification(Haptics.NotificationFeedbackType.Error);
                  const message = error.response?.data?.message || 'Une erreur est survenue';
                  Alert.alert('Erreur', message);
                }
              }}
              disabled={!transferFromWarehouse || !transferQuantity || Number(transferQuantity) <= 0}
            >
              <Text style={styles.submitButtonText}>Demander le transfert</Text>
            </TouchableOpacity>
          </View>
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
  categorySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  categorySearchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.xs,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewStocksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  viewStocksButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  // Stock list styles
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
  stockItemReadOnly: {
    opacity: 0.7,
    backgroundColor: colors.background,
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
  currentWarehouseBadge: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  currentWarehouseBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  readOnlyBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
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
    gap: spacing.sm,
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
  stockEditButton: {
    padding: spacing.xs,
  },
  stockEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'flex-end',
  },
  stockEditInput: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSize.md,
    color: colors.text,
    minWidth: 80,
    textAlign: 'center',
    backgroundColor: colors.background,
  },
  stockEditSaveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockEditCancelButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
  // Warehouse option styles
  warehouseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  warehouseOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  warehouseOptionInfo: {
    flex: 1,
  },
  warehouseOptionName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  warehouseOptionStock: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.primaryLight,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textInverse,
  },
});

