import { useState, useMemo } from 'react';
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

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 4; i--) {
    years.push(i);
  }
  return years;
};

export default function ReportsFinancialScreen() {
  const router = useRouter();
  const employee = useAuthStore((state) => state.employee);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  
  // Custom date selection - default to current year, month, and day
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(currentDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(currentDate.getDate());
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null); // Week number (0-3) within the month

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

  // Helper function to get weeks in a month
  const getWeeksInMonth = useMemo(() => {
    if (selectedMonth === null) return [];
    const year = selectedYear;
    const month = selectedMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks: { start: number; end: number; label: string }[] = [];
    
    // Find the first Monday of the month (or start from day 1)
    let weekStart = 1;
    let weekEnd = Math.min(7 - firstDay.getDay() + 1, lastDay.getDate());
    
    while (weekStart <= lastDay.getDate()) {
      weeks.push({
        start: weekStart,
        end: weekEnd,
        label: `${weekStart}-${weekEnd}`,
      });
      weekStart = weekEnd + 1;
      weekEnd = Math.min(weekStart + 6, lastDay.getDate());
    }
    
    return weeks;
  }, [selectedYear, selectedMonth]);

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    // Custom date selection
    if (selectedDay !== null && selectedMonth !== null) {
      // Specific day
      const start = new Date(selectedYear, selectedMonth, selectedDay);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedYear, selectedMonth, selectedDay);
      end.setHours(23, 59, 59, 999);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    } else if (selectedWeek !== null && selectedMonth !== null) {
      // Specific week
      const weeks = getWeeksInMonth;
      const week = weeks[selectedWeek];
      if (week) {
        const start = new Date(selectedYear, selectedMonth, week.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedYear, selectedMonth, week.end);
        end.setHours(23, 59, 59, 999);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        };
      }
      // Fallback to month if week not found
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0);
      end.setHours(23, 59, 59, 999);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    } else if (selectedMonth !== null) {
      // Entire month
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0);
      end.setHours(23, 59, 59, 999);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    } else {
      // Entire year
      const start = new Date(selectedYear, 0, 1);
      const end = new Date(selectedYear, 11, 31);
      end.setHours(23, 59, 59, 999);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
  }, [selectedYear, selectedMonth, selectedDay, selectedWeek, getWeeksInMonth]);

  // Fetch financial report
  const { data: report, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['financial-report', dateRange, selectedWarehouseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('startDate', dateRange.startDate!);
      params.append('endDate', dateRange.endDate!);
      if (selectedWarehouseId !== 'all') {
        params.append('warehouseId', selectedWarehouseId);
      }
      const res = await api.get(`/reports/financial?${params}`);
      return res.data.data as FinancialReport;
    },
  });

  const availableDays = useMemo(() => {
    if (selectedMonth === null) return [];
    const days = getDaysInMonth(selectedYear, selectedMonth);
    return Array.from({ length: days }, (_, i) => i + 1);
  }, [selectedYear, selectedMonth]);


  const getCustomPeriodLabel = () => {
    if (selectedDay !== null && selectedMonth !== null) {
      return `${selectedDay} ${months[selectedMonth]} ${selectedYear}`;
    } else if (selectedWeek !== null && selectedMonth !== null) {
      const weeks = getWeeksInMonth;
      const week = weeks[selectedWeek];
      if (week) {
        return `Semaine ${week.label} ${months[selectedMonth]} ${selectedYear}`;
      }
      return `${months[selectedMonth]} ${selectedYear}`;
    } else if (selectedMonth !== null) {
      return `${months[selectedMonth]} ${selectedYear}`;
    } else {
      return `Année ${selectedYear}`;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(app)/more');
          }
        }}>
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
          <View style={styles.customPeriodContainer}>
              {/* Year Selector - Horizontal Scrollable */}
              <View style={styles.selectorSection}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.horizontalSelector}
                  contentContainerStyle={styles.horizontalSelectorContent}
                >
                  {getYears().map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.horizontalButton,
                        selectedYear === year && styles.horizontalButtonActiveYear,
                      ]}
                      onPress={() => {
                        setSelectedYear(year);
                        // Reset month, week and day when year changes
                        setSelectedMonth(null);
                        setSelectedWeek(null);
                        setSelectedDay(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.horizontalButtonText,
                          styles.horizontalButtonTextYear,
                          selectedYear === year && styles.horizontalButtonTextActive,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Selector - Horizontal Scrollable */}
              <View style={[styles.selectorSection, styles.selectorSectionTight]}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.horizontalSelector}
                  contentContainerStyle={styles.horizontalSelectorContent}
                >
                  <TouchableOpacity
                    style={[
                      styles.horizontalButton,
                      selectedMonth === null && styles.horizontalButtonActiveMonth,
                    ]}
                    onPress={() => {
                      setSelectedMonth(null);
                      setSelectedDay(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.horizontalButtonText,
                        selectedMonth === null && styles.horizontalButtonTextActive,
                      ]}
                    >
                      Tous
                    </Text>
                  </TouchableOpacity>
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.horizontalButton,
                        selectedMonth === index && styles.horizontalButtonActiveMonth,
                      ]}
                      onPress={() => {
                        setSelectedMonth(index);
                        setSelectedWeek(null);
                        setSelectedDay(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.horizontalButtonText,
                          selectedMonth === index && styles.horizontalButtonTextActive,
                        ]}
                      >
                        {month.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Week Selector - Horizontal Scrollable (only if month is selected) */}
              {selectedMonth !== null && (
                <View style={styles.selectorSection}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.horizontalSelector}
                    contentContainerStyle={styles.horizontalSelectorContent}
                  >
                    <TouchableOpacity
                      style={[
                        styles.horizontalButton,
                        selectedWeek === null && selectedDay === null && styles.horizontalButtonActiveWeek,
                      ]}
                      onPress={() => {
                        setSelectedWeek(null);
                        setSelectedDay(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.horizontalButtonText,
                          selectedWeek === null && selectedDay === null && styles.horizontalButtonTextActive,
                        ]}
                      >
                        Tous
                      </Text>
                    </TouchableOpacity>
                    {getWeeksInMonth.map((week, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.horizontalButton,
                          selectedWeek === index && styles.horizontalButtonActiveWeek,
                        ]}
                        onPress={() => {
                          setSelectedWeek(index);
                          setSelectedDay(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.horizontalButtonText,
                            selectedWeek === index && styles.horizontalButtonTextActive,
                          ]}
                        >
                          S{index + 1}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Day Selector - Horizontal Scrollable (only if month and week are selected) */}
              {selectedMonth !== null && selectedWeek !== null && (
                <View style={styles.selectorSection}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.horizontalSelector}
                    contentContainerStyle={styles.horizontalSelectorContent}
                  >
                    <TouchableOpacity
                      style={[
                        styles.horizontalButton,
                        selectedDay === null && styles.horizontalButtonActiveDay,
                      ]}
                      onPress={() => setSelectedDay(null)}
                    >
                      <Text
                        style={[
                          styles.horizontalButtonText,
                          selectedDay === null && styles.horizontalButtonTextActive,
                        ]}
                      >
                        Tous
                      </Text>
                    </TouchableOpacity>
                    {availableDays.map((day) => {
                      const weeks = getWeeksInMonth;
                      const week = weeks[selectedWeek];
                      if (week && day >= week.start && day <= week.end) {
                        return (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.horizontalButton,
                              selectedDay === day && styles.horizontalButtonActiveDay,
                            ]}
                            onPress={() => setSelectedDay(day)}
                          >
                            <Text
                              style={[
                                styles.horizontalButtonText,
                                selectedDay === day && styles.horizontalButtonTextActive,
                              ]}
                            >
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                      return null;
                    })}
                  </ScrollView>
                </View>
              )}

            {/* Selected Period Display */}
            <View style={styles.selectedPeriodDisplay}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.selectedPeriodText}>{getCustomPeriodLabel()}</Text>
            </View>
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
                  <Text style={styles.summaryCardLabel}>Revenus</Text>
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
                  <Text style={styles.summaryCardLabel}>Profit</Text>
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
                        <Text style={styles.breakdownLabel}>Revenus:</Text>
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
    padding: spacing.xs,
    paddingLeft: spacing.xs,
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
  customPeriodContainer: {
    gap: spacing.sm,
  },
  selectorSection: {
    marginBottom: 2,
  },
  selectorSectionTight: {
    marginBottom: 2,
  },
  horizontalSelector: {
    paddingVertical: 2,
  },
  horizontalSelectorContent: {
    paddingHorizontal: spacing.xs,
    paddingLeft: spacing.xs,
    alignItems: 'center',
    paddingVertical: 2,
  },
  horizontalButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minWidth: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  // Year selection - Blue/Primary
  horizontalButtonActiveYear: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  // Month selection - Green/Success
  horizontalButtonActiveMonth: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  // Week selection - Orange/Warning
  horizontalButtonActiveWeek: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
  },
  // Day selection - Purple/Custom
  horizontalButtonActiveDay: {
    backgroundColor: '#8B5CF6', // Purple color
    borderColor: '#8B5CF6',
  },
  horizontalButtonText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
  },
  horizontalButtonTextYear: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  horizontalButtonTextActive: {
    color: colors.textInverse,
  },
  selectedPeriodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.successLight + '20',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  selectedPeriodText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.success,
  },
});

