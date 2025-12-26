import { useState, useMemo } from 'react';
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
import api from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/utils';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

interface ExpenseCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Expense {
  id: string;
  amount: string;
  description: string | null;
  reference: string | null;
  date: string;
  category: ExpenseCategory;
  warehouse: { id: string; name: string };
}

const DEFAULT_ICON = 'cash-outline';
const DEFAULT_COLOR = colors.primary;

export default function ExpensesScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const employee = useAuthStore((state) => state.employee);

  const canCreate = hasPermission('expenses:create');
  const canManage = hasPermission('expenses:manage');

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: string | undefined;

    switch (dateFilter) {
      case 'today':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        startDate = today.toISOString();
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString();
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString();
        break;
      default:
        startDate = undefined;
    }

    return { startDate, endDate };
  }, [dateFilter]);

  // Fetch expense categories
  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await api.get('/expenses/categories');
      return res.data.data;
    },
  });

  // Fetch expenses
  const { data: expensesData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['expenses', selectedCategory, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const res = await api.get(`/expenses?${params}`);
      return res.data;
    },
  });

  // Fetch summary
  const { data: summaryData } = useQuery({
    queryKey: ['expenses-summary', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      const res = await api.get(`/expenses/summary?${params}`);
      return res.data.data;
    },
  });

  const categories: ExpenseCategory[] = categoriesData || [];
  const expenses: Expense[] = expensesData?.data || [];
  const totalExpenses = summaryData?.total || 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderExpense = ({ item }: { item: Expense }) => {
    const iconName = item.category.icon || DEFAULT_ICON;
    const iconColor = item.category.color || DEFAULT_COLOR;

    return (
      <TouchableOpacity
        style={styles.expenseItem}
        onPress={() => canManage && router.push(`/(app)/expenses-manage?id=${item.id}`)}
        disabled={!canManage}
        activeOpacity={canManage ? 0.7 : 1}
      >
        <View style={[styles.expenseIcon, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName as any} size={22} color={iconColor} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseCategory}>{item.category.name}</Text>
          {item.description && (
            <Text style={styles.expenseDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.expenseAmountContainer}>
          <Text style={styles.expenseAmount}>-{formatCurrency(Number(item.amount))}</Text>
          {item.reference && (
            <Text style={styles.expenseRef}>#{item.reference}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(app)/more');
          }
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Dépenses</Text>
          <Text style={styles.headerSubtitle}>
            {employee?.warehouse?.name || 'Tous les entrepôts'}
          </Text>
        </View>
        {canCreate && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(app)/expenses-manage')}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>

      {/* Total Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="wallet" size={28} color={colors.danger} />
        </View>
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryLabel}>Total des dépenses</Text>
          <Text style={styles.summaryValue}>{formatCurrency(Number(totalExpenses))}</Text>
        </View>
      </View>

      {/* Date Filter */}
      <View style={styles.dateFilters}>
        {(['today', 'week', 'month', 'all'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.dateFilterButton,
              dateFilter === filter && styles.dateFilterButtonActive,
            ]}
            onPress={() => {
              setDateFilter(filter);
              hapticImpact(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.dateFilterText,
                dateFilter === filter && styles.dateFilterTextActive,
              ]}
            >
              {filter === 'today' && "Aujourd'hui"}
              {filter === 'week' && '7 jours'}
              {filter === 'month' && '30 jours'}
              {filter === 'all' && 'Tout'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filters */}
      <View style={styles.categoryFiltersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'Toutes', icon: 'apps', color: colors.textSecondary }, ...categories]}
          keyExtractor={(item) => item.id || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                (selectedCategory === item.id || (item.id === null && !selectedCategory)) &&
                  styles.categoryChipActive,
              ]}
              onPress={() => {
                setSelectedCategory(item.id);
                hapticImpact(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name={(item.icon || DEFAULT_ICON) as any}
                size={16}
                color={
                  selectedCategory === item.id || (item.id === null && !selectedCategory)
                    ? colors.textInverse
                    : item.color || colors.textSecondary
                }
              />
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
          contentContainerStyle={styles.categoryChipsList}
        />
      </View>

      {/* Expenses List */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
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
                <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>Aucune dépense</Text>
                {canCreate && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => router.push('/(app)/expenses-manage')}
                  >
                    <Ionicons name="add" size={20} color={colors.textInverse} />
                    <Text style={styles.emptyStateButtonText}>Ajouter une dépense</Text>
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    ...shadows.md,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dangerLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 2,
  },
  dateFilters: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  dateFilterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateFilterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateFilterText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dateFilterTextActive: {
    color: colors.textInverse,
  },
  categoryFiltersContainer: {
    marginBottom: spacing.sm,
  },
  categoryChipsList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
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
  listContent: {
    flexGrow: 1,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  expenseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  expenseCategory: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  expenseDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expenseDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.danger,
  },
  expenseRef: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 44 + spacing.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  emptyStateButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
});

