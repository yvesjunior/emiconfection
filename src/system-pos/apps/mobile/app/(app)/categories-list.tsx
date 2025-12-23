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

interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  isActive: boolean;
  _count?: { children: number; products: number };
}

export default function CategoriesListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const mode = useAppModeStore((state) => state.mode);
  
  const canManage = hasPermission('categories:manage');
  const isTabMode = mode === 'manage'; // When in manage mode, this is a tab

  // Fetch categories
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['categories', 'manage'],
    queryFn: async () => {
      const res = await api.get('/categories?includeInactive=true');
      return res.data;
    },
  });

  const allCategories: Category[] = data?.data || [];
  
  // Filter by search
  const categories = search
    ? allCategories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : allCategories;

  const handleCategoryPress = useCallback((category: Category) => {
    if (!canManage) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission de gérer les catégories');
      return;
    }
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(app)/categories-manage?categoryId=${category.id}`);
  }, [canManage, router]);

  const getParentName = (category: Category) => {
    if (!category.parentId) return null;
    const parent = allCategories.find((c) => c.id === category.parentId);
    return parent?.name || null;
  };

  const renderCategory = ({ item }: { item: Category }) => {
    const parentName = getParentName(item);
    const childCount = item._count?.children || 0;
    const productCount = item._count?.products || 0;

    return (
      <TouchableOpacity
        style={[styles.categoryItem, !item.isActive && styles.categoryItemInactive]}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIcon, parentName && styles.categoryIconChild]}>
          <Ionicons
            name={parentName ? 'folder-outline' : 'folder'}
            size={24}
            color={item.isActive ? colors.primary : colors.textMuted}
          />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {item.name}
          </Text>
          {parentName && (
            <View style={styles.parentContainer}>
              <Ionicons name="return-down-forward" size={14} color={colors.textMuted} />
              <Text style={styles.parentName}>{parentName}</Text>
            </View>
          )}
          {item.description && (
            <Text style={styles.categoryDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          <View style={styles.categoryMeta}>
            {childCount > 0 && (
              <View style={styles.metaTag}>
                <Ionicons name="folder-outline" size={12} color={colors.textMuted} />
                <Text style={styles.metaTagText}>{childCount} sous-cat.</Text>
              </View>
            )}
            {productCount > 0 && (
              <View style={styles.metaTag}>
                <Ionicons name="cube-outline" size={12} color={colors.textMuted} />
                <Text style={styles.metaTagText}>{productCount} produits</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.categoryActions}>
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
            <Text style={styles.headerTitleLarge}>Catégories</Text>
            <Text style={styles.headerSubtitle}>Gérer vos catégories</Text>
          </View>
        )}
        {!isTabMode && <Text style={styles.headerTitle}>Gérer les catégories</Text>}
        {canManage && (
          <TouchableOpacity
            style={[styles.addButton, isTabMode && styles.addButtonTab]}
            onPress={() => router.push('/(app)/categories-manage')}
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
            placeholder="Rechercher une catégorie..."
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

      {/* Categories List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
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
                <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyStateText}>
                  {search ? 'Aucune catégorie trouvée' : 'Aucune catégorie'}
                </Text>
                {canManage && !search && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => router.push('/(app)/categories-manage')}
                  >
                    <Text style={styles.emptyStateButtonText}>Ajouter une catégorie</Text>
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
    paddingHorizontal: spacing.lg,
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
    backgroundColor: colors.success,
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  categoryItemInactive: {
    opacity: 0.6,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconChild: {
    backgroundColor: colors.primaryLight + '15',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  categoryName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  parentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  parentName: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  categoryDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTagText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  categoryActions: {
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

