import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth';
import api from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/utils';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

interface ExpenseCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

export default function ExpensesManageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const expenseId = params.expenseId as string | undefined;
  const queryClient = useQueryClient();
  const employee = useAuthStore((state) => state.employee);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const isEditing = !!expenseId;
  const canManage = hasPermission('expenses:manage');
  const canCreate = hasPermission('expenses:create');

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch expense categories
  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await api.get('/expenses/categories');
      return res.data.data as ExpenseCategory[];
    },
  });

  const categories = categoriesData || [];

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'expenses'],
    queryFn: async () => {
      const res = await api.get('/warehouses?includeInactive=false');
      return res.data.data as Warehouse[];
    },
  });

  const warehouses = warehousesData || [];

  // Filter warehouses based on role
  const availableWarehouses = warehouses.filter((w) => {
    if (employee?.role?.name === 'admin') return true;
    if (employee?.role?.name === 'manager') {
      return employee?.warehouseId === w.id;
    }
    return employee?.warehouseId === w.id;
  });

  // Set default warehouse for non-admin
  useEffect(() => {
    if (!warehouseId && employee?.warehouseId && !isEditing) {
      setWarehouseId(employee.warehouseId);
    }
  }, [employee?.warehouseId, warehouseId, isEditing]);

  // Fetch expense if editing
  const { data: expenseData, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      const res = await api.get(`/expenses/${expenseId}`);
      return res.data.data;
    },
    enabled: isEditing && !!expenseId,
  });

  useEffect(() => {
    if (expenseData) {
      setAmount(expenseData.amount.toString());
      setDescription(expenseData.description || '');
      setReference(expenseData.reference || '');
      setCategoryId(expenseData.categoryId);
      setWarehouseId(expenseData.warehouseId);
      setDate(expenseData.date.split('T')[0]);
    }
  }, [expenseData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const res = await api.put(`/expenses/${expenseId}`, data);
        return res.data.data;
      } else {
        const res = await api.post('/expenses', data);
        return res.data.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', `Dépense ${isEditing ? 'modifiée' : 'créée'} avec succès`, [
        { text: 'OK', onPress: () => router.replace('/(app)/expenses-list') },
      ]);
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
    },
  });

  const handleSave = () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide');
      return;
    }

    if (!categoryId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }

    if (!warehouseId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un entrepôt');
      return;
    }

    setIsSaving(true);
    saveMutation.mutate(
      {
        categoryId,
        warehouseId,
        amount: Number(amount),
        description: description || null,
        reference: reference || null,
        date: new Date(date).toISOString(),
      },
      {
        onSettled: () => {
          setIsSaving(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isEditing && !canManage) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(app)/expenses-list')}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier la dépense</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
          <Text style={styles.accessDeniedTitle}>Accès refusé</Text>
          <Text style={styles.accessDeniedText}>
            Vous n'avez pas la permission de modifier les dépenses
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isEditing && !canCreate) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(app)/expenses-list')}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle dépense</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
          <Text style={styles.accessDeniedTitle}>Accès refusé</Text>
          <Text style={styles.accessDeniedText}>
            Vous n'avez pas la permission de créer des dépenses
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(app)/expenses-list')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.label}>Montant *</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <Text style={styles.currency}>FCFA</Text>
          </View>
          {amount && !isNaN(parseFloat(amount)) && (
            <Text style={styles.helperText}>
              {formatCurrency(parseFloat(amount))}
            </Text>
          )}
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Catégorie *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            {selectedCategory ? (
              <View style={styles.pickerSelected}>
                {selectedCategory.icon && (
                  <Ionicons
                    name={selectedCategory.icon as any}
                    size={20}
                    color={selectedCategory.color || colors.primary}
                  />
                )}
                <Text style={styles.pickerSelectedText}>{selectedCategory.name}</Text>
              </View>
            ) : (
              <Text style={styles.pickerPlaceholder}>Sélectionner une catégorie</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Warehouse */}
        <View style={styles.section}>
          <Text style={styles.label}>Entrepôt *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowWarehousePicker(true)}
            disabled={availableWarehouses.length === 1}
          >
            {selectedWarehouse ? (
              <View style={styles.pickerSelected}>
                <Ionicons name="storefront-outline" size={20} color={colors.primary} />
                <Text style={styles.pickerSelectedText}>
                  {selectedWarehouse.name} ({selectedWarehouse.code})
                </Text>
              </View>
            ) : (
              <Text style={styles.pickerPlaceholder}>Sélectionner un entrepôt</Text>
            )}
            {availableWarehouses.length > 1 && (
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
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
          <Text style={styles.label}>Référence</Text>
          <TextInput
            style={styles.input}
            value={reference}
            onChangeText={setReference}
            placeholder="Numéro de reçu, facture..."
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={colors.textInverse} />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Enregistrer' : 'Créer'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner une catégorie</Text>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryOption}
                onPress={() => {
                  setCategoryId(item.id);
                  setShowCategoryPicker(false);
                }}
              >
                {item.icon && (
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={item.color || colors.primary}
                  />
                )}
                <Text style={styles.categoryOptionText}>{item.name}</Text>
                {categoryId === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Warehouse Picker Modal */}
      <Modal
        visible={showWarehousePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWarehousePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner un entrepôt</Text>
            <TouchableOpacity onPress={() => setShowWarehousePicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableWarehouses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.warehouseOption}
                onPress={() => {
                  setWarehouseId(item.id);
                  setShowWarehousePicker(false);
                }}
              >
                <Ionicons name="storefront-outline" size={24} color={colors.primary} />
                <View style={styles.warehouseOptionInfo}>
                  <Text style={styles.warehouseOptionName}>{item.name}</Text>
                  <Text style={styles.warehouseOptionCode}>{item.code}</Text>
                </View>
                {warehouseId === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  amountInput: {
    flex: 1,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlign: 'right',
  },
  currency: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textMuted,
    paddingRight: spacing.md,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  pickerSelectedText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  pickerPlaceholder: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textInverse,
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
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  warehouseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  warehouseOptionInfo: {
    flex: 1,
  },
  warehouseOptionName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  warehouseOptionCode: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  accessDeniedTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  accessDeniedText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fontSize.md * 1.5,
  },
});
