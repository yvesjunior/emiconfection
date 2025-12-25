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
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  employeeCount: number;
}

export default function RolesListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const employee = useAuthStore((state) => state.employee);
  const isAdmin = employee?.role?.name === 'admin';

  // Fetch roles
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data;
    },
  });

  const allRoles: Role[] = data?.data || [];
  
  // Filter by search
  const roles = search
    ? allRoles.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      )
    : allRoles;

  const handleRolePress = useCallback((role: Role) => {
    if (role.isSystem && !isAdmin) {
      Alert.alert('Rôle système', 'Ce rôle système ne peut pas être modifié');
      return;
    }
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to role detail/edit screen (to be created)
    Alert.alert('Détails du rôle', `Rôle: ${role.name}\nEmployés: ${role.employeeCount}\nPermissions: ${role.permissions.length}`);
  }, [isAdmin]);

  const renderRole = ({ item }: { item: Role }) => {
    const roleName = item.name === 'admin' ? 'Admin' : 
                     item.name === 'manager' ? 'Manager' : 
                     item.name === 'cashier' ? 'Vendeur' : item.name;

    return (
      <TouchableOpacity
        style={styles.roleItem}
        onPress={() => handleRolePress(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.roleIcon,
          item.name === 'admin' && styles.roleIconAdmin,
          item.name === 'manager' && styles.roleIconManager,
        ]}>
          <Ionicons
            name="shield"
            size={24}
            color={item.name === 'admin' ? colors.danger : item.name === 'manager' ? colors.primary : colors.textSecondary}
          />
        </View>
        <View style={styles.roleInfo}>
          <View style={styles.roleHeader}>
            <Text style={styles.roleName}>{roleName}</Text>
            {item.isSystem && (
              <View style={styles.systemBadge}>
                <Text style={styles.systemBadgeText}>Système</Text>
              </View>
            )}
          </View>
          {item.description && (
            <Text style={styles.roleDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.roleMeta}>
            <View style={styles.metaTag}>
              <Ionicons name="people-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaTagText}>{item.employeeCount} employé{item.employeeCount > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.metaTag}>
              <Ionicons name="key-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaTagText}>{item.permissions.length} permission{item.permissions.length > 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rôles</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un rôle..."
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

      {/* Roles List */}
      <FlatList
        data={roles}
        keyExtractor={(item) => item.id}
        renderItem={renderRole}
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
                <Ionicons name="shield-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>
                  {search ? 'Aucun rôle trouvé' : 'Aucun rôle'}
                </Text>
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
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
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
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIconAdmin: {
    backgroundColor: colors.danger + '20',
  },
  roleIconManager: {
    backgroundColor: colors.primary + '20',
  },
  roleInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  roleName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  systemBadge: {
    backgroundColor: colors.textMuted + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  systemBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  roleDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  roleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaTagText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
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
});

