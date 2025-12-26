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
import { useAppModeStore } from '../../src/store/appMode';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: 'BOUTIQUE' | 'STOCKAGE';
  address: string | null;
  phone: string | null;
  isActive: boolean;
  isDefault: boolean;
  _count?: { employees: number; inventory: number };
}

export default function WarehousesListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const mode = useAppModeStore((state) => state.mode);
  
  const canManage = hasPermission('warehouses:manage');
  const isTabMode = mode === 'manage'; // When in manage mode, this is a tab

  // Fetch warehouses
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['warehouses', 'manage'],
    queryFn: async () => {
      const res = await api.get('/warehouses?includeInactive=true');
      return res.data;
    },
  });

  const allWarehouses: Warehouse[] = data?.data || [];
  
  // Filter by search
  const warehouses = search
    ? allWarehouses.filter((w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.code.toLowerCase().includes(search.toLowerCase())
      )
    : allWarehouses;

  const handleWarehousePress = useCallback((warehouse: Warehouse) => {
    if (!canManage) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission de gérer les entrepôts');
      return;
    }
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/warehouses-manage?warehouseId=${warehouse.id}`);
  }, [canManage, router]);

  const renderWarehouse = ({ item }: { item: Warehouse }) => {
    const employeeCount = item._count?.employees || 0;
    const inventoryCount = item._count?.inventory || 0;

    return (
      <TouchableOpacity
        style={[styles.warehouseItem, !item.isActive && styles.warehouseItemInactive]}
        onPress={() => handleWarehousePress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.warehouseIcon, item.isDefault && styles.warehouseIconDefault]}>
          <Ionicons
            name={item.isDefault ? 'storefront' : 'storefront-outline'}
            size={24}
            color={item.isActive ? colors.primary : colors.textMuted}
          />
        </View>
        <View style={styles.warehouseInfo}>
          <View style={styles.warehouseHeader}>
            <Text style={styles.warehouseName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Par défaut</Text>
              </View>
            )}
          </View>
          <View style={styles.warehouseMetaHeader}>
            <Text style={styles.warehouseCode}>{item.code}</Text>
            <View style={[
              styles.typeBadge,
              item.type === 'BOUTIQUE' ? styles.typeBadgeBoutique : styles.typeBadgeStockage
            ]}>
              <Ionicons
                name={item.type === 'BOUTIQUE' ? 'storefront' : 'archive'}
                size={12}
                color={item.type === 'BOUTIQUE' ? colors.primary : colors.success}
              />
              <Text style={[
                styles.typeBadgeText,
                item.type === 'BOUTIQUE' ? styles.typeBadgeTextBoutique : styles.typeBadgeTextStockage
              ]}>
                {item.type === 'BOUTIQUE' ? 'Boutique' : 'Stockage'}
              </Text>
            </View>
          </View>
          {item.address && (
            <View style={styles.addressContainer}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.addressText} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
          )}
          {item.phone && (
            <View style={styles.phoneContainer}>
              <Ionicons name="call-outline" size={14} color={colors.textMuted} />
              <Text style={styles.phoneText}>{item.phone}</Text>
            </View>
          )}
          <View style={styles.warehouseMeta}>
            {employeeCount > 0 && (
              <View style={styles.metaTag}>
                <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                <Text style={styles.metaTagText}>{employeeCount} employé{employeeCount > 1 ? 's' : ''}</Text>
              </View>
            )}
            {inventoryCount > 0 && (
              <View style={styles.metaTag}>
                <Ionicons name="cube-outline" size={12} color={colors.textMuted} />
                <Text style={styles.metaTagText}>{inventoryCount} produits</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.warehouseActions}>
          {!item.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactif</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isTabMode && styles.headerTab]}>
        {!isTabMode ? (
          <TouchableOpacity style={styles.backButton} onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(app)/');
            }
          }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleLarge}>Entrepôts</Text>
            <Text style={styles.headerSubtitle}>Gérer vos entrepôts</Text>
          </View>
        )}
        {!isTabMode && <Text style={styles.headerTitle}>Gérer les entrepôts</Text>}
        {canManage && (
          <TouchableOpacity
            style={[styles.addButton, isTabMode && styles.addButtonTab]}
            onPress={() => router.push('/(app)/warehouses-manage')}
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
            placeholder="Rechercher un entrepôt..."
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

      {/* Warehouses List */}
      <FlatList
        data={warehouses}
        keyExtractor={(item) => item.id}
        renderItem={renderWarehouse}
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
                <Ionicons name="storefront-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>
                  {search ? 'Aucun entrepôt trouvé' : 'Aucun entrepôt'}
                </Text>
                {canManage && !search && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => router.push('/(app)/warehouses-manage')}
                  >
                    <Text style={styles.emptyStateButtonText}>Ajouter un entrepôt</Text>
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
  headerTab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitleLarge: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
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
  addButtonTab: {
    backgroundColor: colors.success,
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
  warehouseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  warehouseItemInactive: {
    opacity: 0.6,
  },
  warehouseIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warehouseIconDefault: {
    backgroundColor: colors.primaryLight + '15',
  },
  warehouseInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  warehouseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  warehouseName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  defaultBadge: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  warehouseMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  warehouseCode: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeBoutique: {
    backgroundColor: colors.primaryLight + '20',
  },
  typeBadgeStockage: {
    backgroundColor: colors.successLight + '20',
  },
  typeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  typeBadgeTextBoutique: {
    color: colors.primary,
  },
  typeBadgeTextStockage: {
    color: colors.success,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  addressText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    flex: 1,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  phoneText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  warehouseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTagText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  warehouseActions: {
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

