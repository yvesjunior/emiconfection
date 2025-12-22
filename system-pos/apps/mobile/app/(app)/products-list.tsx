import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth';
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
  costPrice: string | null;
  categories: Array<{ id: string; name: string }>;
  stock: number;
  isActive: boolean;
}

export default function ProductsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const hasPermission = useAuthStore((state) => state.hasPermission);
  
  const canUpdate = hasPermission('products:update');
  const canCreate = hasPermission('products:create');

  // Fetch products
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products', 'manage', search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.append('search', search);
      const res = await api.get(`/products?${params}`);
      return res.data;
    },
  });

  const products: Product[] = data?.data || [];

  const handleProductPress = useCallback((product: Product) => {
    if (!canUpdate) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission de modifier les produits');
      return;
    }
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/products-manage?productId=${product.id}`);
  }, [canUpdate, router]);

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productItem, !item.isActive && styles.productItemInactive]}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productIcon}>
        <Ionicons
          name="cube"
          size={24}
          color={item.isActive ? colors.primary : colors.textMuted}
        />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productSku}>{item.sku}</Text>
        <View style={styles.productMeta}>
          <Text style={styles.productPrice}>
            {formatCurrency(Number(item.sellingPrice))}
          </Text>
          <Text style={[styles.productStock, item.stock <= 0 && styles.productStockOut]}>
            Stock: {item.stock}
          </Text>
        </View>
        {item.categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {item.categories.slice(0, 2).map((cat) => (
              <View key={cat.id} style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{cat.name}</Text>
              </View>
            ))}
            {item.categories.length > 2 && (
              <Text style={styles.moreCategoriesText}>+{item.categories.length - 2}</Text>
            )}
          </View>
        )}
      </View>
      <View style={styles.productActions}>
        {!item.isActive && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>Inactif</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gérer les produits</Text>
        {canCreate && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(app)/products-manage')}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.emptyStateText}>Chargement...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>
                  {search ? 'Aucun produit trouvé' : 'Aucun produit'}
                </Text>
                {canCreate && !search && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => router.push('/(app)/products-manage')}
                  >
                    <Text style={styles.emptyStateButtonText}>Ajouter un produit</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  listContent: {
    flexGrow: 1,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  productItemInactive: {
    opacity: 0.6,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  productSku: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 4,
  },
  productPrice: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  productStock: {
    fontSize: fontSize.sm,
    color: colors.success,
  },
  productStockOut: {
    color: colors.danger,
  },
  categoriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  categoryTag: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryTagText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '500',
  },
  moreCategoriesText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  productActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inactiveBadge: {
    backgroundColor: colors.textMuted + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  inactiveBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 48 + spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyStateButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  emptyStateButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
});

