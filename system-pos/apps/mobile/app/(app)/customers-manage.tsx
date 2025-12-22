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

interface CustomerSale {
  id: string;
  invoiceNumber: string;
  total: string;
  status: string;
  createdAt: string;
}

export default function CustomerManageScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const canAdd = hasPermission('customers:add_quick') || hasPermission('customers:manage');
  const canManage = hasPermission('customers:manage');

  // Fetch customer if editing
  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}`);
      return res.data.data;
    },
    enabled: isEditing,
  });

  // Fetch customer's sales history
  const { data: salesData } = useQuery({
    queryKey: ['customer-sales', id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}/sales?limit=10`);
      return res.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (customerData) {
      setName(customerData.name || '');
      setPhone(customerData.phone || '');
      setEmail(customerData.email || '');
      setAddress(customerData.address || '');
      setNotes(customerData.notes || '');
    }
  }, [customerData]);

  const recentSales: CustomerSale[] = salesData || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/customers', data);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      Alert.alert('Succès', 'Client créé avec succès', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de la création');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/customers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      Alert.alert('Succès', 'Client mis à jour', [
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
      const res = await api.delete(`/customers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      router.back();
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de la suppression');
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    const data = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le client',
      'Êtes-vous sûr de vouloir supprimer ce client ?',
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

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!isEditing && !canAdd) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Vous n'avez pas la permission d'ajouter des clients.
        </Text>
      </SafeAreaView>
    );
  }

  if (isEditing && !canManage) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Vous n'avez pas la permission de modifier ce client.
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
          {isEditing ? 'Modifier le client' : 'Nouveau client'}
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
          {/* Form */}
          <View style={styles.section}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nom *</Text>
              <TextInput
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder="Nom complet du client"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Téléphone</Text>
              <TextInput
                style={styles.formInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+229 XX XX XX XX"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={email}
                onChangeText={setEmail}
                placeholder="email@exemple.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Adresse</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Adresse du client"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Notes supplémentaires..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Recent Purchases */}
          {isEditing && recentSales.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Achats récents</Text>
              {recentSales.map((sale) => (
                <View key={sale.id} style={styles.saleRow}>
                  <View style={styles.saleInfo}>
                    <Text style={styles.saleInvoice}>{sale.invoiceNumber}</Text>
                    <Text style={styles.saleDate}>{formatDate(sale.createdAt)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.saleTotal,
                      sale.status !== 'completed' && styles.saleTotalCancelled,
                    ]}
                  >
                    {formatCurrency(Number(sale.total))}
                  </Text>
                </View>
              ))}
            </View>
          )}

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
                    name={isEditing ? 'checkmark-circle' : 'person-add'}
                    size={24}
                    color={colors.textInverse}
                  />
                  <Text style={styles.submitButtonText}>
                    {isEditing ? 'Mettre à jour' : 'Créer le client'}
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
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  formInput: {
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
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saleInfo: {
    flex: 1,
  },
  saleInvoice: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  saleDate: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  saleTotal: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  saleTotalCancelled: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  submitContainer: {
    padding: spacing.lg,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
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

