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

export default function EmployeesListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const mode = useAppModeStore((state) => state.mode);
  
  const canManage = hasPermission('employees:manage');
  const isTabMode = mode === 'manage';

  const employee = useAuthStore((state) => state.employee);

  // Fetch employees (API already filters based on role)
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['employees', 'manage'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data;
    },
  });

  const allEmployees: Employee[] = data?.data || [];
  
  // Filter by search
  const employees = search
    ? allEmployees.filter((e) =>
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.phone.toLowerCase().includes(search.toLowerCase()) ||
        e.role.name.toLowerCase().includes(search.toLowerCase())
      )
    : allEmployees;

  const handleEmployeePress = useCallback((employee: Employee) => {
    if (!canManage) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission de gérer les employés');
      return;
    }
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/employees-manage?employeeId=${employee.id}`);
  }, [canManage, router]);

  const renderEmployee = ({ item }: { item: Employee }) => {
    const roleName = item.role.name === 'admin' ? 'Admin' : 
                     item.role.name === 'manager' ? 'Manager' : 
                     item.role.name === 'cashier' ? 'Vendeur' : item.role.name;

    return (
      <TouchableOpacity
        style={[styles.employeeItem, !item.isActive && styles.employeeItemInactive]}
        onPress={() => handleEmployeePress(item)}
        activeOpacity={0.7}
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
        {!isTabMode ? (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleLarge}>Personnel</Text>
            <Text style={styles.headerSubtitle}>Gérer votre équipe</Text>
          </View>
        )}
        {!isTabMode && <Text style={styles.headerTitle}>Gérer le personnel</Text>}
        {canManage && (
          <TouchableOpacity
            style={[styles.addButton, isTabMode && styles.addButtonTab]}
            onPress={() => router.push('/(app)/employees-manage')}
          >
            <Ionicons name="add" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        )}
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
                  {search ? 'Aucun employé trouvé' : 'Aucun employé'}
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

