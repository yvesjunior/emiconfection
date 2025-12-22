import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth';
import { useAppModeStore } from '../../src/store/appMode';
import api from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/utils';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

interface InventoryItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: string;
    minStockLevel: number;
  };
  quantity: number;
  warehouse: {
    id: string;
    name: string;
  };
}

export default function InventoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const mode = useAppModeStore((state) => state.mode);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const employee = useAuthStore((state) => state.employee);

  const canAdjust = hasPermission('inventory:adjust');

  // Fetch inventory
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['inventory', search, filterLowStock],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.append('search', search);
      if (filterLowStock) params.append('lowStock', 'true');
      const res = await api.get(`/inventory?${params}`);
      return res.data;
    },
  });

  // Fetch low stock count
  const { data: lowStockData } = useQuery({
    queryKey: ['inventory', 'lowStock', 'count'],
    queryFn: async () => {
      const res = await api.get('/inventory/low-stock');
      return res.data.data;
    },
  });

  const inventoryItems: InventoryItem[] = data?.data || [];
  const lowStockCount = lowStockData?.length || 0;

  const getStockStatus = (item: InventoryItem) => {
    const minLevel = item.product.minStockLevel || 10;
    if (item.quantity <= 0) return 'out';
    if (item.quantity <= minLevel) return 'low';
    return 'ok';
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const status = getStockStatus(item);
    const minLevel = item.product.minStockLevel || 10;

    return (
      <TouchableOpacity
        style={styles.inventoryItem}
        onPress={() => {
          if (mode === 'manage') {
            router.push(`/(app)/products-manage?productId=${item.product.id}`);
          }
        }}
        disabled={mode !== 'manage'}
        activeOpacity={mode === 'manage' ? 0.7 : 1}
      >
        <View style={[
          styles.stockIndicator,
          status === 'out' && styles.stockIndicatorOut,
          status === 'low' && styles.stockIndicatorLow,
          status === 'ok' && styles.stockIndicatorOk,
        ]} />
        <View style={styles.inventoryItemInfo}>
          <Text style={styles.inventoryItemName} numberOfLines={1}>
            {item.product.name}
          </Text>
          <Text style={styles.inventoryItemSku}>{item.product.sku}</Text>
          <Text style={styles.inventoryItemPrice}>
            {formatCurrency(Number(item.product.sellingPrice))}
          </Text>
        </View>
        <View style={styles.inventoryItemStock}>
          <Text style={[
            styles.stockQuantity,
            status === 'out' && styles.stockQuantityOut,
            status === 'low' && styles.stockQuantityLow,
          ]}>
            {item.quantity}
          </Text>
          <Text style={styles.stockLabel}>en stock</Text>
          {status === 'low' && (
            <Text style={styles.stockWarning}>Min: {minLevel}</Text>
          )}
          {status === 'out' && (
            <Text style={styles.stockOutLabel}>Rupture</Text>
          )}
        </View>
        {mode === 'manage' && (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Inventaire</Text>
          <Text style={styles.headerSubtitle}>
            {employee?.warehouse?.name || 'Tous les entrepôts'}
          </Text>
        </View>
        {canAdjust && (
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => router.push('/(app)/inventory-adjust')}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search & Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un produit..."
            placeholderTextColor={colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterLowStock && styles.filterButtonActive,
          ]}
          onPress={() => {
            setFilterLowStock(!filterLowStock);
            hapticImpact(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons
            name="warning"
            size={18}
            color={filterLowStock ? colors.textInverse : colors.warning}
          />
          <Text style={[
            styles.filterButtonText,
            filterLowStock && styles.filterButtonTextActive,
          ]}>
            Stock faible ({lowStockCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="cube" size={24} color={colors.primary} />
          <Text style={styles.summaryValue}>{inventoryItems.length}</Text>
          <Text style={styles.summaryLabel}>Produits</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardWarning]}>
          <Ionicons name="warning" size={24} color={colors.warning} />
          <Text style={styles.summaryValue}>{lowStockCount}</Text>
          <Text style={styles.summaryLabel}>Stock faible</Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryCardDanger]}>
          <Ionicons name="close-circle" size={24} color={colors.danger} />
          <Text style={styles.summaryValue}>
            {inventoryItems.filter(i => i.quantity <= 0).length}
          </Text>
          <Text style={styles.summaryLabel}>Rupture</Text>
        </View>
      </View>

      {/* Inventory List */}
      <FlatList
        data={inventoryItems}
        keyExtractor={(item) => item.id}
        renderItem={renderInventoryItem}
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
                  {search ? 'Aucun produit trouvé' : 'Aucun stock'}
                </Text>
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
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.warningLight + '20',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  filterButtonActive: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  filterButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.warning,
  },
  filterButtonTextActive: {
    color: colors.textInverse,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    ...shadows.sm,
  },
  summaryCardWarning: {
    borderLeftColor: colors.warning,
  },
  summaryCardDanger: {
    borderLeftColor: colors.danger,
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  listContent: {
    flexGrow: 1,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  stockIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  stockIndicatorOk: {
    backgroundColor: colors.success,
  },
  stockIndicatorLow: {
    backgroundColor: colors.warning,
  },
  stockIndicatorOut: {
    backgroundColor: colors.danger,
  },
  inventoryItemInfo: {
    flex: 1,
  },
  inventoryItemName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  inventoryItemSku: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  inventoryItemPrice: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  inventoryItemStock: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  stockQuantity: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.success,
  },
  stockQuantityLow: {
    color: colors.warning,
  },
  stockQuantityOut: {
    color: colors.danger,
  },
  stockLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  stockWarning: {
    fontSize: fontSize.xs,
    color: colors.warning,
    marginTop: 2,
  },
  stockOutLabel: {
    fontSize: fontSize.xs,
    color: colors.danger,
    fontWeight: '600',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 4 + spacing.md,
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
});

