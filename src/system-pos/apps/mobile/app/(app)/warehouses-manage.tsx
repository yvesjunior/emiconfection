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

export default function WarehousesManageScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { warehouseId } = useLocalSearchParams<{ warehouseId?: string }>();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const isEditing = !!warehouseId;
  const canManage = hasPermission('warehouses:manage');

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'BOUTIQUE' | 'STOCKAGE'>('BOUTIQUE');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Check permission
  useEffect(() => {
    if (!canManage) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission de gérer les entrepôts');
      router.back();
    }
  }, [canManage, router]);

  // Fetch warehouse if editing
  const { data: warehouseData, isLoading: isLoadingWarehouse } = useQuery({
    queryKey: ['warehouse', warehouseId],
    queryFn: async () => {
      const res = await api.get(`/warehouses/${warehouseId}`);
      return res.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (warehouseData) {
      setName(warehouseData.name || '');
      setCode(warehouseData.code || '');
      // Ensure type is set correctly - handle both string and enum values
      const warehouseType = warehouseData.type === 'STOCKAGE' ? 'STOCKAGE' : 'BOUTIQUE';
      setType(warehouseType);
      setAddress(warehouseData.address || '');
      setPhone(warehouseData.phone || '');
      setIsActive(warehouseData.isActive ?? true);
      setIsDefault(warehouseData.isDefault ?? false);
    }
  }, [warehouseData]);

  // Generate code from name
  const generateCode = () => {
    if (name.length >= 2) {
      const codeFromName = name
        .substring(0, 6)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .padEnd(3, 'X');
      setCode(codeFromName);
    }
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const res = await api.put(`/warehouses/${warehouseId}`, data);
        return res.data;
      } else {
        const res = await api.post('/warehouses', data);
        return res.data;
      }
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      Alert.alert(
        'Succès',
        isEditing ? 'Entrepôt modifié avec succès' : 'Entrepôt créé avec succès',
        [{ text: 'OK', onPress: () => router.replace('/(app)/warehouses-list') }]
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
      const res = await api.delete(`/warehouses/${warehouseId}`);
      return res.data;
    },
    onSuccess: () => {
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      Alert.alert('Succès', 'Entrepôt supprimé avec succès', [
        { text: 'OK', onPress: () => router.replace('/(app)/warehouses-list') },
      ]);
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      const message = error.response?.data?.message || 'Impossible de supprimer cet entrepôt';
      Alert.alert('Erreur', message);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'entrepôt est requis');
      return;
    }
    if (!code.trim()) {
      Alert.alert('Erreur', 'Le code de l\'entrepôt est requis');
      return;
    }

    const data: any = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: type, // Always include type - this is required for updates
      isActive,
      isDefault,
    };

    // Only include address and phone if they have values
    if (address.trim()) {
      data.address = address.trim();
    }
    if (phone.trim()) {
      data.phone = phone.trim();
    }

    saveMutation.mutate(data);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'entrepôt',
      'Êtes-vous sûr de vouloir supprimer cet entrepôt ? Cette action est irréversible.',
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

  const canDelete = hasPermission('warehouses:manage');

  if (isEditing && isLoadingWarehouse) {
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(app)/warehouses-list')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}
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
              <Text style={styles.label}>Nom de l'entrepôt *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Entrepôt Principal"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Code *</Text>
              <View style={styles.codeContainer}>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={code}
                  onChangeText={(text) => setCode(text.toUpperCase())}
                  placeholder="Ex: ENT-001"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.generateButton} onPress={generateCode}>
                  <Ionicons name="refresh" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Code unique pour identifier l'entrepôt
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type d'entrepôt *</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    type === 'BOUTIQUE' && styles.typeOptionActive,
                  ]}
                  onPress={() => setType('BOUTIQUE')}
                >
                  <Ionicons
                    name="storefront"
                    size={20}
                    color={type === 'BOUTIQUE' ? colors.textInverse : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      type === 'BOUTIQUE' && styles.typeOptionTextActive,
                    ]}
                  >
                    Boutique
                  </Text>
                  {type === 'BOUTIQUE' && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    type === 'STOCKAGE' && styles.typeOptionActive,
                  ]}
                  onPress={() => setType('STOCKAGE')}
                >
                  <Ionicons
                    name="archive"
                    size={20}
                    color={type === 'STOCKAGE' ? colors.textInverse : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      type === 'STOCKAGE' && styles.typeOptionTextActive,
                    ]}
                  >
                    Stockage
                  </Text>
                  {type === 'STOCKAGE' && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                {type === 'BOUTIQUE'
                  ? 'Pour la vente directe aux clients'
                  : 'Pour le stockage et les transferts'}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Adresse complète de l'entrepôt"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Ex: +225 07 12 34 56 78"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
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
                    {isActive ? 'Actif' : 'Inactif'}
                  </Text>
                  <Text style={styles.statusDescription}>
                    {isActive
                      ? 'L\'entrepôt est disponible'
                      : 'L\'entrepôt est masqué'}
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

          {/* Default Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration</Text>

            <TouchableOpacity
              style={styles.statusToggle}
              onPress={() => setIsDefault(!isDefault)}
            >
              <View style={styles.statusToggleContent}>
                <View style={[styles.statusIndicator, isDefault ? styles.statusDefault : styles.statusInactive]} />
                <View>
                  <Text style={styles.statusTitle}>
                    {isDefault ? 'Entrepôt par défaut' : 'Entrepôt standard'}
                  </Text>
                  <Text style={styles.statusDescription}>
                    {isDefault
                      ? 'Cet entrepôt sera utilisé par défaut pour les nouvelles opérations'
                      : 'Entrepôt standard'}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isDefault ? 'star' : 'star-outline'}
                size={32}
                color={isDefault ? colors.warning : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Delete Button */}
          {isEditing && canDelete && (
            <View style={styles.dangerSection}>
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
                    <Text style={styles.deleteButtonText}>Supprimer l'entrepôt</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.deleteWarning}>
                Cette action est irréversible et supprimera toutes les données associées
              </Text>
            </View>
          )}

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
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeInput: {
    flex: 1,
  },
  generateButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeOptionTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
  statusDefault: {
    backgroundColor: colors.warning,
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
  dangerSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.dangerLight + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.dangerLight,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.danger,
  },
  deleteWarning: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

