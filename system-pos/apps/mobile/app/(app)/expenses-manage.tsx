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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth';
import api from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/utils';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

interface ExpenseCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

const DEFAULT_ICON = 'cash-outline';
const DEFAULT_COLOR = colors.primary;

// Default expense categories with icons
const DEFAULT_CATEGORIES = [
  { name: 'Loyer', icon: 'home', color: '#6366F1' },
  { name: 'Électricité', icon: 'flash', color: '#F59E0B' },
  { name: 'Eau', icon: 'water', color: '#3B82F6' },
  { name: 'Internet', icon: 'wifi', color: '#10B981' },
  { name: 'Salaires', icon: 'people', color: '#8B5CF6' },
  { name: 'Transport', icon: 'car', color: '#EF4444' },
  { name: 'Fournitures', icon: 'cube', color: '#F97316' },
  { name: 'Maintenance', icon: 'construct', color: '#6B7280' },
  { name: 'Marketing', icon: 'megaphone', color: '#EC4899' },
  { name: 'Autre', icon: 'ellipsis-horizontal', color: '#64748B' },
];

export default function ExpenseManageScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');

  const canCreate = hasPermission('expenses:create');
  const canManage = hasPermission('expenses:manage');

  // Fetch expense categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await api.get('/expenses/categories');
      return res.data.data;
    },
  });

  // Fetch existing expense if editing
  const { data: expenseData, isLoading: isLoadingExpense } = useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      const res = await api.get(`/expenses/${id}`);
      return res.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (expenseData) {
      setSelectedCategory(expenseData.categoryId);
      setAmount(String(expenseData.amount));
      setDescription(expenseData.description || '');
      setReference(expenseData.reference || '');
    }
  }, [expenseData]);

  const categories: ExpenseCategory[] = categoriesData || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/expenses', data);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      Alert.alert('Succès', 'Dépense enregistrée', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de l\'enregistrement');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/expenses/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', id] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      Alert.alert('Succès', 'Dépense mise à jour', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de la mise à jour');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/expenses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      router.back();
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de la suppression');
    },
  });

  const handleSubmit = () => {
    if (!selectedCategory) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    const data = {
      categoryId: selectedCategory,
      amount: parsedAmount,
      description: description.trim() || null,
      reference: reference.trim() || null,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la dépense',
      'Êtes-vous sûr de vouloir supprimer cette dépense ?',
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

  const isLoading = isLoadingCategories || isLoadingExpense;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!isEditing && !canCreate) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Vous n'avez pas la permission d'ajouter des dépenses.
        </Text>
      </SafeAreaView>
    );
  }

  if (isEditing && !canManage) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Vous n'avez pas la permission de modifier cette dépense.
        </Text>
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
          {isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}
        </Text>
        {isEditing && canManage && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color={colors.danger} />
          </TouchableOpacity>
        )}
        {!isEditing && <View style={{ width: 44 }} />}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Montant</Text>
            <View style={styles.amountContainer}>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={styles.amountCurrency}>FCFA</Text>
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégorie</Text>
            <View style={styles.categoriesGrid}>
              {categories.length > 0 ? (
                categories.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  const iconName = category.icon || DEFAULT_ICON;
                  const iconColor = category.color || DEFAULT_COLOR;

                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        isSelected && { borderColor: iconColor, backgroundColor: iconColor + '15' },
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <View style={[styles.categoryIcon, { backgroundColor: iconColor + '20' }]}>
                        <Ionicons name={iconName as any} size={24} color={iconColor} />
                      </View>
                      <Text
                        style={[
                          styles.categoryButtonText,
                          isSelected && { color: iconColor, fontWeight: '600' },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                // Show default categories if none exist
                DEFAULT_CATEGORIES.slice(0, 6).map((category, index) => (
                  <View key={index} style={styles.categoryButton}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                      <Ionicons name={category.icon as any} size={24} color={category.color} />
                    </View>
                    <Text style={styles.categoryButtonText}>{category.name}</Text>
                  </View>
                ))
              )}
            </View>
            {categories.length === 0 && (
              <Text style={styles.noCategoriesText}>
                Aucune catégorie disponible. Contactez l'administrateur.
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description de la dépense..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Reference */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Référence (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder="N° de facture ou reçu"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons
                    name={isEditing ? 'checkmark-circle' : 'add-circle'}
                    size={24}
                    color={colors.textInverse}
                  />
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Mettre à jour' : 'Enregistrer la dépense'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
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
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    color: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlign: 'right',
  },
  amountCurrency: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textMuted,
    paddingRight: spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    width: '31%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noCategoriesText: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
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
  submitContainer: {
    padding: spacing.lg,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textInverse,
  },
});

