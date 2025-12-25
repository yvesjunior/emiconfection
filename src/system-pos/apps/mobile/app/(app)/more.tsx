import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth';
import { useCartStore } from '../../src/store/cart';
import { useAppModeStore } from '../../src/store/appMode';
import { useOfflineQueueStore } from '../../src/store/offlineQueue';
import { forceSync } from '../../src/lib/offlineSync';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

const hapticImpact = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

interface Warehouse {
  id: string;
  name: string;
  code: string;
  type?: 'BOUTIQUE' | 'STOCKAGE';
  isActive?: boolean;
}

export default function MoreScreen() {
  const router = useRouter();
  const employee = useAuthStore((state) => state.employee);
  const logout = useAuthStore((state) => state.logout);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const getEffectiveWarehouse = useAuthStore((state) => state.getEffectiveWarehouse);
  const setSelectedWarehouse = useAuthStore((state) => state.setSelectedWarehouse);
  const clearCart = useCartStore((state) => state.clearCart);
  const mode = useAppModeStore((state) => state.mode);
  const canSwitchMode = useAppModeStore((state) => state.canSwitchMode);
  const setMode = useAppModeStore((state) => state.setMode);
  const isOnline = useOfflineQueueStore((state) => state.isOnline);
  const syncInProgress = useOfflineQueueStore((state) => state.syncInProgress);
  const pendingSales = useOfflineQueueStore((state) => state.pendingSales);
  const pendingCount = pendingSales.filter((s) => !s.synced).length;
  const [isSyncing, setIsSyncing] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  
  const currentWarehouse = getEffectiveWarehouse();

  const handleForceSync = async () => {
    if (!isOnline) {
      Alert.alert('Hors ligne', 'Impossible de synchroniser sans connexion internet.');
      return;
    }
    if (pendingCount === 0) {
      Alert.alert('Rien à synchroniser', 'Toutes les ventes sont déjà synchronisées.');
      return;
    }
    setIsSyncing(true);
    try {
      const result = await forceSync();
      hapticNotification(
        result.failed > 0
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success
      );
      Alert.alert(
        'Synchronisation terminée',
        `${result.synced} vente(s) synchronisée(s)${result.failed > 0 ? `\n${result.failed} échec(s)` : ''}`
      );
    } catch (error) {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'La synchronisation a échoué');
    } finally {
      setIsSyncing(false);
    }
  };

  // Check permissions for management features
  const canCreateProducts = hasPermission('products:create');
  const canUpdateProducts = hasPermission('products:update');
  const canManageCategories = hasPermission('categories:manage');
  const canManageProducts = canCreateProducts || canUpdateProducts;
  const canViewExpenses = hasPermission('expenses:view');
  const canCreateExpenses = hasPermission('expenses:create');
  const hasFinancialAccess = canViewExpenses || canCreateExpenses;
  const hasManagementAccess = canManageProducts || canManageCategories || hasFinancialAccess;

  const handleModeSwitch = async () => {
    if (!canSwitchMode) {
      Alert.alert(
        'Mode non disponible',
        'Vous n\'avez pas les permissions pour changer de mode.'
      );
      return;
    }
    const newMode = mode === 'sell' ? 'manage' : 'sell';
    await setMode(newMode);
    hapticImpact();
    // Navigate to main screen to refresh tabs properly
    router.replace('/' as any);
  };

  // Fetch warehouses for switching
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'switch'],
    queryFn: async () => {
      const res = await api.get('/warehouses?includeInactive=false');
      return res.data.data;
    },
  });

  const allWarehouses: Warehouse[] = warehousesData || [];
  
  // Filter warehouses based on mode and assigned warehouses
  // For now, we show all active warehouses, but filter by type based on mode
  // Later, we can filter by assigned warehouses when API supports it
  const availableWarehouses = allWarehouses.filter((w: Warehouse) => {
    if (!w.isActive) return false;
    // In sell mode, only show BOUTIQUE warehouses
    if (mode === 'sell') {
      return w.type === 'BOUTIQUE' || !w.type;
    }
    // In manage mode, show all warehouses
    return true;
  });

  const handleWarehouseSwitch = () => {
    setSelectedWarehouseId(currentWarehouse?.id || null);
    setShowWarehouseModal(true);
  };

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    setSelectedWarehouseId(warehouse.id);
  };

  const handleWarehouseConfirm = async () => {
    if (!selectedWarehouseId) return;
    
    const selectedWarehouse = availableWarehouses.find((w: Warehouse) => w.id === selectedWarehouseId);
    if (!selectedWarehouse) return;
    
    // Check if switching to STOCKAGE in sell mode
    if (mode === 'sell' && selectedWarehouse.type === 'STOCKAGE') {
      Alert.alert(
        'Changement impossible',
        'Vous ne pouvez pas vous connecter à un entrepôt de type Stockage en mode Vente. Veuillez passer en mode Gestion pour gérer les entrepôts Stockage.'
      );
      return;
    }
    
    await setSelectedWarehouse(selectedWarehouse);
    hapticNotification(Haptics.NotificationFeedbackType.Success);
    setShowWarehouseModal(false);
    Alert.alert('Succès', `Entrepôt changé vers ${selectedWarehouse.name}`, [
      { text: 'OK', onPress: () => router.replace('/' as any) }
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          clearCart();
          hapticNotification(Haptics.NotificationFeedbackType.Success);
          router.replace('/login');
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'inventory',
      icon: 'cube-outline',
      title: 'Vérifier le stock',
      subtitle: 'Voir les niveaux de stock',
      onPress: () => router.push('/(app)/inventory'),
    },
    {
      id: 'returns',
      icon: 'arrow-undo-outline',
      title: 'Retours',
      subtitle: 'Traiter les retours et remboursements',
      onPress: () => Alert.alert('Bientôt', 'Cette fonctionnalité arrive bientôt'),
    },
    {
      id: 'history',
      icon: 'time-outline',
      title: 'Historique des ventes',
      subtitle: 'Voir vos ventes passées',
      onPress: () => router.push('/(app)/sales'),
    },
    {
      id: 'customers',
      icon: 'people-outline',
      title: 'Clients',
      subtitle: 'Gérer vos clients',
      onPress: () => router.push('/(app)/customers'),
    },
  ];

  // Management items (permission-based)
  const managementItems = [
    ...(hasPermission('employees:manage') || hasPermission('employees:view')
      ? [
          {
            id: 'staff-management',
            icon: 'people-outline',
            title: 'Gestion du personnel',
            subtitle: 'Employés, rôles et permissions',
            onPress: () => router.push('/(app)/staff-management'),
          },
        ]
      : []),
    ...(hasPermission('inventory:view') || hasPermission('inventory:manage')
      ? [
          {
            id: 'transfer-requests',
            icon: 'swap-horizontal-outline',
            title: 'Demandes de transfert',
            subtitle: 'Voir et approuver les transferts',
            onPress: () => router.push('/(app)/transfer-requests-list'),
          },
        ]
      : []),
  ];

  // Finance items (permission-based)
  const financeItems = [
    ...(hasPermission('expenses:view') || hasPermission('expenses:create')
      ? [
          {
            id: 'expenses',
            icon: 'wallet-outline',
            title: 'Dépenses',
            subtitle: 'Gérer les dépenses',
            onPress: () => router.push('/(app)/expenses-list'),
          },
        ]
      : []),
    ...(hasPermission('expenses:view')
      ? [
          {
            id: 'financial-reports',
            icon: 'bar-chart-outline',
            title: 'Rapports financiers',
            subtitle: 'Ventes, dépenses et bénéfices',
            onPress: () => router.push('/(app)/reports-financial'),
          },
        ]
      : []),
  ];

  // Only show management items in manage mode
  const showManagementSection = mode === 'manage' && managementItems.length > 0;
  const showFinanceSection = mode === 'manage' && financeItems.length > 0;

  const settingsItems = [
    {
      id: 'printer',
      icon: 'print-outline',
      title: 'Imprimante',
      subtitle: 'Configuration de l\'imprimante',
      onPress: () => router.push('/(app)/settings-printer'),
    },
    {
      id: 'receipt',
      icon: 'receipt-outline',
      title: 'Format du reçu',
      subtitle: 'Personnaliser le reçu',
      onPress: () => router.push('/(app)/settings-receipt'),
    },
    {
      id: 'loyalty',
      icon: 'star-outline',
      title: 'Points de fidélité',
      subtitle: 'Taux d\'attribution et conversion',
      onPress: () => router.push('/(app)/settings-loyalty'),
      requiresAdmin: true,
    },
    {
      id: 'format',
      icon: 'globe-outline',
      title: 'Format & Devise',
      subtitle: 'Devise, séparateurs, formats',
      onPress: () => router.push('/(app)/settings-format'),
    },
  ];

  const supportItems = [
    {
      id: 'help',
      icon: 'help-circle-outline',
      title: 'Aide & Support',
      onPress: () => Alert.alert('Aide', 'Contactez votre administrateur pour obtenir de l\'aide'),
    },
    {
      id: 'about',
      icon: 'information-circle-outline',
      title: 'À propos',
      onPress: () =>
        Alert.alert(
          'POS Mobile',
          'Version 1.0.0\n\nUn système de point de vente moderne pour les commerces.'
        ),
    },
  ];

  // In manage mode, this is the Settings tab
  const isSettingsMode = mode === 'manage';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        {/* Header for Settings mode */}
        {isSettingsMode && (
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsHeaderTitle}>Paramètres</Text>
            <Text style={styles.settingsHeaderSubtitle}>Configuration et préférences</Text>
          </View>
        )}

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, isSettingsMode && styles.avatarManage]}>
            <Text style={styles.avatarText}>
              {employee?.fullName
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{employee?.fullName}</Text>
            <Text style={styles.profileRole}>{employee?.role.name}</Text>
            <Text style={styles.profileEmail}>{employee?.phone || employee?.email}</Text>
            {currentWarehouse && (
              <TouchableOpacity
                style={styles.warehouseBadge}
                onPress={handleWarehouseSwitch}
              >
                <Ionicons name="storefront" size={14} color={colors.primary} />
                <Text style={styles.warehouseBadgeText}>{currentWarehouse.name}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Mode Switcher */}
        {canSwitchMode && (
          <TouchableOpacity
            style={[
              styles.modeSwitcher,
              mode === 'manage' && styles.modeSwitcherManage,
            ]}
            onPress={handleModeSwitch}
          >
            <View style={[
              styles.modeSwitcherIcon,
              mode === 'manage' && styles.modeSwitcherIconManage,
            ]}>
              <Ionicons
                name={mode === 'sell' ? 'cart' : 'create'}
                size={24}
                color={mode === 'sell' ? colors.primary : colors.success}
              />
            </View>
            <View style={styles.modeSwitcherInfo}>
              <Text style={styles.modeSwitcherTitle}>
                Mode {mode === 'sell' ? 'Vente' : 'Gestion'}
              </Text>
              <Text style={styles.modeSwitcherSubtitle}>
                {mode === 'sell'
                  ? 'Appuyez pour passer en mode Gestion'
                  : 'Appuyez pour passer en mode Vente'}
              </Text>
            </View>
            <View style={[
              styles.modeSwitcherBadge,
              mode === 'manage' && styles.modeSwitcherBadgeManage,
            ]}>
              <Ionicons name="swap-horizontal" size={18} color={colors.textInverse} />
            </View>
          </TouchableOpacity>
        )}

        {/* Current Mode Display (for users who can't switch) */}
        {!canSwitchMode && (
          <View style={styles.modeDisplay}>
            <Ionicons name="cart" size={20} color={colors.primary} />
            <Text style={styles.modeDisplayText}>Mode Vente</Text>
          </View>
        )}

        {/* Warehouse Info */}
        {currentWarehouse && (
          <TouchableOpacity
            style={styles.shiftStatus}
            onPress={handleWarehouseSwitch}
          >
            <View style={styles.shiftStatusIcon}>
              <Ionicons
                name={(currentWarehouse.type === 'BOUTIQUE' || !currentWarehouse.type) ? 'storefront' : 'archive'}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.shiftStatusInfo}>
              <View style={styles.warehouseTitleRow}>
                <Text style={styles.shiftStatusTitle}>
                  {currentWarehouse.name}
                </Text>
                {currentWarehouse.type && (
                  <View style={[
                    styles.warehouseTypeBadge,
                    currentWarehouse.type === 'BOUTIQUE' ? styles.warehouseTypeBadgeBoutique : styles.warehouseTypeBadgeStockage
                  ]}>
                    <Text style={[
                      styles.warehouseTypeBadgeText,
                      currentWarehouse.type === 'BOUTIQUE' ? styles.warehouseTypeBadgeTextBoutique : styles.warehouseTypeBadgeTextStockage
                    ]}>
                      {currentWarehouse.type === 'BOUTIQUE' ? 'Boutique' : 'Stockage'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.shiftStatusSubtitle}>
                Code: {currentWarehouse.code}
              </Text>
              <Text style={styles.warehouseSwitchHint}>
                Appuyer pour changer d'entrepôt
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Sync Status */}
        {(pendingCount > 0 || !isOnline) && (
          <TouchableOpacity
            style={[
              styles.syncStatus,
              !isOnline && styles.syncStatusOffline,
            ]}
            onPress={handleForceSync}
            disabled={!isOnline || isSyncing || syncInProgress}
          >
            <View style={[
              styles.syncStatusIcon,
              !isOnline && styles.syncStatusIconOffline,
            ]}>
              <Ionicons
                name={isOnline ? 'cloud-upload-outline' : 'cloud-offline-outline'}
                size={24}
                color={isOnline ? colors.warning : colors.danger}
              />
            </View>
            <View style={styles.syncStatusInfo}>
              <Text style={[
                styles.syncStatusTitle,
                !isOnline && styles.syncStatusTitleOffline,
              ]}>
                {!isOnline
                  ? 'Mode hors ligne'
                  : `${pendingCount} vente(s) en attente`}
              </Text>
              <Text style={styles.syncStatusSubtitle}>
                {!isOnline
                  ? 'Les ventes seront synchronisées à la reconnexion'
                  : (isSyncing || syncInProgress)
                    ? 'Synchronisation en cours...'
                    : 'Appuyez pour synchroniser maintenant'}
              </Text>
            </View>
            {isOnline && pendingCount > 0 && (
              <View style={styles.syncBadge}>
                <Text style={styles.syncBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Management Items - only in manage mode */}
        {showManagementSection && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>📊 Gestion</Text>
            {managementItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon as any} size={24} color={colors.success} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Finance Items - only in manage mode */}
        {showFinanceSection && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>💰 Finance</Text>
            {financeItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon as any} size={24} color={colors.warning} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions - only in sell mode */}
        {!isSettingsMode && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Settings Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>⚙️ Paramètres</Text>
          {settingsItems
            .filter((item) => {
              // Filter out admin-only items if user is not admin
              if (item.requiresAdmin && employee?.role?.name !== 'admin') {
                return false;
              }
              return true;
            })
            .map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name={item.icon as any} size={24} color={colors.textSecondary} />
              </View>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Support Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          {supportItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons name={item.icon as any} size={24} color={colors.textSecondary} />
              </View>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.danger} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
        </ScrollView>

        {/* Warehouse Selection Modal */}
        <Modal
          visible={showWarehouseModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowWarehouseModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Changer d'entrepôt</Text>
                <Text style={styles.modalSubtitle}>
                  {mode === 'manage' 
                    ? 'Mode Gestion : Tous les entrepôts disponibles'
                    : 'Mode Vente : Seuls les entrepôts Boutique sont disponibles'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowWarehouseModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableWarehouses}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.warehouseList}
              renderItem={({ item }) => {
                const isBoutique = item.type === 'BOUTIQUE' || !item.type;
                const isStockage = item.type === 'STOCKAGE';
                const isSelected = selectedWarehouseId === item.id;
                const isCurrent = currentWarehouse?.id === item.id;
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.warehouseItem,
                      isSelected && styles.warehouseItemSelected,
                      isCurrent && styles.warehouseItemCurrent,
                    ]}
                    onPress={() => handleWarehouseSelect(item)}
                  >
                    <View style={[
                      styles.warehouseIcon,
                      isSelected && styles.warehouseIconSelected,
                    ]}>
                      <Ionicons
                        name={isBoutique ? 'storefront' : 'archive'}
                        size={24}
                        color={isSelected ? colors.textInverse : (isBoutique ? colors.primary : colors.success)}
                      />
                    </View>
                    <View style={styles.warehouseInfo}>
                      <View style={styles.warehouseTitleRow}>
                        <Text style={[
                          styles.warehouseName,
                          isSelected && styles.warehouseNameSelected,
                        ]}>
                          {item.name}
                        </Text>
                        {isCurrent && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Actuel</Text>
                          </View>
                        )}
                        {(isBoutique || isStockage) && (
                          <View style={[
                            styles.warehouseTypeBadge,
                            isBoutique ? styles.warehouseTypeBadgeBoutique : styles.warehouseTypeBadgeStockage
                          ]}>
                            <Text style={[
                              styles.warehouseTypeBadgeText,
                              isBoutique ? styles.warehouseTypeBadgeTextBoutique : styles.warehouseTypeBadgeTextStockage
                            ]}>
                              {isBoutique ? 'Boutique' : 'Stockage'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.warehouseCode}>Code: {item.code}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="business-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyStateText}>
                    {mode === 'sell' 
                      ? 'Aucun entrepôt Boutique disponible'
                      : 'Aucun entrepôt disponible'}
                  </Text>
                </View>
              }
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !selectedWarehouseId && styles.confirmButtonDisabled,
                ]}
                onPress={handleWarehouseConfirm}
                disabled={!selectedWarehouseId}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
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
  settingsHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  settingsHeaderTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
  },
  settingsHeaderSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarManage: {
    backgroundColor: colors.success,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textInverse,
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  profileRole: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  modeSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  modeSwitcherManage: {
    borderColor: colors.success,
    backgroundColor: colors.successLight + '10',
  },
  modeSwitcherIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSwitcherIconManage: {
    backgroundColor: colors.successLight + '20',
  },
  modeSwitcherInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  modeSwitcherTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  modeSwitcherSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  modeSwitcherBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSwitcherBadgeManage: {
    backgroundColor: colors.success,
  },
  modeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
  },
  modeDisplayText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  shiftStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  shiftStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftStatusInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  warehouseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  shiftStatusTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  shiftStatusSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  warehouseSwitchHint: {
    fontSize: fontSize.xs,
    color: colors.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  warehouseBadgeText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  warehouseTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  warehouseTypeBadgeBoutique: {
    backgroundColor: colors.primaryLight + '20',
  },
  warehouseTypeBadgeStockage: {
    backgroundColor: colors.successLight + '20',
  },
  warehouseTypeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  warehouseTypeBadgeTextBoutique: {
    color: colors.primary,
  },
  warehouseTypeBadgeTextStockage: {
    color: colors.success,
  },
  currentBadge: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.xl,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warehouseList: {
    padding: spacing.lg,
  },
  warehouseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  warehouseItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  warehouseItemCurrent: {
    borderColor: colors.success,
    borderWidth: 2,
  },
  warehouseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warehouseIconSelected: {
    backgroundColor: colors.primary,
  },
  warehouseInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  warehouseName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  warehouseNameSelected: {
    color: colors.primary,
  },
  warehouseCode: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textInverse,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.warningLight + '15',
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  syncStatusOffline: {
    backgroundColor: colors.dangerLight + '15',
    borderColor: colors.danger + '40',
  },
  syncStatusIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warning + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  syncStatusIconOffline: {
    backgroundColor: colors.danger + '20',
  },
  syncStatusInfo: {
    flex: 1,
  },
  syncStatusTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.warning,
  },
  syncStatusTitleOffline: {
    color: colors.danger,
  },
  syncStatusSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  syncBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  syncBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textInverse,
  },
  shiftButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.md,
  },
  shiftButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  menuSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemIconManagement: {
    backgroundColor: colors.successLight + '20',
  },
  menuItemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuItemTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  menuItemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.dangerLight + '20',
    borderRadius: borderRadius.lg,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.danger,
  },
  versionText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
});

