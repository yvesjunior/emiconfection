import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

interface TransferRequest {
  id: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: string | number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string | null;
  requestedBy: string;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  fromWarehouse: {
    id: string;
    name: string;
    code: string;
    type?: 'BOUTIQUE' | 'STOCKAGE';
  };
  toWarehouse: {
    id: string;
    name: string;
    code: string;
    type?: 'BOUTIQUE' | 'STOCKAGE';
  };
  requester: {
    id: string;
    fullName: string;
  };
  approver?: {
    id: string;
    fullName: string;
  } | null;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'completed';

export default function TransferRequestsListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const employee = useAuthStore((state) => state.employee);
  const getEffectiveWarehouse = useAuthStore((state) => state.getEffectiveWarehouse);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [warehouseFilter, setWarehouseFilter] = useState<string | null>(null); // null = all warehouses
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalQuantity, setApprovalQuantity] = useState('');

  // Check permissions
  const canApprove = employee?.role?.name === 'admin' || employee?.role?.name === 'manager';
  const canView = employee?.role?.name === 'admin' || employee?.role?.name === 'manager' || employee?.role?.name === 'cashier';
  const isAdmin = employee?.role?.name === 'admin';
  const isManager = employee?.role?.name === 'manager';
  const currentWarehouse = getEffectiveWarehouse();
  
  // Fetch warehouses for filter (admin sees all, manager sees only assigned)
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'transfer-requests'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data;
    },
    enabled: isAdmin || isManager,
  });
  
  // Response structure: { success: true, data: [...] }
  const allWarehouses = warehousesData?.data || [];
  
  // Filter warehouses: admins see all, managers see only assigned warehouses
  const warehouses = isAdmin 
    ? allWarehouses 
    : allWarehouses.filter((w: any) => {
        const hasAccess = employee?.warehouses?.some((ew: any) => ew.id === w.id) ||
                         employee?.warehouse?.id === w.id;
        return hasAccess;
      });
  
  // Check if current user can mark as received (must be manager/admin of receiving warehouse)
  const canMarkAsReceived = useCallback((request: TransferRequest) => {
    if (!canApprove || request.status !== 'approved') return false;
    if (employee?.role?.name === 'admin') return true;
    if (employee?.role?.name === 'manager') {
      // Manager must be assigned to the receiving warehouse (toWarehouseId)
      // Check both warehouses array and primary warehouseId for backward compatibility
      const receivingWarehouseId = request.toWarehouse?.id || request.toWarehouseId;
      const hasReceivingWarehouseAccess = 
        employee?.warehouses?.some((ew: any) => ew.id === receivingWarehouseId) ||
        employee?.warehouse?.id === receivingWarehouseId;
      return hasReceivingWarehouseAccess;
    }
    return false;
  }, [canApprove, employee]);

  // Fetch transfer requests
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['transfer-requests', statusFilter, warehouseFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (warehouseFilter) {
        params.append('warehouseId', warehouseFilter);
      }
      const res = await api.get(`/inventory/transfer-requests?${params.toString()}`);
      console.log('[Transfer Requests] API Response:', res.data);
      return res.data;
    },
    enabled: canView,
  });

  // Response structure: { success: true, data: [...], pagination: {...} }
  const transferRequests: TransferRequest[] = data?.data || [];
  const total = data?.pagination?.total || 0;

  // Fetch available stock for the selected request's source warehouse
  // Use fromWarehouse.id which is always present in the response
  const sourceWarehouseId = selectedRequest?.fromWarehouse?.id || selectedRequest?.fromWarehouseId;
  
  const { data: inventoryData, isLoading: isLoadingStock } = useQuery({
    queryKey: ['inventory', selectedRequest?.productId, sourceWarehouseId],
    queryFn: async () => {
      if (!selectedRequest?.productId || !sourceWarehouseId) {
        console.log('[Transfer Requests] Missing data:', {
          productId: selectedRequest?.productId,
          sourceWarehouseId,
          fromWarehouse: selectedRequest?.fromWarehouse,
        });
        return null;
      }
      
      // Use product endpoint - it returns ALL warehouses, so we can find the source warehouse
      // The /inventory endpoint uses getWarehouseScope which overrides the warehouseId parameter
      try {
        const productUrl = `/products/${selectedRequest.productId}`;
        console.log('[Transfer Requests] Fetching product (all warehouses):', productUrl);
        console.log('[Transfer Requests] Looking for source warehouse:', sourceWarehouseId);
        const productRes = await api.get(productUrl);
        console.log('[Transfer Requests] Product API Response structure:', {
          hasData: !!productRes.data?.data,
          inventoryCount: productRes.data?.data?.inventory?.length || 0,
        });
        
        // Extract inventory from product data
        const productData = productRes.data?.data;
        if (productData?.inventory && Array.isArray(productData.inventory)) {
          console.log('[Transfer Requests] Available warehouses in response:', 
            productData.inventory.map((inv: any) => ({
              warehouseId: inv.warehouse?.id || inv.warehouseId,
              warehouseName: inv.warehouse?.name,
              quantity: inv.quantity,
            }))
          );
          
          // Find inventory entry for the source warehouse
          const inventoryEntry = productData.inventory.find((inv: any) => {
            const invWarehouseId = inv.warehouse?.id || inv.warehouseId;
            const matches = invWarehouseId === sourceWarehouseId;
            if (matches) {
              console.log('[Transfer Requests] MATCH FOUND:', {
                warehouseId: invWarehouseId,
                warehouseName: inv.warehouse?.name,
                quantity: inv.quantity,
              });
            }
            return matches;
          });
          
          if (inventoryEntry) {
            console.log('[Transfer Requests] Found inventory entry for source warehouse:', {
              id: inventoryEntry.id,
              warehouseId: inventoryEntry.warehouse?.id || inventoryEntry.warehouseId,
              warehouseName: inventoryEntry.warehouse?.name,
              quantity: inventoryEntry.quantity,
              quantityType: typeof inventoryEntry.quantity,
            });
            
            return {
              success: true,
              data: [{
                id: inventoryEntry.id,
                productId: productData.id,
                warehouseId: inventoryEntry.warehouse?.id || inventoryEntry.warehouseId,
                quantity: inventoryEntry.quantity,
              }],
              pagination: { total: 1, page: 1, limit: 1, totalPages: 1 },
            };
          } else {
            console.warn('[Transfer Requests] No inventory entry found for source warehouse:', {
              sourceWarehouseId,
              sourceWarehouseName: selectedRequest?.fromWarehouse?.name,
              availableWarehouses: productData.inventory.map((inv: any) => ({
                id: inv.warehouse?.id || inv.warehouseId,
                name: inv.warehouse?.name,
                quantity: inv.quantity,
              })),
            });
          }
        }
        
        return null;
      } catch (error: any) {
        console.error('[Transfer Requests] Product API Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        return null;
      }
    },
    enabled: !!selectedRequest && !!selectedRequest.productId && !!sourceWarehouseId,
  });

  // Get available stock from inventory data
  // Response structure: { success: true, data: [...], pagination: {...} }
  // When filtering by productId and warehouseId, API returns array with 0 or 1 item
  // Quantity comes as string from Prisma Decimal serialization: "5"
  
  // Handle different possible response structures
  let inventoryItems: any[] = [];
  if (inventoryData) {
    // Try different possible structures
    if (Array.isArray(inventoryData.data)) {
      inventoryItems = inventoryData.data;
    } else if (Array.isArray(inventoryData)) {
      inventoryItems = inventoryData;
    } else if (inventoryData.data?.data && Array.isArray(inventoryData.data.data)) {
      inventoryItems = inventoryData.data.data;
    }
  }
  
  const inventoryItem = inventoryItems[0]; // Should be the only item when filtered by productId + warehouseId
  
  // Convert quantity to number (Prisma Decimal is serialized as string in JSON)
  let availableStock = 0;
  if (inventoryItem) {
    const qty = inventoryItem.quantity;
    if (qty !== undefined && qty !== null && qty !== '') {
      // Handle string (most common case from Prisma Decimal)
      if (typeof qty === 'string') {
        availableStock = parseFloat(qty) || 0;
      } 
      // Handle number
      else if (typeof qty === 'number') {
        availableStock = qty;
      } 
      // Handle Decimal object (if not serialized)
      else if (qty && typeof qty === 'object' && 'toNumber' in qty) {
        availableStock = qty.toNumber();
      } 
      // Fallback
      else {
        availableStock = Number(qty) || 0;
      }
    }
  }
  
  // Debug logging
  if (selectedRequest && showApprovalModal) {
    console.log('[Transfer Requests] Available stock calculation:', {
      selectedRequest: {
        id: selectedRequest.id,
        productId: selectedRequest.productId,
        productName: selectedRequest.product.name,
        fromWarehouseId: selectedRequest.fromWarehouseId,
        fromWarehouse: selectedRequest.fromWarehouse,
        fromWarehouseIdFromObject: selectedRequest.fromWarehouse?.id,
        sourceWarehouseId,
        toWarehouseId: selectedRequest.toWarehouseId,
        toWarehouseName: selectedRequest.toWarehouse?.name,
      },
      queryEnabled: !!selectedRequest && !!selectedRequest.productId && !!sourceWarehouseId,
      isLoadingStock,
      hasInventoryData: !!inventoryData,
      inventoryDataFull: inventoryData ? JSON.stringify(inventoryData, null, 2) : 'null',
      inventoryItemsCount: inventoryItems.length,
      inventoryItem: inventoryItem ? {
        id: inventoryItem.id,
        productId: inventoryItem.productId,
        warehouseId: inventoryItem.warehouseId,
        quantity: inventoryItem.quantity,
        quantityType: typeof inventoryItem.quantity,
        quantityValue: String(inventoryItem.quantity),
      } : null,
      availableStock,
      calculation: inventoryItem 
        ? `quantity="${inventoryItem.quantity}" (${typeof inventoryItem.quantity}) -> parseFloat("${inventoryItem.quantity}") = ${availableStock}` 
        : 'no item found',
    });
  }

  // Approve/Reject mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, status, quantity, notes }: { id: string; status: 'approved' | 'rejected'; quantity?: number; notes?: string }) => {
      const res = await api.put(`/inventory/transfer-requests/${id}/approve`, {
        status,
        quantity,
        notes,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      setApprovalQuantity('');
      setApprovalAction(null);
      Alert.alert('Succès', 'La demande de transfert a été traitée avec succès');
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      const message = error.response?.data?.message || 'Une erreur est survenue';
      Alert.alert('Erreur', message);
    },
  });

  // Mark as received mutation
  const markAsReceivedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.put(`/inventory/transfer-requests/${id}/receive`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Le transfert a été marqué comme reçu et le stock a été mis à jour');
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      const message = error.response?.data?.message || 'Une erreur est survenue';
      Alert.alert('Erreur', message);
    },
  });

  const handleRequestPress = useCallback((request: TransferRequest) => {
    if (request.status === 'pending' && canApprove) {
      setSelectedRequest(request);
      setShowApprovalModal(true);
    } else if (request.status === 'approved' && canMarkAsReceived(request)) {
      // Show confirmation to mark as received
      Alert.alert(
        'Marquer comme reçu',
        `Voulez-vous marquer ce transfert comme reçu ?\n\nLe stock sera transféré :\n- ${request.quantity ?? 'N/A'} unité(s) de ${request.fromWarehouse.name}\n- vers ${request.toWarehouse.name}`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Marquer comme reçu',
            onPress: () => {
              markAsReceivedMutation.mutate(request.id);
            },
          },
        ]
      );
    } else {
      // Show details
      const statusText = request.status === 'pending' ? 'En attente' 
        : request.status === 'approved' ? 'Approuvée' 
        : request.status === 'completed' ? 'Reçue'
        : 'Rejetée';
      
      // Build message based on status
      let message = `Produit: ${request.product.name} (${request.product.sku})\n` +
        `De: ${request.fromWarehouse.name}\n` +
        `Vers: ${request.toWarehouse.name}\n`;
      
      // Only show quantity if approved or completed (rejected requests don't have quantity)
      if (request.status === 'approved' || request.status === 'completed') {
        message += `Quantité: ${request.quantity ?? 'N/A'} unité(s)\n`;
      } else if (request.status === 'rejected') {
        message += `Quantité: N/A (demande rejetée)\n`;
      } else if (request.status === 'pending') {
        message += `Quantité: Non définie (sera spécifiée lors de l'approbation)\n`;
      }
      
      message += `Demandé par: ${request.requester.fullName}\n`;
      
      if (request.approver) {
        if (request.status === 'rejected') {
          message += `Rejeté par: ${request.approver.fullName}\n`;
        } else {
          message += `Approuvé par: ${request.approver.fullName}\n`;
        }
      }
      
      if (request.notes) {
        message += `Notes: ${request.notes}`;
      }
      
      // Add special message for rejected requests
      if (request.status === 'rejected') {
        message += '\n\n⚠️ Cette demande a été rejetée. Le cas est fermé.';
      }
      
      Alert.alert(
        `Demande de transfert - ${statusText}`,
        message,
        [{ text: 'OK' }]
      );
    }
  }, [canApprove, canMarkAsReceived, markAsReceivedMutation]);

  const handleApprove = () => {
    if (!selectedRequest) return;
    setApprovalAction('approve');
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    setApprovalAction('reject');
  };

  const handleConfirmApproval = () => {
    if (!selectedRequest || !approvalAction) return;
    
    // If approving, quantity is required
    if (approvalAction === 'approve') {
      const qty = Number(approvalQuantity);
      if (isNaN(qty) || qty <= 0) {
        Alert.alert('Erreur', 'Veuillez entrer une quantité valide (supérieure à 0)');
        return;
      }
      
      if (qty > availableStock) {
        Alert.alert(
          'Quantité invalide',
          `La quantité demandée (${qty}) dépasse le stock disponible (${availableStock} unités) dans l'entrepôt source.`
        );
        return;
      }
      
      approveMutation.mutate({
        id: selectedRequest.id,
        status: 'approved',
        quantity: qty,
        notes: approvalNotes.trim() || undefined,
      });
    } else {
      // Rejecting doesn't need quantity
      approveMutation.mutate({
        id: selectedRequest.id,
        status: 'rejected',
        notes: approvalNotes.trim() || undefined,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'approved':
        return colors.primary;
      case 'completed':
        return colors.success;
      case 'rejected':
        return colors.danger;
      default:
        return colors.textMuted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Approuvée';
      case 'completed':
        return 'Reçue';
      case 'rejected':
        return 'Rejetée';
      default:
        return status;
    }
  };

  const renderRequest = ({ item, index }: { item: TransferRequest; index: number }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);
    const isPending = item.status === 'pending';
    const isApproved = item.status === 'approved';
    const canReceive = canMarkAsReceived(item);
    const isEven = index % 2 === 0;

    return (
      <TouchableOpacity
        style={[
          styles.requestItem,
          isEven ? styles.requestItemEven : styles.requestItemOdd,
        ]}
        onPress={() => handleRequestPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product.name}
            </Text>
            <Text style={styles.productSku}>{item.product.sku}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.warehouseRow}>
            <View style={styles.warehouseInfo}>
              <Ionicons name="arrow-down" size={16} color={colors.textMuted} />
              <Text style={styles.warehouseLabel}>De:</Text>
              <Text style={styles.warehouseName}>{item.fromWarehouse.name}</Text>
              {item.fromWarehouse.type && (
                <View style={[
                  styles.typeBadge,
                  item.fromWarehouse.type === 'BOUTIQUE' ? styles.typeBadgeBoutique : styles.typeBadgeStockage
                ]}>
                  <Text style={[
                    styles.typeBadgeText,
                    item.fromWarehouse.type === 'BOUTIQUE' ? styles.typeBadgeTextBoutique : styles.typeBadgeTextStockage
                  ]}>
                    {item.fromWarehouse.type === 'BOUTIQUE' ? 'B' : 'S'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.warehouseRow}>
            <View style={styles.warehouseInfo}>
              <Ionicons name="arrow-up" size={16} color={colors.primary} />
              <Text style={styles.warehouseLabel}>Vers:</Text>
              <Text style={styles.warehouseName}>{item.toWarehouse.name}</Text>
              {item.toWarehouse.type && (
                <View style={[
                  styles.typeBadge,
                  item.toWarehouse.type === 'BOUTIQUE' ? styles.typeBadgeBoutique : styles.typeBadgeStockage
                ]}>
                  <Text style={[
                    styles.typeBadgeText,
                    item.toWarehouse.type === 'BOUTIQUE' ? styles.typeBadgeTextBoutique : styles.typeBadgeTextStockage
                  ]}>
                    {item.toWarehouse.type === 'BOUTIQUE' ? 'B' : 'S'}
                  </Text>
            </View>
              )}
          </View>
          </View>

          <View style={styles.requestMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Quantité:</Text>
              <Text style={[
                styles.metaValue,
                (item.status === 'rejected' || item.status === 'pending') && { color: colors.textMuted, fontStyle: 'italic' }
              ]}>
                {item.status === 'rejected' 
                  ? 'N/A' 
                  : item.status === 'pending' 
                    ? 'Non définie' 
                    : item.quantity ?? 'N/A'}
            </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Demandé par:</Text>
              <Text style={styles.metaValue}>{item.requester.fullName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>
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

          {isPending && canApprove && (
            <View style={styles.actionHint}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.actionHintText}>Appuyez pour approuver ou rejeter</Text>
            </View>
          )}
          {isApproved && canReceive && (
            <View style={[styles.actionHint, { backgroundColor: colors.successLight + '20' }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.actionHintText, { color: colors.success }]}>
                Appuyez pour marquer comme reçu
              </Text>
            </View>
          )}
          {item.status === 'rejected' && (
            <View style={[styles.actionHint, { backgroundColor: colors.dangerLight + '20' }]}>
              <Ionicons name="close-circle" size={16} color={colors.danger} />
              <Text style={[styles.actionHintText, { color: colors.danger }]}>
                Cas fermé - Cette demande a été rejetée
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!canView) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Demandes de transfert</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed" size={48} color={colors.textMuted} />
          <Text style={styles.emptyStateText}>Accès refusé</Text>
          <Text style={styles.emptyStateSubtext}>
            Vous n'avez pas la permission d'accéder à cette fonctionnalité
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Demandes de transfert</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {(['pending', 'approved', 'completed', 'rejected'] as StatusFilter[]).map((filter) => (
            <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              statusFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => {
              setStatusFilter(filter);
              hapticImpact(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === filter && styles.filterButtonTextActive,
              ]}
            >
              {filter === 'pending' ? 'En attente' 
                : filter === 'approved' ? 'Approuvées'
                : filter === 'completed' ? 'Reçues'
                : 'Rejetées'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      {/* Warehouse Filter - Admin and Manager */}
      {(isAdmin || isManager) && warehouses.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.warehouseFilterScroll}
          >
            {warehouses.map((warehouse: any) => (
              <TouchableOpacity
                key={warehouse.id}
                style={[
                  styles.filterButton,
                  warehouseFilter === warehouse.id && styles.filterButtonActive,
                ]}
                onPress={() => {
                  setWarehouseFilter(warehouse.id);
                  hapticImpact(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    warehouseFilter === warehouse.id && styles.filterButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {warehouse.name}
              </Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
        </View>
      )}

      {/* Requests List */}
      {isLoading && !isRefetching ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : transferRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="swap-horizontal-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyStateText}>
            {statusFilter === 'pending' && !warehouseFilter ? 'Aucune demande en attente'
              : statusFilter === 'approved' && !warehouseFilter ? 'Aucune demande approuvée'
              : statusFilter === 'completed' && !warehouseFilter ? 'Aucune demande reçue'
              : statusFilter === 'rejected' && !warehouseFilter ? 'Aucune demande rejetée'
              : warehouseFilter ? `Aucune demande pour cet entrepôt (${statusFilter === 'pending' ? 'en attente' : statusFilter === 'approved' ? 'approuvées' : statusFilter === 'completed' ? 'reçues' : 'rejetées'})`
              : 'Aucune demande'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Changez les filtres pour voir d'autres demandes
          </Text>
        </View>
      ) : (
        <FlatList
          data={transferRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* Approval Modal */}
      <Modal
        visible={showApprovalModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowApprovalModal(false);
          setSelectedRequest(null);
          setApprovalNotes('');
          setApprovalAction(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {approvalAction === 'approve' ? 'Approuver la demande' : approvalAction === 'reject' ? 'Rejeter la demande' : 'Demande de transfert'}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowApprovalModal(false);
                setSelectedRequest(null);
                setApprovalNotes('');
                setApprovalAction(null);
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {selectedRequest && (
            <View style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Produit</Text>
                <Text style={styles.modalText}>{selectedRequest.product.name}</Text>
                <Text style={styles.modalSubtext}>SKU: {selectedRequest.product.sku}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Transfert</Text>
                <View style={styles.modalWarehouseRow}>
                  <View style={styles.modalWarehouse}>
                    <Text style={styles.modalWarehouseLabel}>De</Text>
                    <Text style={styles.modalWarehouseName}>{selectedRequest.fromWarehouse.name}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
                  <View style={styles.modalWarehouse}>
                    <Text style={styles.modalWarehouseLabel}>Vers</Text>
                    <Text style={styles.modalWarehouseName}>{selectedRequest.toWarehouse.name}</Text>
                  </View>
                </View>
                <Text style={styles.modalText}>
                  Quantité: {selectedRequest.quantity ?? 'Non définie (sera spécifiée lors de l\'approbation)'}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Demandé par</Text>
                <Text style={styles.modalText}>{selectedRequest.requester.fullName}</Text>
                <Text style={styles.modalSubtext}>
                  {new Date(selectedRequest.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {selectedRequest.notes && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Notes originales</Text>
                  <Text style={styles.modalText}>{selectedRequest.notes}</Text>
                </View>
              )}

              {!approvalAction && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.approveButton]}
                    onPress={handleApprove}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                    <Text style={styles.modalActionButtonText}>Approuver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.rejectButton]}
                    onPress={handleReject}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.textInverse} />
                    <Text style={styles.modalActionButtonText}>Rejeter</Text>
                  </TouchableOpacity>
                </View>
              )}

              {approvalAction && (
                <View style={styles.modalSection}>
                  {approvalAction === 'approve' && selectedRequest && (
                    <>
                      <Text style={styles.modalSectionTitle}>
                        Quantité à transférer *
                      </Text>
                      <TextInput
                        style={styles.modalTextInput}
                        placeholder="Entrez la quantité..."
                        value={approvalQuantity}
                        onChangeText={setApprovalQuantity}
                        keyboardType="numeric"
                        placeholderTextColor={colors.textMuted}
                      />
                      <Text style={styles.modalSectionSubtitle}>
                        Stock disponible dans {selectedRequest.fromWarehouse.name}: {
                          isLoadingStock ? 'Chargement...' : `${availableStock} unité(s)`
                        }
                      </Text>
                      {approvalQuantity && Number(approvalQuantity) > availableStock && (
                        <Text style={[styles.modalSectionSubtitle, { color: colors.danger, marginTop: spacing.xs }]}>
                          La quantité demandée dépasse le stock disponible
                        </Text>
                      )}
                    </>
                  )}
                  <Text style={styles.modalSectionTitle}>
                    Notes {approvalAction === 'approve' ? '(optionnel)' : ''}
                  </Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder={approvalAction === 'approve' ? 'Ajouter des notes...' : 'Raison du rejet...'}
                    value={approvalNotes}
                    onChangeText={setApprovalNotes}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={colors.textMuted}
                  />
                  <View style={styles.modalConfirmActions}>
                    <TouchableOpacity
                      style={[styles.modalConfirmButton, styles.cancelButton]}
                      onPress={() => {
                        setApprovalAction(null);
                        setApprovalNotes('');
                        setApprovalQuantity('');
                      }}
                    >
                      <Text style={styles.modalConfirmButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalConfirmButton,
                        approvalAction === 'approve' ? styles.confirmApproveButton : styles.confirmRejectButton,
                      ]}
                      onPress={handleConfirmApproval}
                      disabled={approveMutation.isPending}
                    >
                      <Text style={styles.modalConfirmButtonText}>
                        {approveMutation.isPending ? 'Traitement...' : approvalAction === 'approve' ? 'Confirmer approbation' : 'Confirmer rejet'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
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
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  warehouseFilterScroll: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
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
  listContent: {
    padding: spacing.md,
  },
  requestItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  requestItemEven: {
    backgroundColor: colors.white,
  },
  requestItemOdd: {
    backgroundColor: '#E8E8E8',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  requestInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  productName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  productSku: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  requestDetails: {
    marginTop: spacing.sm,
  },
  warehouseRow: {
    marginBottom: spacing.xs,
  },
  warehouseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  warehouseLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  warehouseName: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
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
  requestMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  metaValue: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: '500',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.xs,
    backgroundColor: colors.primaryLight + '10',
    borderRadius: borderRadius.sm,
  },
  actionHintText: {
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
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
    textAlign: 'center',
    marginTop: spacing.xs,
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalContent: {
    padding: spacing.lg,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  modalSectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  modalText: {
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  modalWarehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalWarehouse: {
    flex: 1,
  },
  modalWarehouseLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  modalWarehouseName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  modalTextInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  modalActionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
  modalConfirmActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalConfirmButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmApproveButton: {
    backgroundColor: colors.success,
  },
  confirmRejectButton: {
    backgroundColor: colors.danger,
  },
  modalConfirmButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
