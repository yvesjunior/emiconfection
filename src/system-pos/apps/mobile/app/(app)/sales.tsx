import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import api from '../../src/lib/api';
import { useAuthStore } from '../../src/store/auth';
import { formatCurrency, formatDate, formatTime } from '../../src/lib/utils';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';
import { generateReceiptFromSale, printReceipt, shareReceipt } from '../../src/lib/receipt';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

interface SaleItem {
  id: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  total: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

interface Sale {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  status: string;
  createdAt: string;
  customer: { id: string; name: string } | null;
  payments: Array<{ method: string; amount: string; amountReceived?: string; changeGiven?: string }>;
  items?: SaleItem[];
  _count?: { items: number };
}

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export default function SalesScreen() {
  const queryClient = useQueryClient();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const employee = useAuthStore((state) => state.employee);
  const getEffectiveWarehouse = useAuthStore((state) => state.getEffectiveWarehouse);
  const currentWarehouse = getEffectiveWarehouse();

  const canVoid = hasPermission('sales:void');
  const canRefund = hasPermission('sales:refund');

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        return { dateFrom: today.toISOString().split('T')[0] };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          dateFrom: yesterday.toISOString().split('T')[0],
          dateTo: yesterday.toISOString().split('T')[0],
        };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { dateFrom: weekAgo.toISOString().split('T')[0] };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { dateFrom: monthAgo.toISOString().split('T')[0] };
      default:
        return {};
    }
  }, [dateFilter]);

  // Fetch sales - ALWAYS filter by current warehouse
  const { data: salesData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sales', dateRange, currentWarehouse?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (dateRange.dateFrom) params.append('dateFrom', dateRange.dateFrom);
      if (dateRange.dateTo) params.append('dateTo', dateRange.dateTo);
      // CRITICAL: Always include warehouseId to filter sales by current warehouse
      if (currentWarehouse?.id) {
        params.append('warehouseId', currentWarehouse.id);
      }
      const res = await api.get(`/sales?${params}`);
      return res.data.data;
    },
    enabled: !!currentWarehouse?.id, // Don't fetch if no warehouse selected
  });

  // Fetch sale details when selected
  const { data: saleDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['sale', selectedSale?.id],
    queryFn: async () => {
      const res = await api.get(`/sales/${selectedSale!.id}`);
      return res.data.data;
    },
    enabled: !!selectedSale?.id && showDetailModal,
  });

  // Void mutation
  const voidMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const res = await api.post(`/sales/${saleId}/void`);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      setShowDetailModal(false);
      setSelectedSale(null);
      Alert.alert('Succès', 'Vente annulée avec succès');
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'annuler la vente');
    },
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const res = await api.post(`/sales/${saleId}/refund`);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      setShowDetailModal(false);
      setSelectedSale(null);
      Alert.alert('Succès', 'Vente remboursée avec succès');
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de rembourser la vente');
    },
  });

  const sales: Sale[] = salesData || [];

  // Calculate totals
  const { totalSales, totalCount, completedCount } = useMemo(() => {
    const completed = sales.filter((s) => s.status === 'completed');
    return {
      totalSales: completed.reduce((sum, s) => sum + Number(s.total), 0),
      totalCount: sales.length,
      completedCount: completed.length,
    };
  }, [sales]);

  const handleVoid = useCallback(() => {
    if (!selectedSale) return;
    Alert.alert(
      'Annuler la vente',
      `Êtes-vous sûr de vouloir annuler la vente ${selectedSale.invoiceNumber} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => voidMutation.mutate(selectedSale.id),
        },
      ]
    );
  }, [selectedSale, voidMutation]);

  const handleRefund = useCallback(() => {
    if (!selectedSale) return;
    Alert.alert(
      'Rembourser la vente',
      `Êtes-vous sûr de vouloir rembourser ${formatCurrency(Number(selectedSale.total))} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, rembourser',
          style: 'destructive',
          onPress: () => refundMutation.mutate(selectedSale.id),
        },
      ]
    );
  }, [selectedSale, refundMutation]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée';
      case 'refunded': return 'Remboursée';
      case 'voided': return 'Annulée';
      default: return status;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'mobile_money': return 'Mobile Money';
      default: return method;
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return 'cash-outline';
      case 'mobile_money': return 'phone-portrait-outline';
      default: return 'wallet-outline';
    }
  };

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => {
        setSelectedSale(item);
        setShowDetailModal(true);
        hapticImpact(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View style={styles.saleHeader}>
        <View style={styles.saleHeaderLeft}>
          <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          <Text style={styles.saleTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.status === 'completed' && styles.statusCompleted,
            item.status === 'refunded' && styles.statusRefunded,
            item.status === 'voided' && styles.statusVoided,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.status === 'completed' && styles.statusTextCompleted,
              item.status === 'refunded' && styles.statusTextRefunded,
              item.status === 'voided' && styles.statusTextVoided,
            ]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.saleInfo}>
        <View style={styles.saleInfoRow}>
          <Ionicons name="person-outline" size={14} color={colors.textMuted} />
          <Text style={styles.saleInfoText}>{item.customer?.name || 'Client de passage'}</Text>
        </View>
        <View style={styles.saleInfoRow}>
          <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
          <Text style={styles.saleInfoText}>
            {item._count?.items || 0} article{(item._count?.items || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.saleInfoRow}>
          <Ionicons name={getPaymentIcon(item.payments[0]?.method || 'cash') as any} size={14} color={colors.textMuted} />
          <Text style={styles.saleInfoText}>{getPaymentLabel(item.payments[0]?.method || 'cash')}</Text>
        </View>
      </View>

      <View style={styles.saleFooter}>
        <Text
          style={[
            styles.saleTotal,
            item.status !== 'completed' && styles.saleTotalCancelled,
          ]}
        >
          {formatCurrency(Number(item.total))}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const detailSale = saleDetails || selectedSale;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Warehouse Name Bar */}
      {currentWarehouse && (
        <View style={styles.warehouseBar}>
          <Ionicons name="storefront" size={18} color={colors.primary} style={styles.warehouseBarIcon} />
          <Text style={styles.warehouseBarName}>{currentWarehouse.name}</Text>
        </View>
      )}
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ventes</Text>
        <View style={styles.headerStats}>
          <Text style={styles.headerCount}>{completedCount} vente{completedCount !== 1 ? 's' : ''}</Text>
          <Text style={styles.headerTotal}>{formatCurrency(totalSales)}</Text>
        </View>
      </View>

      {/* Date Filters */}
      <View style={styles.dateFilters}>
        {(['today', 'yesterday', 'week', 'month'] as DateFilter[]).map((filter) => (
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
              {filter === 'yesterday' && 'Hier'}
              {filter === 'week' && '7 jours'}
              {filter === 'month' && '30 jours'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sales List */}
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={renderSaleItem}
        contentContainerStyle={styles.salesList}
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
                <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyStateTitle}>Aucune vente</Text>
                <Text style={styles.emptyStateText}>
                  Aucune vente pour cette période
                </Text>
              </>
            )}
          </View>
        }
      />

      {/* Sale Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowDetailModal(false);
          setSelectedSale(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowDetailModal(false);
                setSelectedSale(null);
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{detailSale?.invoiceNumber}</Text>
            <View style={{ width: 24 }} />
          </View>

          {isLoadingDetails && !saleDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : detailSale ? (
            <ScrollView style={styles.modalContent}>
              {/* Status Banner */}
              <View
                style={[
                  styles.statusBanner,
                  detailSale.status === 'completed' && styles.statusBannerCompleted,
                  detailSale.status === 'refunded' && styles.statusBannerRefunded,
                  detailSale.status === 'voided' && styles.statusBannerVoided,
                ]}
              >
                <Ionicons
                  name={
                    detailSale.status === 'completed'
                      ? 'checkmark-circle'
                      : detailSale.status === 'refunded'
                      ? 'arrow-undo-circle'
                      : 'close-circle'
                  }
                  size={24}
                  color={colors.textInverse}
                />
                <Text style={styles.statusBannerText}>
                  {getStatusLabel(detailSale.status)}
                </Text>
              </View>

              {/* Sale Info */}
              <View style={styles.section}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatDate(detailSale.createdAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Heure</Text>
                  <Text style={styles.infoValue}>{formatTime(detailSale.createdAt)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Client</Text>
                  <Text style={styles.infoValue}>
                    {detailSale.customer?.name || 'Client de passage'}
                  </Text>
                </View>
              </View>

              {/* Items */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Articles</Text>
                {(saleDetails?.items || []).map((item: SaleItem) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.product.name}</Text>
                      <Text style={styles.itemSku}>{item.product.sku}</Text>
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemQty}>x{Number(item.quantity)}</Text>
                      <Text style={styles.itemPrice}>
                        {formatCurrency(Number(item.unitPrice))}
                      </Text>
                      <Text style={styles.itemTotal}>
                        {formatCurrency(Number(item.total))}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Totals */}
              <View style={styles.section}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Sous-total</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(Number(detailSale.subtotal))}
                  </Text>
                </View>
                {Number(detailSale.discountAmount) > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Remise</Text>
                    <Text style={[styles.totalValue, styles.discountValue]}>
                      -{formatCurrency(Number(detailSale.discountAmount))}
                    </Text>
                  </View>
                )}
                {Number(detailSale.taxAmount) > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TVA</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(Number(detailSale.taxAmount))}
                    </Text>
                  </View>
                )}
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Total</Text>
                  <Text style={styles.grandTotalValue}>
                    {formatCurrency(Number(detailSale.total))}
                  </Text>
                </View>
              </View>

              {/* Payment */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Paiement</Text>
                {detailSale.payments.map((payment: { method: string; amount: string; amountReceived?: string; changeGiven?: string }, index: number) => (
                  <View key={index} style={styles.paymentRow}>
                    <View style={styles.paymentMethod}>
                      <Ionicons
                        name={getPaymentIcon(payment.method) as any}
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.paymentMethodText}>
                        {getPaymentLabel(payment.method)}
                      </Text>
                    </View>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(Number(payment.amount))}
                    </Text>
                  </View>
                ))}
                {detailSale.payments[0]?.amountReceived && (
                  <>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Montant reçu</Text>
                      <Text style={styles.paymentValue}>
                        {formatCurrency(Number(detailSale.payments[0].amountReceived))}
                      </Text>
                    </View>
                    {Number(detailSale.payments[0].changeGiven) > 0 && (
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Monnaie rendue</Text>
                        <Text style={[styles.paymentValue, styles.changeValue]}>
                          {formatCurrency(Number(detailSale.payments[0].changeGiven))}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Print/Share Actions */}
              <View style={styles.receiptActionsSection}>
                <TouchableOpacity
                  style={styles.receiptActionButton}
                  onPress={async () => {
                    try {
                      const receiptData = generateReceiptFromSale(
                        detailSale,
                        employee?.warehouse,
                        employee
                      );
                      await printReceipt(receiptData);
                    } catch (err) {
                      console.error('Print error:', err);
                      Alert.alert('Erreur', "Impossible d'imprimer le reçu");
                    }
                  }}
                >
                  <Ionicons name="print-outline" size={22} color={colors.primary} />
                  <Text style={styles.receiptActionText}>Imprimer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.receiptActionButton}
                  onPress={async () => {
                    try {
                      const receiptData = generateReceiptFromSale(
                        detailSale,
                        employee?.warehouse,
                        employee
                      );
                      await shareReceipt(receiptData);
                    } catch (err) {
                      console.error('Share error:', err);
                      Alert.alert('Erreur', 'Impossible de partager le reçu');
                    }
                  }}
                >
                  <Ionicons name="share-outline" size={22} color={colors.primary} />
                  <Text style={styles.receiptActionText}>Partager</Text>
                </TouchableOpacity>
              </View>

              {/* Actions */}
              {detailSale.status === 'completed' && (canVoid || canRefund) && (
                <View style={styles.actionsSection}>
                  {canVoid && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleVoid}
                      disabled={voidMutation.isPending}
                    >
                      {voidMutation.isPending ? (
                        <ActivityIndicator size="small" color={colors.danger} />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
                          <Text style={styles.actionButtonText}>Annuler la vente</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {canRefund && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.refundButton]}
                      onPress={handleRefund}
                      disabled={refundMutation.isPending}
                    >
                      {refundMutation.isPending ? (
                        <ActivityIndicator size="small" color={colors.warning} />
                      ) : (
                        <>
                          <Ionicons name="arrow-undo-outline" size={20} color={colors.warning} />
                          <Text style={[styles.actionButtonText, styles.refundButtonText]}>
                            Rembourser
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={{ height: spacing.xxl }} />
            </ScrollView>
          ) : null}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  warehouseBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryLight + '15',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  warehouseBarIcon: {
    marginRight: 6,
  },
  warehouseBarName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  headerCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  headerTotal: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.success,
  },
  dateFilters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateFilterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  dateFilterButtonActive: {
    backgroundColor: colors.primary,
  },
  dateFilterText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dateFilterTextActive: {
    color: colors.textInverse,
  },
  salesList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  saleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  saleHeaderLeft: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  saleTime: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  statusCompleted: {
    backgroundColor: colors.successLight + '30',
  },
  statusRefunded: {
    backgroundColor: colors.warningLight + '30',
  },
  statusVoided: {
    backgroundColor: colors.dangerLight + '30',
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusTextCompleted: {
    color: colors.success,
  },
  statusTextRefunded: {
    color: colors.warning,
  },
  statusTextVoided: {
    color: colors.danger,
  },
  saleInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  saleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saleInfoText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saleTotal: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
  },
  saleTotalCancelled: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
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
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.success,
  },
  statusBannerCompleted: {
    backgroundColor: colors.success,
  },
  statusBannerRefunded: {
    backgroundColor: colors.warning,
  },
  statusBannerVoided: {
    backgroundColor: colors.danger,
  },
  statusBannerText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  itemSku: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemQty: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    width: 40,
  },
  itemPrice: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    width: 80,
    textAlign: 'right',
  },
  itemTotal: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    width: 80,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  totalLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  discountValue: {
    color: colors.success,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  grandTotalLabel: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentMethodText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  paymentAmount: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  paymentLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  paymentValue: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  changeValue: {
    color: colors.success,
  },
  receiptActionsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  receiptActionButton: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight + '15',
  },
  receiptActionText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.primary,
  },
  actionsSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.dangerLight + '20',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.danger,
  },
  refundButton: {
    backgroundColor: colors.warningLight + '20',
    borderColor: colors.warning,
  },
  refundButtonText: {
    color: colors.warning,
  },
});
