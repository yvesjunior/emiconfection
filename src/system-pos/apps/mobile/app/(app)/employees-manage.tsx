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
  Modal,
  FlatList,
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

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  type: 'BOUTIQUE' | 'STOCKAGE';
}

export default function EmployeesManageScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { employeeId } = useLocalSearchParams<{ employeeId?: string }>();
  const employee = useAuthStore((state) => state.employee);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const isEditing = !!employeeId;
  const canManage = hasPermission('employees:manage');
  const isAdmin = employee?.role?.name === 'admin';
  const isManager = employee?.role?.name === 'manager';

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch roles
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data.data as Role[];
    },
  });

  const roles = rolesData || [];

  // Filter roles based on hierarchy
  const availableRoles = roles.filter((role) => {
    if (isAdmin) return true; // Admin can assign any role
    if (isManager) {
      // Manager can only assign Seller role
      return role.name === 'cashier';
    }
    return false; // Others cannot create employees
  });

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses', 'employees'],
    queryFn: async () => {
      const res = await api.get('/warehouses?includeInactive=false');
      return res.data.data as Warehouse[];
    },
  });

  const warehouses = warehousesData || [];

  // Filter warehouses based on role
  const availableWarehouses = warehouses.filter((w) => {
    if (isAdmin) return true; // Admin can assign to any warehouse
    if (isManager) {
      // Manager can only assign to their own warehouse
      return employee?.warehouseId === w.id;
    }
    return false;
  });

  // Set default warehouse for Manager
  useEffect(() => {
    if (!warehouseId && isManager && employee?.warehouseId && !isEditing) {
      setWarehouseId(employee.warehouseId);
    }
  }, [isManager, employee?.warehouseId, warehouseId, isEditing]);

  // Fetch employee if editing
  const { data: employeeData, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const res = await api.get(`/employees/${employeeId}`);
      return res.data.data;
    },
    enabled: isEditing && !!employeeId,
  });

  useEffect(() => {
    if (employeeData) {
      setFullName(employeeData.fullName || '');
      setPhone(employeeData.phone || '');
      setEmail(employeeData.email || '');
      setRoleId(employeeData.roleId);
      setWarehouseId(employeeData.warehouseId);
      setIsActive(employeeData.isActive ?? true);
    }
  }, [employeeData]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const res = await api.put(`/employees/${employeeId}`, data);
        return res.data.data;
      } else {
        const res = await api.post('/employees', data);
        return res.data.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', `Employé ${isEditing ? 'modifié' : 'créé'} avec succès`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Une erreur est survenue');
    },
  });

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert('Erreur', 'Le nom complet est requis');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Erreur', 'Le numéro de téléphone est requis');
      return;
    }

    if (!isEditing && !password.trim()) {
      Alert.alert('Erreur', 'Le mot de passe est requis');
      return;
    }

    if (!roleId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un rôle');
      return;
    }

    const selectedRole = roles.find((r) => r.id === roleId);
    if (selectedRole?.name !== 'admin' && !warehouseId) {
      Alert.alert('Erreur', 'Un entrepôt est requis pour ce rôle');
      return;
    }

    setIsSaving(true);
    const data: any = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      roleId,
      warehouseId: selectedRole?.name === 'admin' ? null : warehouseId,
      isActive,
    };

    if (!isEditing) {
      data.password = password;
    }

    if (pinCode.trim()) {
      data.pinCode = pinCode.trim();
    }

    saveMutation.mutate(data, {
      onSettled: () => {
        setIsSaving(false);
      },
    });
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

  if (!canManage) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Modifier l\'employé' : 'Nouvel employé'}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
          <Text style={styles.accessDeniedTitle}>Accès refusé</Text>
          <Text style={styles.accessDeniedText}>
            Vous n'avez pas la permission de gérer les employés
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedRole = roles.find((r) => r.id === roleId);
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier l\'employé' : 'Nouvel employé'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Full Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Nom complet *</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nom complet"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Phone */}
        <View style={styles.section}>
          <Text style={styles.label}>Téléphone *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Numéro de téléphone"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        {/* Email */}
        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password (only for new employees) */}
        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.label}>Mot de passe *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mot de passe"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>
        )}

        {/* PIN Code */}
        <View style={styles.section}>
          <Text style={styles.label}>Code PIN</Text>
          <TextInput
            style={styles.input}
            value={pinCode}
            onChangeText={setPinCode}
            placeholder="Code PIN (4 chiffres)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            maxLength={4}
          />
          <Text style={styles.helperText}>
            Code PIN pour la connexion mobile (optionnel)
          </Text>
        </View>

        {/* Role */}
        <View style={styles.section}>
          <Text style={styles.label}>Rôle *</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowRolePicker(true)}
            disabled={availableRoles.length === 1 && !isEditing}
          >
            {selectedRole ? (
              <View style={styles.pickerSelected}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
                <Text style={styles.pickerSelectedText}>
                  {selectedRole.name === 'admin'
                    ? 'Admin'
                    : selectedRole.name === 'manager'
                    ? 'Manager'
                    : selectedRole.name === 'cashier'
                    ? 'Vendeur'
                    : selectedRole.name}
                </Text>
              </View>
            ) : (
              <Text style={styles.pickerPlaceholder}>Sélectionner un rôle</Text>
            )}
            {availableRoles.length > 1 && (
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>
          {isManager && (
            <Text style={styles.helperText}>
              Vous ne pouvez créer que des Vendeurs pour votre entrepôt
            </Text>
          )}
        </View>

        {/* Warehouse */}
        {selectedRole?.name !== 'admin' && (
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
            {isManager && (
              <Text style={styles.helperText}>
                Vous ne pouvez assigner qu'à votre entrepôt
              </Text>
            )}
          </View>
        )}

        {/* Active Status */}
        {isEditing && (
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.label}>Actif</Text>
                <Text style={styles.helperText}>
                  Un employé inactif ne peut pas se connecter
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.switch, isActive && styles.switchActive]}
                onPress={() => setIsActive(!isActive)}
              >
                <View style={[styles.switchThumb, isActive && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>
          </View>
        )}

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

      {/* Role Picker Modal */}
      <Modal
        visible={showRolePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRolePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner un rôle</Text>
            <TouchableOpacity onPress={() => setShowRolePicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableRoles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.roleOption}
                onPress={() => {
                  setRoleId(item.id);
                  // If role is admin, clear warehouse
                  if (item.name === 'admin') {
                    setWarehouseId(null);
                  } else if (isManager && employee?.warehouseId) {
                    // If Manager, set their warehouse
                    setWarehouseId(employee.warehouseId);
                  }
                  setShowRolePicker(false);
                }}
              >
                <Ionicons name="person-outline" size={24} color={colors.primary} />
                <View style={styles.roleOptionInfo}>
                  <Text style={styles.roleOptionName}>
                    {item.name === 'admin'
                      ? 'Admin'
                      : item.name === 'manager'
                      ? 'Manager'
                      : item.name === 'cashier'
                      ? 'Vendeur'
                      : item.name}
                  </Text>
                  {item.description && (
                    <Text style={styles.roleOptionDescription}>{item.description}</Text>
                  )}
                </View>
                {roleId === item.id && (
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
                  <Text style={styles.warehouseOptionCode}>
                    {item.code} - {item.type === 'BOUTIQUE' ? 'Boutique' : 'Stockage'}
                  </Text>
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
  helperText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.textMuted + '40',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: colors.success,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.textInverse,
    transform: [{ translateX: 0 }],
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
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
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  roleOptionInfo: {
    flex: 1,
  },
  roleOptionName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  roleOptionDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs / 2,
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

