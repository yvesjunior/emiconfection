import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius } from '../../src/lib/theme';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

interface GroupedPermissions {
  [resource: string]: Permission[];
}

export default function PermissionsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  // Fetch permissions
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: async () => {
      const res = await api.get('/roles/permissions/all');
      return res.data;
    },
  });

  const permissions: Permission[] = data?.data || [];
  const grouped: GroupedPermissions = data?.grouped || {};

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    if (Object.keys(grouped).length > 0) {
      return grouped;
    }
    // Fallback: group manually
    return permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {} as GroupedPermissions);
  }, [permissions, grouped]);

  const resources = Object.keys(groupedPermissions).sort();

  // Filter resources by search
  const filteredResources = search
    ? resources.filter((resource) => {
        const perms = groupedPermissions[resource];
        return (
          resource.toLowerCase().includes(search.toLowerCase()) ||
          perms.some((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase())
          )
        );
      })
    : resources;

  const toggleResource = (resource: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource);
    } else {
      newExpanded.add(resource);
    }
    setExpandedResources(newExpanded);
  };

  const renderPermission = (permission: Permission) => (
    <View key={permission.id} style={styles.permissionItem}>
      <View style={styles.permissionIcon}>
        <Ionicons name="key" size={16} color={colors.primary} />
      </View>
      <View style={styles.permissionInfo}>
        <Text style={styles.permissionName}>{permission.name}</Text>
        {permission.description && (
          <Text style={styles.permissionDescription}>{permission.description}</Text>
        )}
        <View style={styles.permissionMeta}>
          <Text style={styles.permissionMetaText}>
            {permission.resource} • {permission.action}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderResource = ({ item: resource }: { item: string }) => {
    const perms = groupedPermissions[resource];
    const isExpanded = expandedResources.has(resource);
    const filteredPerms = search
      ? perms.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase())
        )
      : perms;

    if (filteredPerms.length === 0) return null;

    return (
      <View style={styles.resourceSection}>
        <TouchableOpacity
          style={styles.resourceHeader}
          onPress={() => toggleResource(resource)}
          activeOpacity={0.7}
        >
          <View style={styles.resourceHeaderLeft}>
            <View style={styles.resourceIcon}>
              <Ionicons name="folder" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.resourceName}>{resource}</Text>
              <Text style={styles.resourceCount}>
                {filteredPerms.length} permission{filteredPerms.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.permissionsContainer}>
            {filteredPerms.map(renderPermission)}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
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
        <Text style={styles.headerTitle}>Permissions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une permission..."
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

      {/* Permissions List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredResources}
          keyExtractor={(item) => item}
          renderItem={renderResource}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="key-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyStateText}>
                {search ? 'Aucune permission trouvée' : 'Aucune permission'}
              </Text>
            </View>
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
    flexGrow: 1,
  },
  resourceSection: {
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  resourceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  resourceName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  resourceCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  permissionsContainer: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingBottom: spacing.md,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xl + spacing.md,
  },
  permissionIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionName: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  permissionDescription: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  permissionMeta: {
    marginTop: 2,
  },
  permissionMetaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
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

