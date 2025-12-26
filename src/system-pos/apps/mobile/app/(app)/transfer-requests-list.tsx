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
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

interface TransferRequest {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  fromWarehouse: {
    id: string;
    name: string;
    code: string;
    type: 'BOUTIQUE' | 'STOCKAGE';
  };
  toWarehouse: {
    id: string;
    name: string;
    code: string;
    type: 'BOUTIQUE' | 'STOCKAGE';
  };
  quantity: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: {
    id: string;
    fullName: string;
  };
  approver?: {
    id: string;
    fullName: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  pending: colors.warning,
  approved: colors.success,
  rejected: colors.danger,
};

const statusLabels = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

export default function TransferRequestsListScreen() {
  const router = useRouter();
  const employee = useAuthStore((state) => state.employee);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['transfer-requests', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const res = await api.get(`/inventory/transfer-requests?${params}`);
      return res.data.data;
    },
  });

  const requests: TransferRequest[] = data?.data || [];
  const total = data?.pagination?.total || 0;

  // Filter by search query
  const filteredRequests = requests.filter((req) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.product.name.toLowerCase().includes(query) ||
      req.product.sku.toLowerCase().includes(query) ||
      req.fromWarehouse.name.toLowerCase().includes(query) ||
      req.toWarehouse.name.toLowerCase().includes(query)
    );
  });

  const canApprove = employee?.role?.name === 'manager' || employee?.role?.name === 'admin';

  const renderRequest = ({ item }: { item: TransferRequest }) => {
    const statusColor = statusColors[item.status];
    const statusLabel = statusLabels[item.status];

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => router.push(`/(app)/transfer-request-detail?id=${item.id}`)}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestProductInfo}>
            <Text style={styles.productName}>{item.product.name}</Text>
            <Text style={styles.productSku}>{item.product.sku}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.warehouseRow}>
            <View style={styles.warehouseInfo}>
              <Ionicons name="arrow-down-circle" size={16} color={colors.textMuted} />
              <Text style={styles.warehouseLabel}>De:</Text>
              <Text style={styles.warehouseName}>{item.fromWarehouse.name}</Text>
              <Text style={styles.warehouseCode}>({item.fromWarehouse.code})</Text>
            </View>
          </View>

          <View style={styles.warehouseRow}>
            <View style={styles.warehouseInfo}>
              <Ionicons name="arrow-up-circle" size={16} color={colors.textMuted} />
              <Text style={styles.warehouseLabel}>Vers:</Text>
              <Text style={styles.warehouseName}>{item.toWarehouse.name}</Text>
              <Text style={styles.warehouseCode}>({item.toWarehouse.code})</Text>
            </View>
          </View>

          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantité:</Text>
            <Text style={styles.quantityValue}>{item.quantity}</Text>
          </View>

          <View style={styles.requestMeta}>
            <Text style={styles.metaText}>
              Demandé par: {item.requestedBy.fullName}
            </Text>
            {item.approver && (
              <Text style={styles.metaText}>
                {item.status === 'approved' ? 'Approuvé' : 'Rejeté'} par: {item.approver.fullName}
              </Text>
            )}
            <Text style={styles.metaText}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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
        <Text style={styles.headerTitle}>Demandes de transfert</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search and Filters */}
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

        <View style={styles.statusFilters}>
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusFilterButton,
                statusFilter === status && styles.statusFilterButtonActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === status && styles.statusFilterTextActive,
                ]}
              >
                {status === 'all' ? 'Tous' : statusLabels[status as keyof typeof statusLabels]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="swap-horizontal-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'Aucun résultat' : 'Aucune demande'}
          </Text>
          <Text style={styles.emptyStateText}>
            {searchQuery
              ? 'Essayez avec d\'autres termes de recherche'
              : 'Aucune demande de transfert pour le moment'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          renderItem={renderRequest}
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
  statusFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusFilterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  statusFilterButtonActive: {
    backgroundColor: colors.primary,
  },
  statusFilterText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  statusFilterTextActive: {
    color: colors.textInverse,
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
  },
  list: {
    padding: spacing.md,
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  requestProductInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  productSku: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  requestDetails: {
    gap: spacing.sm,
  },
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warehouseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  warehouseLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  warehouseName: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  warehouseCode: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quantityLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  quantityValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  requestMeta: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs / 2,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

