import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function TransferRequestDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const requestId = params.id as string;
  const employee = useAuthStore((state) => state.employee);
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useQuery({
    queryKey: ['transfer-request', requestId],
    queryFn: async () => {
      const res = await api.get(`/inventory/transfer-requests/${requestId}`);
      return res.data.data as TransferRequest;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (notes?: string) => {
      const res = await api.put(`/inventory/transfer-requests/${requestId}/approve`, {
        status: 'approved',
        notes,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-request', requestId] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Demande de transfert approuvée et appliquée');
      router.back();
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'approuver la demande');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (notes?: string) => {
      const res = await api.put(`/inventory/transfer-requests/${requestId}/approve`, {
        status: 'rejected',
        notes,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-request', requestId] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Demande de transfert rejetée');
      router.back();
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de rejeter la demande');
    },
  });

  const handleApprove = () => {
    Alert.alert(
      'Approuver le transfert',
      `Voulez-vous approuver le transfert de ${request?.quantity} unité(s) de ${request?.product.name} ?\n\nLe transfert sera appliqué immédiatement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          style: 'default',
          onPress: () => approveMutation.mutate(undefined),
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Rejeter le transfert',
      `Voulez-vous rejeter cette demande de transfert ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: () => rejectMutation.mutate(undefined),
        },
      ]
    );
  };

  const canApprove =
    request?.status === 'pending' &&
    (employee?.role?.name === 'manager' || employee?.role?.name === 'admin');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(app)/transfer-requests-list');
            }
          }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyStateTitle}>Demande introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor =
    request.status === 'pending'
      ? colors.warning
      : request.status === 'approved'
      ? colors.success
      : colors.danger;

  const statusLabel =
    request.status === 'pending'
      ? 'En attente'
      : request.status === 'approved'
      ? 'Approuvé'
      : 'Rejeté';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          // Navigate back to transfer-requests-list - parent screen
          if (router.canDismiss()) {
            router.dismissAll();
          }
          setTimeout(() => {
            router.push('/(app)/transfer-requests-list' as any);
          }, 100);
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du transfert</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>

        {/* Product Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produit</Text>
          <Text style={styles.productName}>{request.product.name}</Text>
          <Text style={styles.productSku}>SKU: {request.product.sku}</Text>
        </View>

        {/* Warehouses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transfert</Text>
          <View style={styles.warehouseCard}>
            <View style={styles.warehouseHeader}>
              <Ionicons name="arrow-down-circle" size={20} color={colors.danger} />
              <Text style={styles.warehouseLabel}>Entrepôt source</Text>
            </View>
            <Text style={styles.warehouseName}>{request.fromWarehouse.name}</Text>
            <Text style={styles.warehouseCode}>Code: {request.fromWarehouse.code}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{request.fromWarehouse.type}</Text>
            </View>
          </View>

          <View style={styles.arrow}>
            <Ionicons name="arrow-down" size={24} color={colors.primary} />
          </View>

          <View style={styles.warehouseCard}>
            <View style={styles.warehouseHeader}>
              <Ionicons name="arrow-up-circle" size={20} color={colors.success} />
              <Text style={styles.warehouseLabel}>Entrepôt destination</Text>
            </View>
            <Text style={styles.warehouseName}>{request.toWarehouse.name}</Text>
            <Text style={styles.warehouseCode}>Code: {request.toWarehouse.code}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{request.toWarehouse.type}</Text>
            </View>
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantité</Text>
          <Text style={styles.quantityValue}>{request.quantity}</Text>
        </View>

        {/* Request Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Demandé par:</Text>
            <Text style={styles.infoValue}>{request.requestedBy.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date de demande:</Text>
            <Text style={styles.infoValue}>
              {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {request.approver && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {request.status === 'approved' ? 'Approuvé' : 'Rejeté'} par:
              </Text>
              <Text style={styles.infoValue}>{request.approver.fullName}</Text>
            </View>
          )}
          {request.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{request.notes}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {canApprove && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color={colors.textInverse} />
                  <Text style={styles.actionButtonText}>Rejeter</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={handleApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                  <Text style={styles.actionButtonText}>Approuver</Text>
                </>
              )}
            </TouchableOpacity>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: '600',
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
  productName: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productSku: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  warehouseCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  warehouseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  warehouseLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  warehouseName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  warehouseCode: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  arrow: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  quantityValue: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  notesContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
  },
  notesLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: fontSize.md * 1.5,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textInverse,
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
  },
});

