import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useAuthStore } from '../../src/store/auth';
import { useCartStore } from '../../src/store/cart';
import { useAppModeStore } from '../../src/store/appMode';
import { useOfflineQueueStore } from '../../src/store/offlineQueue';
import { forceSync } from '../../src/lib/offlineSync';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

const hapticImpact = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export default function MoreScreen() {
  const router = useRouter();
  const employee = useAuthStore((state) => state.employee);
  const logout = useAuthStore((state) => state.logout);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const clearCart = useCartStore((state) => state.clearCart);
  const mode = useAppModeStore((state) => state.mode);
  const canSwitchMode = useAppModeStore((state) => state.canSwitchMode);
  const setMode = useAppModeStore((state) => state.setMode);
  const isOnline = useOfflineQueueStore((state) => state.isOnline);
  const syncInProgress = useOfflineQueueStore((state) => state.syncInProgress);
  const pendingSales = useOfflineQueueStore((state) => state.pendingSales);
  const pendingCount = pendingSales.filter((s) => !s.synced).length;
  const [isSyncing, setIsSyncing] = useState(false);

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
  const hasManagementAccess = canManageProducts || canManageCategories;
  
  // Only show management items in manage mode
  const showManagementSection = hasManagementAccess && mode === 'manage';

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

  const canViewExpenses = hasPermission('expenses:view');
  const canCreateExpenses = hasPermission('expenses:create');

  const menuItems = [
    {
      id: 'inventory',
      icon: 'cube-outline',
      title: 'Vérifier le stock',
      subtitle: 'Voir les niveaux de stock',
      onPress: () => router.push('/(app)/inventory'),
    },
    ...(canViewExpenses ? [{
      id: 'expenses',
      icon: 'wallet-outline',
      title: 'Dépenses',
      subtitle: 'Gérer les dépenses de l\'entrepôt',
      onPress: () => router.push('/(app)/expenses'),
    }] : []),
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
      id: 'reports',
      icon: 'bar-chart-outline',
      title: 'Rapports',
      subtitle: 'Résumé des ventes et bénéfices',
      onPress: () => router.push('/(app)/reports'),
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
    ...(canManageProducts
      ? [
          {
            id: 'add-product',
            icon: 'add-circle-outline',
            title: 'Ajouter un produit',
            subtitle: 'Créer un nouveau produit',
            onPress: () => router.push('/(app)/products-manage'),
          },
        ]
      : []),
    ...(canManageCategories
      ? [
          {
            id: 'add-category',
            icon: 'folder-open-outline',
            title: 'Ajouter une catégorie',
            subtitle: 'Créer une nouvelle catégorie',
            onPress: () => router.push('/(app)/categories-manage'),
          },
        ]
      : []),
    ...(canManageProducts
      ? [
          {
            id: 'manage-products',
            icon: 'pricetags-outline',
            title: 'Gérer les produits',
            subtitle: 'Modifier ou supprimer des produits',
            onPress: () => router.push('/(app)/products-list'),
          },
        ]
      : []),
    ...(canManageCategories
      ? [
          {
            id: 'manage-categories',
            icon: 'albums-outline',
            title: 'Gérer les catégories',
            subtitle: 'Modifier ou supprimer des catégories',
            onPress: () => router.push('/(app)/categories-list'),
          },
        ]
      : []),
  ];

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
        {employee?.warehouse && (
          <View style={styles.shiftStatus}>
            <View style={styles.shiftStatusIcon}>
              <Ionicons
                name="business-outline"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.shiftStatusInfo}>
              <Text style={styles.shiftStatusTitle}>
                {employee.warehouse.name}
              </Text>
              <Text style={styles.shiftStatusSubtitle}>
                Code: {employee.warehouse.code}
              </Text>
            </View>
          </View>
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
          {settingsItems.map((item) => (
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

