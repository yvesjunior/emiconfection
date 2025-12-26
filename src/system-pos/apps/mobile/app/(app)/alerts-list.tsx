import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

interface ManagerAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  warehouseId?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
}

type SeverityFilter = 'all' | 'info' | 'warning' | 'critical';
type TypeFilter = 'all' | 'stock_reduction' | 'transfer_request' | 'transfer_approval' | 'transfer_rejection' | 'transfer_reception' | 'user_creation' | 'product_deletion';

export default function AlertsListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const employee = useAuthStore((state) => state.employee);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedAlert, setSelectedAlert] = useState<ManagerAlert | null>(null);

  const isAdmin = employee?.role?.name === 'admin';

  // Fetch unread count
  const { data: unreadCountData } = useQuery({
    queryKey: ['alerts', 'count'],
    queryFn: async () => {
      const res = await api.get('/alerts/count');
      return res.data;
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = unreadCountData?.count || 0;

  // Fetch alerts
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['alerts', severityFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severityFilter !== 'all') {
        params.append('severity', severityFilter);
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      const res = await api.get(`/alerts?${params.toString()}`);
      return res.data;
    },
    enabled: isAdmin,
  });

  // Response structure: { success: true, data: [...], pagination: {...} }
  const alerts: ManagerAlert[] = data?.data || [];
  const total = data?.pagination?.total || 0;

  // Mark alert as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await api.put(`/alerts/${alertId}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put('/alerts/read-all');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts', 'count'] });
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Toutes les alertes ont été marquées comme lues');
    },
  });

  const handleAlertPress = useCallback((alert: ManagerAlert) => {
    setSelectedAlert(alert);
    if (!alert.isRead) {
      markAsReadMutation.mutate(alert.id);
    }
  }, [markAsReadMutation]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return colors.danger;
      case 'warning':
        return colors.warning || '#f59e0b';
      case 'info':
        return colors.primary;
      default:
        return colors.textMuted;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      stock_reduction: 'Réduction de stock',
      transfer_request: 'Demande de transfert',
      transfer_approval: 'Approbation de transfert',
      transfer_rejection: 'Rejet de transfert',
      transfer_reception: 'Réception de transfert',
      user_creation: 'Création d\'utilisateur',
      product_deletion: 'Suppression de produit',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderAlert = ({ item, index }: { item: ManagerAlert; index: number }) => {
    const severityColor = getSeverityColor(item.severity);
    const severityIcon = getSeverityIcon(item.severity);
    const isEven = index % 2 === 0;

    return (
      <TouchableOpacity
        style={[
          styles.alertItem,
          isEven ? styles.alertItemEven : styles.alertItemOdd,
          !item.isRead && styles.alertItemUnread,
        ]}
        onPress={() => handleAlertPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.severityIndicator, { backgroundColor: severityColor + '20' }]}>
          <Ionicons name={severityIcon as any} size={20} color={severityColor} />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertHeader}>
            <Text style={[styles.alertTitle, !item.isRead && styles.alertTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && (
              <View style={styles.unreadBadge}>
                <View style={styles.unreadDot} />
              </View>
            )}
          </View>
          <Text style={styles.alertMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <View style={styles.alertFooter}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{getTypeLabel(item.type)}</Text>
            </View>
            {item.warehouse && (
              <View style={styles.warehouseBadge}>
                <Ionicons name="storefront" size={12} color={colors.textMuted} />
                <Text style={styles.warehouseBadgeText}>{item.warehouse.name}</Text>
              </View>
            )}
            <Text style={styles.alertDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alertes</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed" size={48} color={colors.textMuted} />
          <Text style={styles.emptyStateText}>Accès refusé</Text>
          <Text style={styles.emptyStateSubtext}>
            Seuls les administrateurs peuvent voir les alertes
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Alertes</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Text style={styles.markAllButtonText}>
              {markAllAsReadMutation.isPending ? '...' : 'Tout marquer'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Sévérité:</Text>
          <View style={styles.filterButtons}>
            {(['all', 'critical', 'warning', 'info'] as SeverityFilter[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  severityFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => {
                  setSeverityFilter(filter);
                  hapticImpact(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    severityFilter === filter && styles.filterButtonTextActive,
                  ]}
                >
                  {filter === 'all' ? 'Toutes' 
                    : filter === 'critical' ? 'Critique'
                    : filter === 'warning' ? 'Avertissement'
                    : 'Info'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Alerts List */}
      {isLoading && !isRefetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyStateText}>
            {severityFilter === 'all' ? 'Aucune alerte' 
              : severityFilter === 'critical' ? 'Aucune alerte critique'
              : severityFilter === 'warning' ? 'Aucun avertissement'
              : 'Aucune info'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Les alertes importantes apparaîtront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlert}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalSeverityIndicator, { backgroundColor: getSeverityColor(selectedAlert.severity) + '20' }]}>
                <Ionicons name={getSeverityIcon(selectedAlert.severity) as any} size={24} color={getSeverityColor(selectedAlert.severity)} />
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>{selectedAlert.title}</Text>
                <Text style={styles.modalDate}>{formatDate(selectedAlert.createdAt)}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedAlert(null)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{selectedAlert.message}</Text>
              <View style={styles.modalMeta}>
                <View style={styles.modalMetaItem}>
                  <Text style={styles.modalMetaLabel}>Type:</Text>
                  <Text style={styles.modalMetaValue}>{getTypeLabel(selectedAlert.type)}</Text>
                </View>
                {selectedAlert.warehouse && (
                  <View style={styles.modalMetaItem}>
                    <Text style={styles.modalMetaLabel}>Entrepôt:</Text>
                    <Text style={styles.modalMetaValue}>{selectedAlert.warehouse.name}</Text>
                  </View>
                )}
                <View style={styles.modalMetaItem}>
                  <Text style={styles.modalMetaLabel}>Sévérité:</Text>
                  <Text style={[styles.modalMetaValue, { color: getSeverityColor(selectedAlert.severity) }]}>
                    {selectedAlert.severity === 'critical' ? 'Critique' 
                      : selectedAlert.severity === 'warning' ? 'Avertissement'
                      : 'Information'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  unreadCountBadge: {
    backgroundColor: colors.danger,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCountText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  markAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  markAllButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
  },
  filterLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
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
  listContent: {
    padding: spacing.md,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertItemEven: {
    backgroundColor: colors.white,
  },
  alertItemOdd: {
    backgroundColor: '#E8E8E8',
  },
  alertItemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  severityIndicator: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  alertTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  alertTitleUnread: {
    fontWeight: '700',
  },
  unreadBadge: {
    marginLeft: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  alertMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  typeBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typeBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  warehouseBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  alertDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: 'auto',
  },
  separator: {
    height: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalSeverityIndicator: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  modalDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: spacing.lg,
  },
  modalMessage: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  modalMeta: {
    gap: spacing.md,
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalMetaLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 100,
  },
  modalMetaValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
});

