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
  const [pinCode, setPinCode] = useState('');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [warehouseId, setWarehouseId] = useState<string | null>(null); // Primary warehouse (for backward compatibility)
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<string[]>([]); // Multiple warehouse assignments
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

  // Get selected role to filter warehouses
  const selectedRole = roles.find((r) => r.id === roleId);
  const isSellerRole = selectedRole?.name === 'cashier';

  // Filter warehouses based on role and current user permissions
  const availableWarehouses = warehouses.filter((w) => {
    // If seller role, only show BOUTIQUE warehouses
    if (isSellerRole && w.type !== 'BOUTIQUE' && w.type !== null) {
      return false;
    }

    // Filter by current user permissions
    if (isAdmin) return true; // Admin can assign to any warehouse
    if (isManager) {
      // Manager can only assign to their own warehouses
      const managerWarehouseIds = [
        ...(employee?.warehouses?.map((ew: any) => ew.id) || []),
        employee?.warehouse?.id,
      ].filter(Boolean);
      return managerWarehouseIds.includes(w.id);
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
      // Check hierarchy before allowing edit
      const currentRole = employee?.role?.name;
      const targetRole = employeeData.role?.name;
      
      if (currentRole === 'manager') {
        if (targetRole === 'admin' || targetRole === 'manager') {
          Alert.alert(
            'Accès refusé',
            'Vous ne pouvez pas modifier un Administrateur ou un autre Manager. Vous pouvez uniquement gérer les Vendeurs assignés à votre entrepôt.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(app)/employees-list'),
              },
            ]
          );
          return;
        }
        // Manager can only edit Sellers from their warehouse
        if (employee?.warehouseId && employeeData.warehouseId !== employee.warehouseId) {
          Alert.alert(
            'Accès refusé',
            'Vous ne pouvez modifier que les employés assignés à votre entrepôt.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(app)/employees-list'),
              },
            ]
          );
          return;
        }
      } else if (currentRole === 'cashier') {
        Alert.alert(
          'Accès refusé',
          'Vous n\'avez pas la permission de modifier les employés.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(app)/employees-list'),
            },
          ]
        );
        return;
      }

      setFullName(employeeData.fullName || '');
      setPhone(employeeData.phone || '');
      setRoleId(employeeData.roleId);
      setWarehouseId(employeeData.warehouseId);
      // Set multiple warehouse assignments
      const warehouseIds = employeeData.warehouses?.map((ew: any) => ew.warehouse?.id || ew.id) || [];
      setSelectedWarehouseIds(warehouseIds);
      setIsActive(employeeData.isActive ?? true);
    }
  }, [employeeData, employee, router]);

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
        { text: 'OK', onPress: () => router.replace('/(app)/employees-list') },
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

    if (!roleId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un rôle');
      return;
    }

    const selectedRole = roles.find((r) => r.id === roleId);
    if (selectedRole?.name !== 'admin' && selectedWarehouseIds.length === 0 && !warehouseId) {
      Alert.alert('Erreur', 'Au moins un entrepôt est requis pour ce rôle');
      return;
    }

    setIsSaving(true);
    const data: any = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      roleId,
      warehouseId: selectedRole?.name === 'admin' ? null : warehouseId,
      warehouseIds: selectedWarehouseIds, // Multiple warehouse assignments
      isActive,
    };

    if (pinCode.trim()) {
      data.pinCode = pinCode.trim();
    } else if (!isEditing) {
      // PIN is required for new employees
      Alert.alert('Erreur', 'Le PIN est requis pour les nouveaux employés');
      setIsSaving(false);
      return;
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
          <TouchableOpacity onPress={() => router.replace('/(app)/employees-list')}>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          // Navigate back to employees-list - parent screen
          if (router.canDismiss()) {
            router.dismissAll();
          }
          setTimeout(() => {
            router.push('/(app)/employees-list' as any);
          }, 100);
        }}>
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

        {/* Warehouses (Multiple Selection) */}
        {selectedRole?.name !== 'admin' && (
          <View style={styles.section}>
            <Text style={styles.label}>Entrepôts *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowWarehousePicker(true)}
            >
              {selectedWarehouseIds.length > 0 ? (
                <View style={styles.pickerSelected}>
                  <Ionicons name="storefront-outline" size={20} color={colors.primary} />
                  <Text style={styles.pickerSelectedText}>
                    {selectedWarehouseIds.length} entrepôt{selectedWarehouseIds.length > 1 ? 's' : ''} sélectionné{selectedWarehouseIds.length > 1 ? 's' : ''}
                  </Text>
                </View>
              ) : (
                <Text style={styles.pickerPlaceholder}>Sélectionner des entrepôts</Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            {selectedWarehouseIds.length > 0 && (
              <View style={styles.selectedWarehousesList}>
                {selectedWarehouseIds.map((id) => {
                  const warehouse = availableWarehouses.find((w) => w.id === id);
                  return warehouse ? (
                    <View key={id} style={styles.selectedWarehouseTag}>
                      <Text style={styles.selectedWarehouseTagText}>
                        {warehouse.name} ({warehouse.code})
                      </Text>
                    </View>
                  ) : null;
                })}
              </View>
            )}
            {isSellerRole && (
              <Text style={styles.helperText}>
                Seuls les entrepôts de type BOUTIQUE sont disponibles pour les vendeurs
              </Text>
            )}
            {isManager && (
              <Text style={styles.helperText}>
                Vous ne pouvez assigner qu'à vos entrepôts
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
                  // If role is admin, clear warehouses
                  if (item.name === 'admin') {
                    setWarehouseId(null);
                    setSelectedWarehouseIds([]);
                  } else if (isManager && employee?.warehouseId) {
                    // If Manager, set their warehouse
                    setWarehouseId(employee.warehouseId);
                    setSelectedWarehouseIds([employee.warehouseId]);
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

      {/* Warehouse Picker Modal (Multiple Selection) */}
      <Modal
        visible={showWarehousePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWarehousePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner des entrepôts</Text>
            <TouchableOpacity onPress={() => setShowWarehousePicker(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableWarehouses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedWarehouseIds.includes(item.id);
              return (
                <TouchableOpacity
                  style={styles.warehouseOption}
                  onPress={() => {
                    if (isSelected) {
                      // Deselect
                      setSelectedWarehouseIds(selectedWarehouseIds.filter((id) => id !== item.id));
                      // Also clear primary warehouse if it was this one
                      if (warehouseId === item.id) {
                        setWarehouseId(null);
                      }
                    } else {
                      // Select
                      setSelectedWarehouseIds([...selectedWarehouseIds, item.id]);
                      // Set as primary warehouse if none selected
                      if (!warehouseId) {
                        setWarehouseId(item.id);
                      }
                    }
                    hapticNotification(Haptics.NotificationFeedbackType.Success);
                  }}
                >
                  <View style={styles.checkboxContainer}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                      )}
                    </View>
                  </View>
                  <Ionicons name="storefront-outline" size={24} color={colors.primary} />
                  <View style={styles.warehouseOptionInfo}>
                    <Text style={styles.warehouseOptionName}>{item.name}</Text>
                    <Text style={styles.warehouseOptionCode}>
                      {item.code} - {item.type === 'BOUTIQUE' ? 'Boutique' : item.type === 'STOCKAGE' ? 'Stockage' : 'Autre'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={() => {
                if (selectedWarehouseIds.length === 0 && selectedRole?.name !== 'admin') {
                  Alert.alert('Erreur', 'Veuillez sélectionner au moins un entrepôt');
                  return;
                }
                setShowWarehousePicker(false);
                hapticNotification(Haptics.NotificationFeedbackType.Success);
              }}
            >
              <Text style={styles.modalConfirmButtonText}>Confirmer</Text>
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
  checkboxContainer: {
    marginRight: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedWarehousesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  selectedWarehouseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  selectedWarehouseTagText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  modalFooter: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalConfirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textInverse,
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

