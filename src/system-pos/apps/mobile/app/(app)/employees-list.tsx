import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth';
import { useAppModeStore } from '../../src/store/appMode';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

interface Employee {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: {
    id: string;
    name: string;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
  } | null;
  isActive: boolean;
}

type RoleFilter = 'all' | 'admin' | 'manager' | 'cashier';

export default function EmployeesListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const mode = useAppModeStore((state) => state.mode);
  
  const canManage = hasPermission('employees:manage');
  const isTabMode = mode === 'manage';

  const employee = useAuthStore((state) => state.employee);
  const isManager = employee?.role?.name === 'manager';
  const isAdmin = employee?.role?.name === 'admin';

  // Fetch employees (API already filters based on role)
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['employees', 'manage'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data;
    },
  });

  const allEmployees: Employee[] = data?.data || [];
  
  // Count employees by role (only count what's visible to current user)
  const adminCount = isManager ? 0 : allEmployees.filter((e) => e.role.name === 'admin').length;
  const managerCount = isManager ? 0 : allEmployees.filter((e) => e.role.name === 'manager').length;
  const cashierCount = allEmployees.filter((e) => e.role.name === 'cashier').length;
  
  // Filter by role
  // For managers: 'all' shows themselves + sellers, 'cashier' shows only sellers
  // For admins: all filters work normally
  const filteredByRole = roleFilter === 'all'
    ? allEmployees
    : roleFilter === 'cashier'
      ? allEmployees.filter((e) => e.role.name === 'cashier')
      : isManager
        ? [] // Managers can't filter by admin/manager
        : allEmployees.filter((e) => e.role.name === roleFilter);
  
  // Filter by search
  const employees = search
    ? filteredByRole.filter((e) =>
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.phone.toLowerCase().includes(search.toLowerCase()) ||
        e.role.name.toLowerCase().includes(search.toLowerCase())
      )
    : filteredByRole;

  const handleEmployeePress = useCallback((employeeToEdit: Employee) => {
    if (!canManage) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission de gérer les employés');
      return;
    }

    // Check hierarchy: Manager cannot edit Admin or other Managers
    const currentRole = employee?.role?.name;
    const targetRole = employeeToEdit.role.name;
    
    if (currentRole === 'manager') {
      if (targetRole === 'admin' || targetRole === 'manager') {
        Alert.alert(
          'Accès refusé',
          'Vous ne pouvez pas modifier un Administrateur ou un autre Manager. Vous pouvez uniquement gérer les Vendeurs assignés à votre entrepôt.'
        );
        return;
      }
      // Manager can only edit Sellers from their warehouse
      if (employee?.warehouseId && employeeToEdit.warehouseId !== employee.warehouseId) {
        Alert.alert(
          'Accès refusé',
          'Vous ne pouvez modifier que les employés assignés à votre entrepôt.'
        );
        return;
      }
    } else if (currentRole === 'cashier') {
      // Seller cannot edit anyone
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission de modifier les employés');
      return;
    }

    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/employees-manage?employeeId=${employeeToEdit.id}`);
  }, [canManage, router, employee]);

  const renderEmployee = ({ item }: { item: Employee }) => {
    const roleName = item.role.name === 'admin' ? 'Admin' : 
                     item.role.name === 'manager' ? 'Manager' : 
                     item.role.name === 'cashier' ? 'Vendeur' : item.role.name;

    // Check if current user can edit this employee
    const currentRole = employee?.role?.name;
    const canEditThisEmployee = 
      currentRole === 'admin' || // Admin can edit all
      (currentRole === 'manager' && 
       item.role.name === 'cashier' && 
       (!employee?.warehouseId || item.warehouseId === employee.warehouseId)); // Manager can only edit Sellers from their warehouse

    return (
      <TouchableOpacity
        style={[
          styles.employeeItem, 
          !item.isActive && styles.employeeItemInactive,
          canManage && !canEditThisEmployee && styles.employeeItemReadOnly,
        ]}
        onPress={() => handleEmployeePress(item)}
        activeOpacity={canManage && !canEditThisEmployee ? 1 : 0.7}
        disabled={canManage && !canEditThisEmployee}
      >
        <View style={styles.employeeIcon}>
          <Ionicons
            name="person"
            size={24}
            color={item.isActive ? colors.primary : colors.textMuted}
          />
        </View>
        <View style={styles.employeeInfo}>
          <View style={styles.employeeHeader}>
            <Text style={styles.employeeName} numberOfLines={1}>
              {item.fullName}
            </Text>
            <View style={[
              styles.roleBadge,
              item.role.name === 'admin' && styles.roleBadgeAdmin,
              item.role.name === 'manager' && styles.roleBadgeManager,
            ]}>
              <Text style={[
                styles.roleBadgeText,
                item.role.name === 'admin' && styles.roleBadgeTextAdmin,
                item.role.name === 'manager' && styles.roleBadgeTextManager,
              ]}>
                {roleName}
              </Text>
            </View>
          </View>
          <View style={styles.employeeMeta}>
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{item.phone}</Text>
            </View>
            {item.warehouse && (
              <View style={styles.metaRow}>
                <Ionicons name="storefront-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.warehouse.name}</Text>
              </View>
            )}
            {item.email && (
              <View style={styles.metaRow}>
                <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>{item.email}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.employeeActions}>
          {!item.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactif</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isTabMode && styles.headerTab]}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          // Navigate back to staff-management - parent screen
          if (router.canDismiss()) {
            router.dismissAll();
          }
          setTimeout(() => {
            router.push('/(app)/staff-management' as any);
          }, 100);
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        {isTabMode ? (
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleLarge}>Personnel</Text>
            <Text style={styles.headerSubtitle}>Gérer votre équipe</Text>
          </View>
        ) : (
          <Text style={styles.headerTitle}>Gérer le personnel</Text>
        )}
        {canManage && (
          <TouchableOpacity
            style={[styles.addButton, isTabMode && styles.addButtonTab]}
            onPress={() => router.push('/(app)/employees-manage')}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>

      {/* Role Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          <TouchableOpacity
            style={[styles.tab, roleFilter === 'all' && styles.tabActive]}
            onPress={() => {
              setRoleFilter('all');
              hapticImpact(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.tabText, roleFilter === 'all' && styles.tabTextActive]}>
              Tous {allEmployees.length > 0 && `(${allEmployees.length})`}
            </Text>
          </TouchableOpacity>
          {!isManager && (
            <>
              <TouchableOpacity
                style={[styles.tab, roleFilter === 'admin' && styles.tabActive]}
                onPress={() => {
                  setRoleFilter('admin');
                  hapticImpact(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.tabText, roleFilter === 'admin' && styles.tabTextActive]}>
                  Admin {adminCount > 0 && `(${adminCount})`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, roleFilter === 'manager' && styles.tabActive]}
                onPress={() => {
                  setRoleFilter('manager');
                  hapticImpact(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.tabText, roleFilter === 'manager' && styles.tabTextActive]}>
                  Manager {managerCount > 0 && `(${managerCount})`}
                </Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[styles.tab, roleFilter === 'cashier' && styles.tabActive]}
            onPress={() => {
              setRoleFilter('cashier');
              hapticImpact(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[styles.tabText, roleFilter === 'cashier' && styles.tabTextActive]}>
              Vendeur {cashierCount > 0 && `(${cashierCount})`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un employé..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Employees List */}
      <FlatList
        data={employees}
        keyExtractor={(item) => item.id}
        renderItem={renderEmployee}
        contentContainerStyle={styles.listContent}
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
                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>
                  {search 
                    ? 'Aucun employé trouvé' 
                    : roleFilter === 'all'
                      ? 'Aucun employé'
                      : roleFilter === 'admin'
                        ? 'Aucun administrateur'
                        : roleFilter === 'manager'
                          ? 'Aucun manager'
                          : 'Aucun vendeur'}
                </Text>
                {canManage && !search && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => router.push('/(app)/employees-manage')}
                  >
                    <Text style={styles.emptyStateButtonText}>Ajouter un employé</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTab: {
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitleLarge: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonTab: {
    width: 48,
    height: 48,
  },
  tabsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  listContent: {
    flexGrow: 1,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  employeeItemInactive: {
    opacity: 0.6,
  },
  employeeItemReadOnly: {
    opacity: 0.5,
    backgroundColor: colors.surfaceSecondary,
  },
  employeeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  employeeName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  roleBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  roleBadgeAdmin: {
    backgroundColor: colors.danger + '20',
  },
  roleBadgeManager: {
    backgroundColor: colors.primary + '20',
  },
  roleBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  roleBadgeTextAdmin: {
    color: colors.danger,
  },
  roleBadgeTextManager: {
    color: colors.primary,
  },
  employeeMeta: {
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  employeeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inactiveBadge: {
    backgroundColor: colors.textMuted + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  inactiveBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 48 + spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptyStateButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  emptyStateButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
});

