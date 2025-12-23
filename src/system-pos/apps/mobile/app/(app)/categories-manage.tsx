import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  isActive: boolean;
  icon?: string | null;
  color?: string | null;
  _count?: { children: number; products: number };
}

// Available icons for categories
const CATEGORY_ICONS = [
  'grid-outline', 'cube-outline', 'pricetag-outline', 'bag-outline', 
  'cart-outline', 'basket-outline', 'gift-outline', 'shirt-outline',
  'restaurant-outline', 'cafe-outline', 'pizza-outline', 'beer-outline',
  'wine-outline', 'ice-cream-outline', 'nutrition-outline', 'fast-food-outline',
  'phone-portrait-outline', 'laptop-outline', 'desktop-outline', 'tv-outline',
  'camera-outline', 'headset-outline', 'game-controller-outline', 'watch-outline',
  'home-outline', 'bed-outline', 'car-outline', 'bicycle-outline',
  'fitness-outline', 'football-outline', 'medical-outline', 'medkit-outline',
  'book-outline', 'school-outline', 'briefcase-outline', 'construct-outline',
  'hammer-outline', 'color-palette-outline', 'flower-outline', 'leaf-outline',
  'paw-outline', 'fish-outline', 'earth-outline', 'diamond-outline',
  'sparkles-outline', 'star-outline', 'heart-outline', 'ribbon-outline',
];

// Available colors for categories
const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
];

export default function CategoriesManageScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const isEditing = !!categoryId;
  const canManage = hasPermission('categories:manage');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [icon, setIcon] = useState<string>('grid-outline');
  const [color, setColor] = useState<string>('#3B82F6');
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Check permission
  useEffect(() => {
    if (!canManage) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission de gérer les catégories');
      router.back();
    }
  }, [canManage, router]);

  // Fetch all categories for parent selection
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => {
      const res = await api.get('/categories?includeInactive=true');
      return res.data.data;
    },
  });

  const allCategories: Category[] = categoriesData || [];
  
  // Filter out the current category and its children for parent selection
  const availableParentCategories = allCategories.filter((c) => c.id !== categoryId);

  // Fetch category if editing
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const res = await api.get(`/categories/${categoryId}`);
      return res.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (categoryData) {
      setName(categoryData.name || '');
      setDescription(categoryData.description || '');
      setParentId(categoryData.parentId || null);
      setIsActive(categoryData.isActive ?? true);
      setIcon(categoryData.icon || 'grid-outline');
      setColor(categoryData.color || '#3B82F6');
    }
  }, [categoryData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const res = await api.put(`/categories/${categoryId}`, data);
        return res.data;
      } else {
        const res = await api.post('/categories', data);
        return res.data;
      }
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      Alert.alert(
        'Succès',
        isEditing ? 'Catégorie modifiée avec succès' : 'Catégorie créée avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      const message = error.response?.data?.message || 'Une erreur est survenue';
      Alert.alert('Erreur', message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/categories/${categoryId}`);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      Alert.alert('Succès', 'Catégorie supprimée avec succès', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      const message = error.response?.data?.message || 'Impossible de supprimer cette catégorie';
      Alert.alert('Erreur', message);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      parentId: parentId || null,
      isActive,
      icon,
      color,
    };

    saveMutation.mutate(data);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la catégorie',
      'Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  const getParentCategoryName = () => {
    if (!parentId) return 'Aucune (catégorie principale)';
    const parent = allCategories.find((c) => c.id === parentId);
    return parent?.name || 'Inconnue';
  };

  if (isEditing && isLoadingCategory) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, saveMutation.isPending && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Ionicons name="checkmark" size={24} color={colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom de la catégorie *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Électronique, Vêtements..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description de la catégorie..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Icon & Color Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Apparence</Text>
            
            <TouchableOpacity
              style={styles.iconSelector}
              onPress={() => setShowIconPicker(true)}
            >
              <View style={styles.iconPreview}>
                <View style={[styles.iconCircle, { backgroundColor: color }]}>
                  <Ionicons name={icon as any} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.iconSelectorInfo}>
                  <Text style={styles.iconSelectorLabel}>Icône et couleur</Text>
                  <Text style={styles.iconSelectorValue}>Appuyez pour modifier</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Parent Category Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégorie parente</Text>
            
            <TouchableOpacity
              style={styles.parentSelector}
              onPress={() => setShowParentPicker(true)}
            >
              <View style={styles.parentSelectorContent}>
                <Ionicons name="folder-outline" size={20} color={colors.primary} />
                <Text style={styles.parentSelectorText}>{getParentCategoryName()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Sélectionnez une catégorie parente pour créer une sous-catégorie
            </Text>
          </View>

          {/* Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statut</Text>

            <TouchableOpacity
              style={styles.statusToggle}
              onPress={() => setIsActive(!isActive)}
            >
              <View style={styles.statusToggleContent}>
                <View style={[styles.statusIndicator, isActive ? styles.statusActive : styles.statusInactive]} />
                <View>
                  <Text style={styles.statusTitle}>
                    {isActive ? 'Active' : 'Inactive'}
                  </Text>
                  <Text style={styles.statusDescription}>
                    {isActive
                      ? 'La catégorie est visible dans l\'application'
                      : 'La catégorie est masquée'}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isActive ? 'toggle' : 'toggle-outline'}
                size={32}
                color={isActive ? colors.success : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Delete Button (only when editing) */}
          {isEditing && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    <Text style={styles.deleteButtonText}>Supprimer la catégorie</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Parent Category Picker Modal */}
      <Modal
        visible={showParentPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowParentPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Catégorie parente</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowParentPicker(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={[{ id: null, name: 'Aucune (catégorie principale)' }, ...availableParentCategories]}
            keyExtractor={(item) => item.id || 'none'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.parentOption,
                  (parentId === item.id || (item.id === null && !parentId)) &&
                    styles.parentOptionSelected,
                ]}
                onPress={() => {
                  setParentId(item.id);
                  setShowParentPicker(false);
                }}
              >
                <View style={styles.parentOptionContent}>
                  <Ionicons
                    name={item.id === null ? 'folder-open-outline' : 'folder-outline'}
                    size={24}
                    color={
                      parentId === item.id || (item.id === null && !parentId)
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.parentOptionText,
                      (parentId === item.id || (item.id === null && !parentId)) &&
                        styles.parentOptionTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </View>
                {(parentId === item.id || (item.id === null && !parentId)) && (
                  <Ionicons name="checkmark" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.parentList}
          />
        </SafeAreaView>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal
        visible={showIconPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowIconPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Icône et couleur</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowIconPicker(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Preview */}
            <View style={styles.iconPickerPreview}>
              <View style={[styles.iconPreviewLarge, { backgroundColor: color }]}>
                <Ionicons name={icon as any} size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.iconPickerPreviewText}>{name || 'Catégorie'}</Text>
            </View>

            {/* Color Selection */}
            <View style={styles.iconPickerSection}>
              <Text style={styles.iconPickerSectionTitle}>Couleur</Text>
              <View style={styles.colorGrid}>
                {CATEGORY_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      color === c && styles.colorOptionSelected,
                    ]}
                    onPress={() => {
                      setColor(c);
                      hapticNotification(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    {color === c && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Icon Selection */}
            <View style={styles.iconPickerSection}>
              <Text style={styles.iconPickerSectionTitle}>Icône</Text>
              <View style={styles.iconGrid}>
                {CATEGORY_ICONS.map((i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.iconOption,
                      icon === i && styles.iconOptionSelected,
                    ]}
                    onPress={() => {
                      setIcon(i);
                      hapticNotification(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <Ionicons
                      name={i as any}
                      size={24}
                      color={icon === i ? color : colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: spacing.xxl }} />
          </ScrollView>

          <View style={styles.iconPickerFooter}>
            <TouchableOpacity
              style={styles.iconPickerDoneButton}
              onPress={() => setShowIconPicker(false)}
            >
              <Text style={styles.iconPickerDoneText}>Terminé</Text>
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
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  parentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  parentSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  parentSelectorText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: colors.success,
  },
  statusInactive: {
    backgroundColor: colors.textMuted,
  },
  statusTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  statusDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.danger,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parentList: {
    paddingVertical: spacing.md,
  },
  parentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  parentOptionSelected: {
    backgroundColor: colors.primaryLight + '10',
  },
  parentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  parentOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  parentOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  // Icon & Color Picker Styles
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  iconPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSelectorInfo: {
    gap: 2,
  },
  iconSelectorLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  iconSelectorValue: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  iconPickerPreview: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  iconPreviewLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconPickerPreviewText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  iconPickerSection: {
    padding: spacing.lg,
  },
  iconPickerSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight + '20',
  },
  iconPickerFooter: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconPickerDoneButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  iconPickerDoneText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
  },
});

