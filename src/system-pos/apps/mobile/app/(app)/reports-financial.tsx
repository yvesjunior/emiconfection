import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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

interface FinancialReport {
  period: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  byWarehouse: Array<{
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    totalSales: number;
    totalExpenses: number;
    netProfit: number;
    transactionCount: number;
  }>;
}

const periods = [
  { id: 'day', label: 'Aujourd\'hui', icon: 'today-outline' },
  { id: 'week', label: 'Cette semaine', icon: 'calendar-outline' },
  { id: 'month', label: 'Ce mois', icon: 'calendar' },
  { id: 'year', label: 'Cette année', icon: 'calendar-clear' },
];

export default function ReportsFinancialScreen() {
  const router = useRouter();
  const employee = useAuthStore((state) => state.employee);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('day');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');

  // Fetch warehouses for filter (Admin only)
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'reports'],
    queryFn: async () => {
      const res = await api.get('/warehouses?includeInactive=false');
      return res.data.data;
    },
    enabled: employee?.role?.name === 'admin',
  });

  const warehouses = warehousesData || [];

  // Fetch financial report
  const { data: report, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['financial-report', selectedPeriod, selectedWarehouseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      if (selectedWarehouseId !== 'all') {
        params.append('warehouseId', selectedWarehouseId);
      }
      const res = await api.get(`/reports/financial?${params}`);
      return res.data.data as FinancialReport;
    },
  });

  const renderPeriodButton = (period: typeof periods[0]) => {
    const isSelected = selectedPeriod === period.id;
    return (
      <TouchableOpacity
        key={period.id}
        style={[styles.periodButton, isSelected && styles.periodButtonActive]}
        onPress={() => setSelectedPeriod(period.id)}
      >
        <Ionicons
          name={period.icon as any}
          size={20}
          color={isSelected ? colors.textInverse : colors.primary}
        />
        <Text
          style={[styles.periodButtonText, isSelected && styles.periodButtonTextActive]}
        >
          {period.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rapports financiers</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Period Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Période</Text>
          <View style={styles.periodButtons}>
            {periods.map(renderPeriodButton)}
          </View>
        </View>

        {/* Warehouse Filter (Admin only) */}
        {employee?.role?.name === 'admin' && warehouses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entrepôt</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.warehouseFilters}>
                <TouchableOpacity
                  style={[
                    styles.warehouseFilterChip,
                    selectedWarehouseId === 'all' && styles.warehouseFilterChipActive,
                  ]}
                  onPress={() => setSelectedWarehouseId('all')}
                >
                  <Text
                    style={[
                      styles.warehouseFilterText,
                      selectedWarehouseId === 'all' && styles.warehouseFilterTextActive,
                    ]}
                  >
                    Tous
                  </Text>
                </TouchableOpacity>
                {warehouses.map((w: { id: string; name: string; code: string }) => (
                  <TouchableOpacity
                    key={w.id}
                    style={[
                      styles.warehouseFilterChip,
                      selectedWarehouseId === w.id && styles.warehouseFilterChipActive,
                    ]}
                    onPress={() => setSelectedWarehouseId(w.id)}
                  >
                    <Text
                      style={[
                        styles.warehouseFilterText,
                        selectedWarehouseId === w.id && styles.warehouseFilterTextActive,
                      ]}
                    >
                      {w.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Report Content */}
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryCards}>
              <View style={[styles.summaryCard, styles.salesCard]}>
                <View style={styles.summaryCardHeader}>
                  <Ionicons name="trending-up" size={24} color={colors.success} />
                  <Text style={styles.summaryCardLabel}>Ventes</Text>
                </View>
                <Text style={styles.summaryCardValue}>
                  {formatCurrency(report.totalSales)}
                </Text>
                <Text style={styles.summaryCardSubtext}>
                  {report.transactionCount} transaction{report.transactionCount > 1 ? 's' : ''}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.expensesCard]}>
                <View style={styles.summaryCardHeader}>
                  <Ionicons name="trending-down" size={24} color={colors.danger} />
                  <Text style={styles.summaryCardLabel}>Dépenses</Text>
                </View>
                <Text style={styles.summaryCardValue}>
                  {formatCurrency(report.totalExpenses)}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.profitCard]}>
                <View style={styles.summaryCardHeader}>
                  <Ionicons
                    name={report.netProfit >= 0 ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={report.netProfit >= 0 ? colors.success : colors.danger}
                  />
                  <Text style={styles.summaryCardLabel}>Bénéfice net</Text>
                </View>
                <Text
                  style={[
                    styles.summaryCardValue,
                    { color: report.netProfit >= 0 ? colors.success : colors.danger },
                  ]}
                >
                  {formatCurrency(report.netProfit)}
                </Text>
                <Text style={styles.summaryCardSubtext}>
                  {report.netProfit >= 0 ? 'Positif' : 'Négatif'}
                </Text>
              </View>
            </View>

            {/* Date Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Période</Text>
              <Text style={styles.dateRange}>
                {new Date(report.startDate).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                -{' '}
                {new Date(report.endDate).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Breakdown by Warehouse */}
            {report.byWarehouse && report.byWarehouse.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Répartition par entrepôt</Text>
                {report.byWarehouse.map((warehouse) => (
                  <View key={warehouse.warehouseId} style={styles.warehouseBreakdown}>
                    <View style={styles.warehouseBreakdownHeader}>
                      <View>
                        <Text style={styles.warehouseBreakdownName}>
                          {warehouse.warehouseName}
                        </Text>
                        <Text style={styles.warehouseBreakdownCode}>
                          {warehouse.warehouseCode}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.warehouseBreakdownProfit,
                          {
                            color:
                              warehouse.netProfit >= 0 ? colors.success : colors.danger,
                          },
                        ]}
                      >
                        {formatCurrency(warehouse.netProfit)}
                      </Text>
                    </View>
                    <View style={styles.warehouseBreakdownDetails}>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Ventes:</Text>
                        <Text style={styles.breakdownValue}>
                          {formatCurrency(warehouse.totalSales)}
                        </Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Dépenses:</Text>
                        <Text style={styles.breakdownValue}>
                          {formatCurrency(warehouse.totalExpenses)}
                        </Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Transactions:</Text>
                        <Text style={styles.breakdownValue}>
                          {warehouse.transactionCount}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyStateTitle}>Aucune donnée</Text>
            <Text style={styles.emptyStateText}>
              Aucune donnée financière disponible pour cette période
            </Text>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  periodButtonTextActive: {
    color: colors.textInverse,
  },
  warehouseFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  warehouseFilterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
  },
  warehouseFilterChipActive: {
    backgroundColor: colors.primary,
  },
  warehouseFilterText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  warehouseFilterTextActive: {
    color: colors.textInverse,
  },
  loading: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  summaryCards: {
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  salesCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  expensesCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  profitCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCardLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  summaryCardValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  summaryCardSubtext: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  dateRange: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  warehouseBreakdown: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warehouseBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  warehouseBreakdownName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  warehouseBreakdownCode: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  warehouseBreakdownProfit: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  warehouseBreakdownDetails: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  breakdownValue: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
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
  },
});

