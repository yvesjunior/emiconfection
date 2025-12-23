import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import api from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/utils';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

type ReportPeriod = 'today' | 'week' | 'month';
type ReportTab = 'summary' | 'cashcount' | 'profitloss';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

export default function ReportsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [tab, setTab] = useState<ReportTab>('summary');
  const [showCashCountModal, setShowCashCountModal] = useState(false);
  
  // Cash count state
  const [cashCount, setCashCount] = useState({
    bills10000: '',
    bills5000: '',
    bills2000: '',
    bills1000: '',
    bills500: '',
    coins250: '',
    coins100: '',
    coins50: '',
    coins25: '',
    coins10: '',
    coins5: '',
  });

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch sales
  const { data: salesData, isLoading: salesLoading, refetch } = useQuery({
    queryKey: ['sales-report', period],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString(),
        limit: '500',
      });
      const res = await api.get(`/sales?${params}`);
      return res.data.data || [];
    },
  });

  // Fetch expenses
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses-report', period],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: startDate.toISOString(),
        dateTo: endDate.toISOString(),
        limit: '500',
      });
      const res = await api.get(`/expenses?${params}`);
      return res.data.data || [];
    },
  });

  const isLoading = salesLoading || expensesLoading;

  // Calculate metrics
  const metrics = useMemo(() => {
    const sales = salesData || [];
    const expenses = expensesData || [];

    const completedSales = sales.filter((s: any) => s.status === 'completed');
    const refundedSales = sales.filter((s: any) => s.status === 'refunded');
    const voidedSales = sales.filter((s: any) => s.status === 'voided');

    const totalRevenue = completedSales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    const totalRefunds = refundedSales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const netRevenue = totalRevenue - totalRefunds;
    const profit = netRevenue - totalExpenses;

    // Calculate by payment method
    const paymentsByMethod: Record<string, number> = {};
    completedSales.forEach((sale: any) => {
      (sale.payments || []).forEach((p: any) => {
        const method = p.method || 'unknown';
        paymentsByMethod[method] = (paymentsByMethod[method] || 0) + Number(p.amount);
      });
    });

    // Calculate by category
    const salesByCategory: Record<string, { count: number; amount: number }> = {};
    completedSales.forEach((sale: any) => {
      (sale.items || []).forEach((item: any) => {
        const category = item.product?.categories?.[0]?.name || 'Non catégorisé';
        if (!salesByCategory[category]) {
          salesByCategory[category] = { count: 0, amount: 0 };
        }
        salesByCategory[category].count += Number(item.quantity);
        salesByCategory[category].amount += Number(item.total);
      });
    });

    // Top products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    completedSales.forEach((sale: any) => {
      (sale.items || []).forEach((item: any) => {
        const id = item.productId;
        const name = item.product?.name || 'Produit inconnu';
        if (!productSales[id]) {
          productSales[id] = { name, quantity: 0, revenue: 0 };
        }
        productSales[id].quantity += Number(item.quantity);
        productSales[id].revenue += Number(item.total);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Expense breakdown by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((expense: any) => {
      const category = expense.category?.name || 'Autre';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(expense.amount);
    });

    // Cash sales for cash count comparison
    const cashSales = completedSales.reduce((sum: number, s: any) => {
      const cashPayments = (s.payments || []).filter((p: any) => p.method === 'cash');
      return sum + cashPayments.reduce((pSum: number, p: any) => pSum + Number(p.amount), 0);
    }, 0);

    // Profit margin
    const profitMargin = netRevenue > 0 ? (profit / netRevenue) * 100 : 0;

    return {
      totalSales: completedSales.length,
      refundedCount: refundedSales.length,
      voidedCount: voidedSales.length,
      totalRevenue,
      totalRefunds,
      netRevenue,
      totalExpenses,
      profit,
      profitMargin,
      cashSales,
      paymentsByMethod,
      salesByCategory,
      topProducts,
      expensesByCategory,
    };
  }, [salesData, expensesData]);

  // Calculate cash count total
  const cashCountTotal = useMemo(() => {
    return (
      (parseInt(cashCount.bills10000) || 0) * 10000 +
      (parseInt(cashCount.bills5000) || 0) * 5000 +
      (parseInt(cashCount.bills2000) || 0) * 2000 +
      (parseInt(cashCount.bills1000) || 0) * 1000 +
      (parseInt(cashCount.bills500) || 0) * 500 +
      (parseInt(cashCount.coins250) || 0) * 250 +
      (parseInt(cashCount.coins100) || 0) * 100 +
      (parseInt(cashCount.coins50) || 0) * 50 +
      (parseInt(cashCount.coins25) || 0) * 25 +
      (parseInt(cashCount.coins10) || 0) * 10 +
      (parseInt(cashCount.coins5) || 0) * 5
    );
  }, [cashCount]);

  const cashDifference = cashCountTotal - metrics.cashSales;

  const handleSaveCashCount = () => {
    const status = cashDifference === 0 ? 'exact' : cashDifference > 0 ? 'surplus' : 'shortage';
    Alert.alert(
      'Comptage enregistré',
      `Total compté: ${formatCurrency(cashCountTotal)}\n` +
      `Ventes espèces: ${formatCurrency(metrics.cashSales)}\n` +
      `Différence: ${cashDifference >= 0 ? '+' : ''}${formatCurrency(cashDifference)}\n\n` +
      `Statut: ${status === 'exact' ? '✅ Exact' : status === 'surplus' ? '⚠️ Excédent' : '❌ Manque'}`,
      [{ text: 'OK', onPress: () => setShowCashCountModal(false) }]
    );
    hapticNotification(
      cashDifference === 0
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );
  };

  const resetCashCount = () => {
    setCashCount({
      bills10000: '',
      bills5000: '',
      bills2000: '',
      bills1000: '',
      bills500: '',
      coins250: '',
      coins100: '',
      coins50: '',
      coins25: '',
      coins10: '',
      coins5: '',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'card': return 'Carte';
      case 'mobile_money': return 'Mobile Money';
      default: return method;
    }
  };

  const periodLabels: Record<ReportPeriod, string> = {
    today: "Aujourd'hui",
    week: '7 derniers jours',
    month: 'Ce mois',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rapports</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'summary' && styles.tabButtonActive]}
          onPress={() => setTab('summary')}
        >
          <Ionicons name="stats-chart" size={18} color={tab === 'summary' ? colors.textInverse : colors.textSecondary} />
          <Text style={[styles.tabButtonText, tab === 'summary' && styles.tabButtonTextActive]}>Résumé</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'profitloss' && styles.tabButtonActive]}
          onPress={() => setTab('profitloss')}
        >
          <Ionicons name="trending-up" size={18} color={tab === 'profitloss' ? colors.textInverse : colors.textSecondary} />
          <Text style={[styles.tabButtonText, tab === 'profitloss' && styles.tabButtonTextActive]}>Profit/Perte</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'cashcount' && styles.tabButtonActive]}
          onPress={() => setTab('cashcount')}
        >
          <Ionicons name="calculator" size={18} color={tab === 'cashcount' ? colors.textInverse : colors.textSecondary} />
          <Text style={[styles.tabButtonText, tab === 'cashcount' && styles.tabButtonTextActive]}>Caisse</Text>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as ReportPeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodButton, period === p && styles.periodButtonActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
              {periodLabels[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => refetch()} />
          }
        >
          {/* SUMMARY TAB */}
          {tab === 'summary' && (
            <>
              {/* Summary Cards */}
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, styles.revenueCard]}>
                  <Text style={styles.summaryLabel}>Chiffre d'affaires</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(metrics.netRevenue)}</Text>
                  <Text style={styles.summarySubtext}>{metrics.totalSales} vente(s)</Text>
                </View>
                <View style={[styles.summaryCard, styles.expenseCard]}>
                  <Text style={styles.summaryLabel}>Dépenses</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(metrics.totalExpenses)}</Text>
                </View>
              </View>

              {/* Profit */}
              <View style={[styles.profitCard, metrics.profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
                <View style={styles.profitInfo}>
                  <Text style={styles.profitLabel}>Bénéfice net</Text>
                  <Text style={[styles.profitValue, metrics.profit < 0 && styles.profitValueNegative]}>
                    {metrics.profit >= 0 ? '+' : ''}{formatCurrency(metrics.profit)}
                  </Text>
                </View>
                <Ionicons
                  name={metrics.profit >= 0 ? 'trending-up' : 'trending-down'}
                  size={32}
                  color={metrics.profit >= 0 ? colors.success : colors.danger}
                />
              </View>

              {/* Status breakdown */}
              {(metrics.refundedCount > 0 || metrics.voidedCount > 0) && (
                <View style={styles.statusSection}>
                  <Text style={styles.sectionTitle}>Statut des ventes</Text>
                  <View style={styles.statusGrid}>
                    {metrics.refundedCount > 0 && (
                      <View style={styles.statusItem}>
                        <Ionicons name="arrow-undo" size={20} color={colors.warning} />
                        <Text style={styles.statusCount}>{metrics.refundedCount}</Text>
                        <Text style={styles.statusLabel}>Remboursées</Text>
                        <Text style={styles.statusAmount}>-{formatCurrency(metrics.totalRefunds)}</Text>
                      </View>
                    )}
                    {metrics.voidedCount > 0 && (
                      <View style={styles.statusItem}>
                        <Ionicons name="close-circle" size={20} color={colors.danger} />
                        <Text style={styles.statusCount}>{metrics.voidedCount}</Text>
                        <Text style={styles.statusLabel}>Annulées</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Payments by Method */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Par mode de paiement</Text>
                {Object.entries(metrics.paymentsByMethod).map(([method, amount]) => (
                  <View key={method} style={styles.paymentRow}>
                    <View style={styles.paymentMethod}>
                      <Ionicons
                        name={method === 'cash' ? 'cash-outline' : method === 'card' ? 'card-outline' : 'phone-portrait-outline'}
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.paymentMethodText}>{getPaymentMethodLabel(method)}</Text>
                    </View>
                    <Text style={styles.paymentAmount}>{formatCurrency(amount)}</Text>
                  </View>
                ))}
              </View>

              {/* Top Products */}
              {metrics.topProducts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Top 5 Produits</Text>
                  {metrics.topProducts.map((product, index) => (
                    <View key={index} style={styles.productRow}>
                      <View style={styles.productRank}>
                        <Text style={styles.productRankText}>{index + 1}</Text>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                        <Text style={styles.productQuantity}>{product.quantity} vendu(s)</Text>
                      </View>
                      <Text style={styles.productRevenue}>{formatCurrency(product.revenue)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Sales by Category */}
              {Object.keys(metrics.salesByCategory).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Par catégorie</Text>
                  {Object.entries(metrics.salesByCategory)
                    .sort(([, a], [, b]) => b.amount - a.amount)
                    .map(([category, data]) => (
                      <View key={category} style={styles.categoryRow}>
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryName}>{category}</Text>
                          <Text style={styles.categoryCount}>{data.count} article(s)</Text>
                        </View>
                        <Text style={styles.categoryAmount}>{formatCurrency(data.amount)}</Text>
                      </View>
                    ))}
                </View>
              )}
            </>
          )}

          {/* PROFIT/LOSS TAB */}
          {tab === 'profitloss' && (
            <>
              {/* Revenue vs Expenses Visual Comparison */}
              <View style={styles.comparisonSection}>
                <Text style={styles.sectionTitle}>Revenus vs Dépenses</Text>
                
                {/* Visual Bar */}
                <View style={styles.comparisonBars}>
                  <View style={styles.barContainer}>
                    <View style={styles.barLabel}>
                      <Text style={styles.barLabelText}>Revenus</Text>
                      <Text style={styles.barValueText}>{formatCurrency(metrics.netRevenue)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View 
                        style={[
                          styles.barFill, 
                          styles.barFillRevenue,
                          { 
                            width: `${Math.min(100, metrics.netRevenue > 0 ? 100 : 0)}%` 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                  
                  <View style={styles.barContainer}>
                    <View style={styles.barLabel}>
                      <Text style={styles.barLabelText}>Dépenses</Text>
                      <Text style={styles.barValueText}>{formatCurrency(metrics.totalExpenses)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View 
                        style={[
                          styles.barFill, 
                          styles.barFillExpense,
                          { 
                            width: `${Math.min(100, metrics.netRevenue > 0 ? (metrics.totalExpenses / metrics.netRevenue) * 100 : (metrics.totalExpenses > 0 ? 100 : 0))}%` 
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>

                {/* Expense Ratio */}
                <View style={styles.ratioCard}>
                  <Text style={styles.ratioLabel}>Ratio Dépenses/Revenus</Text>
                  <Text style={[
                    styles.ratioValue,
                    metrics.netRevenue > 0 && (metrics.totalExpenses / metrics.netRevenue) > 0.7 && styles.ratioValueWarning
                  ]}>
                    {metrics.netRevenue > 0 
                      ? `${((metrics.totalExpenses / metrics.netRevenue) * 100).toFixed(1)}%`
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Profit Summary */}
              <View style={[styles.profitSummaryCard, metrics.profit >= 0 ? styles.profitPositive : styles.profitNegative]}>
                <View style={styles.profitSummaryHeader}>
                  <Ionicons
                    name={metrics.profit >= 0 ? 'checkmark-circle' : 'warning'}
                    size={40}
                    color={metrics.profit >= 0 ? colors.success : colors.danger}
                  />
                  <View style={styles.profitSummaryInfo}>
                    <Text style={styles.profitSummaryLabel}>
                      {metrics.profit >= 0 ? 'Bénéfice Net' : 'Perte Nette'}
                    </Text>
                    <Text style={[
                      styles.profitSummaryValue,
                      metrics.profit < 0 && styles.profitSummaryValueNegative
                    ]}>
                      {formatCurrency(Math.abs(metrics.profit))}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.profitMarginRow}>
                  <Text style={styles.profitMarginLabel}>Marge bénéficiaire</Text>
                  <Text style={[
                    styles.profitMarginValue,
                    metrics.profitMargin < 0 && styles.profitMarginValueNegative
                  ]}>
                    {metrics.profitMargin >= 0 ? '+' : ''}{metrics.profitMargin.toFixed(1)}%
                  </Text>
                </View>
              </View>

              {/* Expense Breakdown */}
              {Object.keys(metrics.expensesByCategory).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Répartition des dépenses</Text>
                  {Object.entries(metrics.expensesByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = metrics.totalExpenses > 0 
                        ? (amount / metrics.totalExpenses) * 100 
                        : 0;
                      return (
                        <View key={category} style={styles.expenseBreakdownRow}>
                          <View style={styles.expenseBreakdownInfo}>
                            <Text style={styles.expenseBreakdownName}>{category}</Text>
                            <View style={styles.expenseBreakdownBarTrack}>
                              <View 
                                style={[
                                  styles.expenseBreakdownBarFill,
                                  { width: `${percentage}%` }
                                ]} 
                              />
                            </View>
                          </View>
                          <View style={styles.expenseBreakdownValues}>
                            <Text style={styles.expenseBreakdownAmount}>{formatCurrency(amount)}</Text>
                            <Text style={styles.expenseBreakdownPercent}>{percentage.toFixed(1)}%</Text>
                          </View>
                        </View>
                      );
                    })}
                </View>
              )}

              {/* Financial Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Récapitulatif financier</Text>
                <View style={styles.financialRow}>
                  <Text style={styles.financialLabel}>Ventes brutes</Text>
                  <Text style={styles.financialValue}>{formatCurrency(metrics.totalRevenue)}</Text>
                </View>
                <View style={styles.financialRow}>
                  <Text style={styles.financialLabel}>Remboursements</Text>
                  <Text style={[styles.financialValue, styles.financialValueNegative]}>
                    -{formatCurrency(metrics.totalRefunds)}
                  </Text>
                </View>
                <View style={[styles.financialRow, styles.financialRowBorder]}>
                  <Text style={styles.financialLabel}>Revenus nets</Text>
                  <Text style={styles.financialValue}>{formatCurrency(metrics.netRevenue)}</Text>
                </View>
                <View style={styles.financialRow}>
                  <Text style={styles.financialLabel}>Total dépenses</Text>
                  <Text style={[styles.financialValue, styles.financialValueNegative]}>
                    -{formatCurrency(metrics.totalExpenses)}
                  </Text>
                </View>
                <View style={[styles.financialRow, styles.financialRowTotal]}>
                  <Text style={styles.financialLabelTotal}>
                    {metrics.profit >= 0 ? 'BÉNÉFICE' : 'PERTE'}
                  </Text>
                  <Text style={[
                    styles.financialValueTotal,
                    metrics.profit < 0 && styles.financialValueTotalNegative
                  ]}>
                    {metrics.profit >= 0 ? '+' : ''}{formatCurrency(metrics.profit)}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* CASH COUNT TAB */}
          {tab === 'cashcount' && (
            <>
              {/* Expected Cash */}
              <View style={styles.cashExpectedCard}>
                <View style={styles.cashExpectedHeader}>
                  <Ionicons name="cash" size={24} color={colors.success} />
                  <Text style={styles.cashExpectedTitle}>Espèces attendues</Text>
                </View>
                <Text style={styles.cashExpectedValue}>{formatCurrency(metrics.cashSales)}</Text>
                <Text style={styles.cashExpectedSubtext}>
                  Basé sur les ventes en espèces {periodLabels[period].toLowerCase()}
                </Text>
              </View>

              {/* Cash Count Button */}
              <TouchableOpacity
                style={styles.cashCountButton}
                onPress={() => {
                  resetCashCount();
                  setShowCashCountModal(true);
                }}
              >
                <Ionicons name="calculator" size={24} color={colors.textInverse} />
                <Text style={styles.cashCountButtonText}>Compter la caisse</Text>
              </TouchableOpacity>

              {/* Instructions */}
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>📋 Procédure de fin de journée</Text>
                <View style={styles.instructionStep}>
                  <Text style={styles.instructionNumber}>1</Text>
                  <Text style={styles.instructionText}>Comptez tous les billets et pièces</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.instructionNumber}>2</Text>
                  <Text style={styles.instructionText}>Entrez les quantités dans le formulaire</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.instructionNumber}>3</Text>
                  <Text style={styles.instructionText}>Vérifiez la différence avec les ventes</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.instructionNumber}>4</Text>
                  <Text style={styles.instructionText}>Signalez tout écart au responsable</Text>
                </View>
              </View>

              {/* Quick Tips */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Conseils</Text>
                <Text style={styles.tipText}>
                  • Un léger excédent peut provenir de pourboires ou d'arrondis
                </Text>
                <Text style={styles.tipText}>
                  • Un manque peut indiquer une erreur de rendu de monnaie
                </Text>
                <Text style={styles.tipText}>
                  • Comptez toujours deux fois pour plus de précision
                </Text>
              </View>
            </>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      )}

      {/* Cash Count Modal */}
      <Modal
        visible={showCashCountModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCashCountModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comptage de caisse</Text>
            <TouchableOpacity onPress={resetCashCount}>
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Bills Section */}
            <Text style={styles.denominationTitle}>💵 Billets</Text>
            
            {[
              { key: 'bills10000', label: '10 000 FCFA', value: 10000 },
              { key: 'bills5000', label: '5 000 FCFA', value: 5000 },
              { key: 'bills2000', label: '2 000 FCFA', value: 2000 },
              { key: 'bills1000', label: '1 000 FCFA', value: 1000 },
              { key: 'bills500', label: '500 FCFA', value: 500 },
            ].map((denom) => (
              <View key={denom.key} style={styles.denominationRow}>
                <Text style={styles.denominationLabel}>{denom.label}</Text>
                <TextInput
                  style={styles.denominationInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  value={cashCount[denom.key as keyof typeof cashCount]}
                  onChangeText={(text) => setCashCount({ ...cashCount, [denom.key]: text })}
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.denominationTotal}>
                  = {formatCurrency((parseInt(cashCount[denom.key as keyof typeof cashCount]) || 0) * denom.value)}
                </Text>
              </View>
            ))}

            {/* Coins Section */}
            <Text style={[styles.denominationTitle, { marginTop: spacing.lg }]}>🪙 Pièces</Text>
            
            {[
              { key: 'coins250', label: '250 FCFA', value: 250 },
              { key: 'coins100', label: '100 FCFA', value: 100 },
              { key: 'coins50', label: '50 FCFA', value: 50 },
              { key: 'coins25', label: '25 FCFA', value: 25 },
              { key: 'coins10', label: '10 FCFA', value: 10 },
              { key: 'coins5', label: '5 FCFA', value: 5 },
            ].map((denom) => (
              <View key={denom.key} style={styles.denominationRow}>
                <Text style={styles.denominationLabel}>{denom.label}</Text>
                <TextInput
                  style={styles.denominationInput}
                  keyboardType="number-pad"
                  placeholder="0"
                  value={cashCount[denom.key as keyof typeof cashCount]}
                  onChangeText={(text) => setCashCount({ ...cashCount, [denom.key]: text })}
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.denominationTotal}>
                  = {formatCurrency((parseInt(cashCount[denom.key as keyof typeof cashCount]) || 0) * denom.value)}
                </Text>
              </View>
            ))}

            {/* Summary */}
            <View style={styles.cashSummary}>
              <View style={styles.cashSummaryRow}>
                <Text style={styles.cashSummaryLabel}>Total compté</Text>
                <Text style={styles.cashSummaryValue}>{formatCurrency(cashCountTotal)}</Text>
              </View>
              <View style={styles.cashSummaryRow}>
                <Text style={styles.cashSummaryLabel}>Ventes espèces</Text>
                <Text style={styles.cashSummaryValue}>{formatCurrency(metrics.cashSales)}</Text>
              </View>
              <View style={[
                styles.cashSummaryRow,
                styles.cashDifferenceRow,
                cashDifference === 0 ? styles.cashDifferenceExact : 
                cashDifference > 0 ? styles.cashDifferenceSurplus : styles.cashDifferenceShortage
              ]}>
                <Text style={styles.cashDifferenceLabel}>Différence</Text>
                <Text style={styles.cashDifferenceValue}>
                  {cashDifference >= 0 ? '+' : ''}{formatCurrency(cashDifference)}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveCashCount}
            >
              <Ionicons name="checkmark" size={20} color={colors.textInverse} />
              <Text style={styles.saveButtonText}>Enregistrer le comptage</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.textInverse,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  periodButtonActive: {
    backgroundColor: colors.primaryLight,
  },
  periodButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  revenueCard: {
    backgroundColor: colors.primaryLight + '20',
  },
  expenseCard: {
    backgroundColor: colors.dangerLight + '20',
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  summarySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  profitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  profitPositive: {
    backgroundColor: colors.successLight + '20',
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  profitNegative: {
    backgroundColor: colors.dangerLight + '20',
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  profitInfo: {
    flex: 1,
  },
  profitLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  profitValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.success,
  },
  profitValueNegative: {
    color: colors.danger,
  },
  statusSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  statusCount: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  statusLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  statusAmount: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.warning,
    marginTop: spacing.xs,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentMethodText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  paymentAmount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  productRankText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  productQuantity: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  productRevenue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.success,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  categoryCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  categoryAmount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  // Profit/Loss Tab Styles
  comparisonSection: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  comparisonBars: {
    gap: spacing.md,
  },
  barContainer: {
    gap: spacing.xs,
  },
  barLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabelText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  barValueText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  barTrack: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barFillRevenue: {
    backgroundColor: colors.success,
  },
  barFillExpense: {
    backgroundColor: colors.danger,
  },
  ratioCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  ratioLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  ratioValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
  ratioValueWarning: {
    color: colors.warning,
  },
  profitSummaryCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  profitSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profitSummaryInfo: {
    flex: 1,
  },
  profitSummaryLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  profitSummaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.success,
  },
  profitSummaryValueNegative: {
    color: colors.danger,
  },
  profitMarginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  profitMarginLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  profitMarginValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.success,
  },
  profitMarginValueNegative: {
    color: colors.danger,
  },
  expenseBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  expenseBreakdownInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  expenseBreakdownName: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  expenseBreakdownBarTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  expenseBreakdownBarFill: {
    height: '100%',
    backgroundColor: colors.danger,
    borderRadius: 3,
  },
  expenseBreakdownValues: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  expenseBreakdownAmount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  expenseBreakdownPercent: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  financialRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  financialRowTotal: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.text,
  },
  financialLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  financialValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  financialValueNegative: {
    color: colors.danger,
  },
  financialLabelTotal: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  financialValueTotal: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.success,
  },
  financialValueTotalNegative: {
    color: colors.danger,
  },
  // Cash Count Tab Styles
  cashExpectedCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.successLight + '20',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  cashExpectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cashExpectedTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.success,
  },
  cashExpectedValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  cashExpectedSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cashCountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  cashCountButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  instructionsCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  instructionsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  instructionText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  resetText: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  denominationTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  denominationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  denominationLabel: {
    width: 100,
    fontSize: fontSize.md,
    color: colors.text,
  },
  denominationInput: {
    width: 60,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    textAlign: 'center',
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  denominationTotal: {
    flex: 1,
    textAlign: 'right',
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  cashSummary: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  cashSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  cashSummaryLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  cashSummaryValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  cashDifferenceRow: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  cashDifferenceExact: {
    backgroundColor: colors.successLight + '30',
  },
  cashDifferenceSurplus: {
    backgroundColor: colors.warningLight + '30',
  },
  cashDifferenceShortage: {
    backgroundColor: colors.dangerLight + '30',
  },
  cashDifferenceLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  cashDifferenceValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  modalFooter: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
});

