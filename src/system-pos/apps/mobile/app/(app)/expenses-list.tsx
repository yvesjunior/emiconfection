import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth';
import api from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/utils';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

interface Expense {
  id: string;
  amount: number;
  description: string | null;
  reference: string | null;
  date: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
}

export default function ExpensesListScreen() {
  const router = useRouter();
  const employee = useAuthStore((state) => state.employee);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const canManage = hasPermission('expenses:manage');
  const canCreate = hasPermission('expenses:create');

  // Fetch expense categories
  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await api.get('/expenses/categories');
      return res.data.data;
    },
  });

  const categories = categoriesData || [];

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'expenses'],
    queryFn: async () => {
      const res = await api.get('/warehouses?includeInactive=false');
      return res.data.data;
    },
  });

  const warehouses = warehousesData || [];

  // Fetch expenses
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['expenses', categoryFilter, warehouseFilter, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
      if (warehouseFilter !== 'all') params.append('warehouseId', warehouseFilter);
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);
      const res = await api.get(`/expenses?${params}`);
      return res.data;
    },
  });

  const expenses: Expense[] = data?.data || [];
  const total = data?.pagination?.total || 0;

  // Filter by search query
  const filteredExpenses = expenses.filter((exp) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      exp.description?.toLowerCase().includes(query) ||
      exp.reference?.toLowerCase().includes(query) ||
      exp.category.name.toLowerCase().includes(query) ||
      exp.warehouse.name.toLowerCase().includes(query)
    );
  });

  const renderExpense = ({ item }: { item: Expense }) => {
    return (
      <TouchableOpacity
        style={styles.expenseCard}
        onPress={() => canManage && router.push(`/(app)/expenses-manage?expenseId=${item.id}`)}
      >
        <View style={styles.expenseHeader}>
          <View style={styles.expenseCategory}>
            {item.category.icon && (
              <Ionicons
                name={item.category.icon as any}
                size={20}
                color={item.category.color || colors.primary}
              />
            )}
            <Text style={styles.expenseCategoryName}>{item.category.name}</Text>
          </View>
          <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
        </View>

        {item.description && (
          <Text style={styles.expenseDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.expenseMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="storefront-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.warehouse.name}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {new Date(item.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </Text>
          </View>
          {item.reference && (
            <View style={styles.metaRow}>
              <Ionicons name="document-text-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{item.reference}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dépenses</Text>
        {canCreate && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(app)/expenses-manage')}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Catégorie</Text>
            <FlatList
              horizontal
              data={[{ id: 'all', name: 'Toutes' }, ...categories]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    categoryFilter === item.id && styles.filterChipActive,
                  ]}
                  onPress={() => setCategoryFilter(item.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      categoryFilter === item.id && styles.filterChipTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {employee?.role?.name === 'admin' && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Entrepôt</Text>
              <FlatList
                horizontal
                data={[{ id: 'all', name: 'Tous' }, ...warehouses]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      warehouseFilter === item.id && styles.filterChipActive,
                    ]}
                    onPress={() => setWarehouseFilter(item.id)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        warehouseFilter === item.id && styles.filterChipTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </View>

      {/* Summary */}
      {filteredExpenses.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(
              filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
            )}
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredExpenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'Aucun résultat' : 'Aucune dépense'}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? 'Essayez avec d\'autres termes de recherche'
              : 'Aucune dépense enregistrée pour le moment'}
          </Text>
          {canCreate && !searchQuery && (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/(app)/expenses-manage')}
            >
              <Text style={styles.emptyStateButtonText}>Ajouter une dépense</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpense}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  filterRow: {
    gap: spacing.md,
  },
  filterGroup: {
    gap: spacing.xs,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.textInverse,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  emptyStateButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  list: {
    padding: spacing.md,
  },
  expenseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  expenseCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  expenseCategoryName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  expenseAmount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.danger,
  },
  expenseDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  expenseMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

