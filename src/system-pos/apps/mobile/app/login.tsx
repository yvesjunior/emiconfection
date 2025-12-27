import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/store/auth';
import { useAppModeStore, AppMode } from '../src/store/appMode';
import api from '../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../src/lib/theme';

const REMEMBER_MODE_KEY = '@remember_mode';
const SAVED_MODE_KEY = '@saved_mode';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  type?: 'BOUTIQUE' | 'STOCKAGE';
  isActive?: boolean;
}

// Safe haptics wrapper for web compatibility
const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
};

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(type);
  }
};

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth, setSelectedWarehouse } = useAuthStore();
  const { setMode, setCanSwitchMode } = useAppModeStore();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<AppMode>('sell');
  const [rememberMode, setRememberMode] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(true);
  const inputRef = useRef<TextInput>(null);
  
  // Warehouse selection state
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [pendingAuth, setPendingAuth] = useState<any>(null);

  // Load saved mode preference on mount
  useEffect(() => {
    const loadSavedMode = async () => {
      try {
        const remember = await AsyncStorage.getItem(REMEMBER_MODE_KEY);
        if (remember === 'true') {
          setRememberMode(true);
          const savedMode = await AsyncStorage.getItem(SAVED_MODE_KEY);
          if (savedMode === 'sell' || savedMode === 'manage') {
            setSelectedMode(savedMode);
          }
        }
      } catch (error) {
        console.log('Could not load saved mode:', error);
      }
    };
    loadSavedMode();
  }, []);

  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/[^0-9]/g, '');
    if (digitsOnly.length <= 10) {
      setPhone(digitsOnly);
      hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePhoneSubmit = () => {
    if (phone.length >= 4) {
      setShowPhoneInput(false);
      hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide (minimum 4 chiffres)');
    }
  };

  const handlePinChange = async (value: string) => {
    if (value.length <= 6) {
      setPin(value);
      hapticImpact(Haptics.ImpactFeedbackStyle.Light);

      // Auto-submit when PIN is 4-6 digits
      if (value.length >= 4) {
        // Small delay to show the last dot
        setTimeout(() => handleLogin(phone, value), 100);
      }
    }
  };

  const handleLogin = async (phoneValue: string, pinValue: string) => {
    if (phoneValue.length < 4) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide (minimum 4 chiffres)');
      setShowPhoneInput(true);
      return;
    }
    if (pinValue.length < 4) {
      Alert.alert('Erreur', 'Le PIN doit contenir au moins 4 chiffres');
      return;
    }

    setIsLoading(true);
    try {
      // Use standard login endpoint: login = phone number, password = PIN
      // Both are validated together in the backend
      const trimmedPhone = phoneValue.trim();
      const password = String(pinValue || '').trim();
      
      // Validate before sending
      if (!trimmedPhone || trimmedPhone.length < 4) {
        Alert.alert('Erreur', 'Le numéro de téléphone doit contenir au moins 4 chiffres');
        setIsLoading(false);
        return;
      }
      
      if (!password || password.length < 4) {
        Alert.alert('Erreur', 'Le mot de passe (PIN) doit contenir au moins 4 caractères');
        setIsLoading(false);
        return;
      }
      
      const loginData = { 
        phone: trimmedPhone, 
        password: password
      };
      
      console.log('Sending login request:', {
        phone: loginData.phone,
        phoneLength: loginData.phone.length,
        phoneType: typeof loginData.phone,
        passwordLength: loginData.password.length,
        passwordType: typeof loginData.password,
        fullRequest: JSON.stringify(loginData)
      });
      
      const response = await api.post('/auth/login', loginData);
      console.log('Login response received:', {
        success: response.data.success,
        hasEmployee: !!response.data.data?.employee,
        employeeName: response.data.data?.employee?.fullName
      });
      const { employee, accessToken, refreshToken } = response.data.data;
      
      // Basic validation - backend already validates phone + PIN together
      if (!employee || !employee.id || !employee.role) {
        console.error('ERROR: Invalid employee data in response', employee);
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors de l\'authentification. Veuillez réessayer.'
        );
        setPin('');
        setShowPhoneInput(true);
        setIsLoading(false);
        return;
      }
      
      // Log for debugging
      console.log('Login successful:', {
        phone: employee.phone,
        name: employee.fullName,
        role: employee.role.name,
        roleId: employee.role.id
      });
      
      // Check if user is admin (can access all warehouses)
      const isAdmin = employee.role.name === 'admin';
      const isSeller = employee.role.name === 'cashier';
      
      // CRITICAL SECURITY CHECK: Sellers cannot use manage mode
      // Force sell mode immediately if seller selected manage mode
      const effectiveMode = isSeller ? 'sell' : selectedMode;
      
      if (isSeller && selectedMode === 'manage') {
        Alert.alert(
          'Mode non autorisé',
          'Les vendeurs ne peuvent pas accéder au mode Gestion. Le mode Vente sera activé automatiquement.'
        );
        setSelectedMode('sell'); // Force sell mode in UI
      }
      
      // Show warehouse selector based on selected mode
      // In manage mode: show all warehouses (BOUTIQUE and STOCKAGE)
      // In sell mode: show only BOUTIQUE warehouses
      try {
        const warehouseResponse = await api.get('/warehouses?includeInactive=false', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        // Filter warehouses based on effective mode AND employee access
        const allWarehouses = warehouseResponse.data.data.filter((w: Warehouse) => w.isActive);
        
        // Filter by employee access first
        const accessibleWarehouses = allWarehouses.filter((w: Warehouse) => {
          // Admin can access all warehouses
          if (isAdmin) return true;
          
          // Check if employee has access to this warehouse
          const hasAccess = employee.warehouses?.some((ew: any) => ew.id === w.id) ||
                           employee.warehouse?.id === w.id;
          return hasAccess;
        });
        
        // Then filter by effective mode (use effectiveMode, not selectedMode)
        const availableWarehouses = effectiveMode === 'manage' 
          ? accessibleWarehouses // In manage mode, show all accessible warehouses
          : accessibleWarehouses.filter((w: Warehouse) => w.type === 'BOUTIQUE' || !w.type); // In sell mode, only BOUTIQUE
        
        // If employee has assigned warehouse, check if it's compatible with effective mode
        if (employee.warehouseId) {
          const assignedWarehouse = allWarehouses.find((w: Warehouse) => w.id === employee.warehouseId);
          if (assignedWarehouse) {
            // Check if assigned warehouse is compatible with effective mode
            if (effectiveMode === 'sell' && assignedWarehouse.type === 'STOCKAGE') {
              // Employee assigned to STOCKAGE but trying to login in sell mode
              Alert.alert(
                'Connexion impossible',
                'Vous êtes assigné à un entrepôt de type Stockage. Pour effectuer des ventes, veuillez sélectionner le mode "Gestion" ou vous connecter à un entrepôt de type Boutique.'
              );
              setPin('');
              setIsLoading(false);
              return;
            } else if (availableWarehouses.find((w: Warehouse) => w.id === assignedWarehouse.id)) {
              // Assigned warehouse is compatible, use it
              // IMPORTANT: Pass effectiveMode, not selectedMode, and ensure employee object is not modified
              await completeLogin(employee, accessToken, refreshToken, assignedWarehouse, effectiveMode);
              setIsLoading(false);
              return;
            }
          }
        }
        
        if (availableWarehouses.length > 1) {
          // Store pending auth data and show warehouse modal
          setPendingAuth({ employee, accessToken, refreshToken });
          setWarehouses(availableWarehouses);
          setShowWarehouseModal(true);
          setIsLoading(false);
          return;
        } else if (availableWarehouses.length === 1) {
          // Only one compatible warehouse, auto-select it
          await completeLogin(employee, accessToken, refreshToken, availableWarehouses[0]);
          setIsLoading(false);
          return;
        } else {
          // No compatible warehouses available
          const modeText = effectiveMode === 'manage' ? 'disponibles' : 'de type Boutique';
          Alert.alert(
            'Aucun entrepôt disponible',
            `Aucun entrepôt ${modeText} n'est disponible pour la connexion en mode ${effectiveMode === 'manage' ? 'Gestion' : 'Vente'}.`
          );
          setPin('');
          setPhone('');
          setShowPhoneInput(true);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.log('Could not fetch warehouses:', err);
        // Fallback to employee's assigned warehouse if fetch fails
        if (employee.warehouseId) {
          await completeLogin(employee, accessToken, refreshToken, undefined, effectiveMode);
          setIsLoading(false);
          return;
        }
      }

      await completeLogin(employee, accessToken, refreshToken, undefined, effectiveMode);
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        phone: phoneValue,
        pinLength: pinValue.length,
        fullError: JSON.stringify(error.response?.data, null, 2)
      });
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      
      // Show specific validation errors if available
      // Error handler returns 'details' array
      const errorDetails = error.response?.data?.details || error.response?.data?.errors;
      let errorMessage = 'Numéro de téléphone ou PIN invalide. Veuillez réessayer.';
      
      if (errorDetails && Array.isArray(errorDetails)) {
        errorMessage = errorDetails.map((e: any) => {
          const field = e.field || e.path?.join('.') || '';
          return field ? `${field}: ${e.message}` : e.message;
        }).join('\n');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Connexion échouée', errorMessage);
      setPin('');
      setShowPhoneInput(true);
      setIsLoading(false);
    }
  };

  const completeLogin = async (employee: any, accessToken: string, refreshToken: string, warehouse?: Warehouse, effectiveMode?: AppMode) => {
    // Basic validation - backend already validated the employee
    if (!employee || !employee.id || !employee.role) {
      console.error('ERROR: Invalid employee data in completeLogin', employee);
      Alert.alert(
        'Erreur',
        'Données d\'employé invalides. Veuillez vous reconnecter.'
      );
      setIsLoading(false);
      return;
    }
    
    console.log('completeLogin called:', {
      employeeId: employee.id,
      employeeName: employee.fullName,
      employeePhone: employee.phone,
      roleName: employee.role?.name,
      effectiveMode
    });
    
    // CRITICAL: Ensure employee object is never modified - use a deep copy
    const employeeData = JSON.parse(JSON.stringify(employee)); // Deep copy to prevent mutations
    
    // CRITICAL: Validate employee role before proceeding
    const roleName = employeeData.role?.name;
    if (!roleName) {
      console.error('SECURITY ERROR: Missing role name', employeeData);
      Alert.alert(
        'Erreur de sécurité',
        'Rôle d\'employé manquant. Veuillez vous reconnecter.'
      );
      setIsLoading(false);
      return;
    }
    
    const isSeller = roleName === 'cashier';
    const isAdmin = roleName === 'admin';
    const isManager = roleName === 'manager';
    
    // CRITICAL: Log for debugging (remove in production)
    console.log('completeLogin called with:', {
      employeeId: employeeData.id,
      employeePhone: employeeData.phone,
      employeeName: employeeData.fullName,
      roleName: roleName,
      effectiveMode: effectiveMode
    });
    
    // Determine effective mode (sellers can only use sell mode)
    const finalMode = effectiveMode || (isSeller ? 'sell' : selectedMode);
    
    // CRITICAL SECURITY: Force sell mode for sellers regardless of what was selected
    if (isSeller && finalMode === 'manage') {
      console.error('SECURITY WARNING: Seller attempted to use manage mode - forcing sell mode');
      await setMode('sell');
      setCanSwitchMode(false);
    } else {
      // Set the app mode and whether user can switch
      await setMode(finalMode);
      const canSwitch = isAdmin || isManager;
      setCanSwitchMode(canSwitch);
      
      // If user selected manage mode but doesn't have permission, fallback to sell
      if (finalMode === 'manage' && !canSwitch) {
        await setMode('sell');
        Alert.alert('Mode ajusté', 'Seuls les Administrateurs et Managers peuvent accéder au mode Gestion. Mode Vente activé.');
      }
    }
    
    // Store auth with original employee data (never modified)
    await setAuth(employeeData, accessToken, refreshToken);
    
    if (warehouse) {
      setSelectedWarehouse(warehouse);
    }
    
    hapticNotification(Haptics.NotificationFeedbackType.Success);
    setIsLoading(false);
    router.replace('/(app)');
  };

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    setSelectedWarehouseId(warehouse.id);
  };

  const handleWarehouseConfirm = async () => {
    if (!selectedWarehouseId || !pendingAuth) return;
    
    const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);
    if (!selectedWarehouse) return;
    
    // Validate warehouse access before completing login
    const employee = pendingAuth.employee;
    const isAdmin = employee.role.name === 'admin';
    const isSeller = employee.role.name === 'cashier';
    
    // CRITICAL: Determine effective mode (sellers can only use sell mode)
    const effectiveMode = isSeller ? 'sell' : selectedMode;
    
    if (!isAdmin) {
      // Check if employee has access to selected warehouse
      const hasAccess = employee.warehouses?.some((ew: any) => ew.id === selectedWarehouse.id) ||
                       employee.warehouse?.id === selectedWarehouse.id;
      
      if (!hasAccess) {
        Alert.alert(
          'Accès refusé',
          'Vous n\'avez pas accès à cet entrepôt. Veuillez sélectionner un entrepôt auquel vous êtes assigné.'
        );
        return;
      }
    }
    
    setShowWarehouseModal(false);
    setIsLoading(true);
    
    // CRITICAL: Pass effectiveMode to ensure sellers can't use manage mode
    await completeLogin(
      pendingAuth.employee,
      pendingAuth.accessToken,
      pendingAuth.refreshToken,
      selectedWarehouse,
      effectiveMode
    );
  };

  const handleNumberPress = (num: string) => {
    if (showPhoneInput) {
      handlePhoneChange(phone + num);
    } else if (pin.length < 6) {
      handlePinChange(pin + num);
    }
  };

  const handleBackspace = () => {
    if (!showPhoneInput && pin.length > 0) {
      setPin(pin.slice(0, -1));
      hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    } else if (showPhoneInput && phone.length > 0) {
      setPhone(phone.slice(0, -1));
      hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderDots = () => {
    return (
      <View testID="pin-dots-container" style={styles.dotsContainer}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            testID={`pin-dot-${index}`}
            style={[
              styles.dot,
              index < pin.length && styles.dotFilled,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const rows = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'back'],
    ];

    return (
      <View testID="keypad-container" style={styles.keypad}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => (
              <TouchableOpacity
                key={keyIndex}
                testID={key === 'back' ? 'keypad-backspace' : key ? `keypad-${key}` : 'keypad-empty'}
                style={[
                  styles.keypadButton,
                  key === '' && styles.keypadButtonEmpty,
                ]}
                onPress={() => {
                  if (key === 'back') {
                    handleBackspace();
                  } else if (key !== '') {
                    handleNumberPress(key);
                  }
                }}
                disabled={key === '' || isLoading}
                activeOpacity={0.7}
              >
                {key === 'back' ? (
                  <Ionicons name="backspace-outline" size={28} color={colors.text} />
                ) : (
                  <Text style={styles.keypadButtonText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const handleModeToggle = async () => {
    const newMode = selectedMode === 'sell' ? 'manage' : 'sell';
    setSelectedMode(newMode);
    
    // Save mode if remember is enabled
    if (rememberMode) {
      try {
        await AsyncStorage.setItem(SAVED_MODE_KEY, newMode);
      } catch (error) {
        console.log('Could not save mode:', error);
      }
    }
    hapticImpact(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleRememberModeToggle = async (value: boolean) => {
    setRememberMode(value);
    try {
      await AsyncStorage.setItem(REMEMBER_MODE_KEY, value ? 'true' : 'false');
      if (value) {
        await AsyncStorage.setItem(SAVED_MODE_KEY, selectedMode);
      } else {
        await AsyncStorage.removeItem(SAVED_MODE_KEY);
      }
    } catch (error) {
      console.log('Could not save remember preference:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      testID="login-screen"
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="storefront" size={40} color={colors.textInverse} />
          </View>
          <Text style={styles.title}>POS Terminal</Text>
          <Text style={styles.subtitle}>
            {showPhoneInput ? 'Entrez votre numéro de téléphone' : 'Entrez votre PIN'}
          </Text>
        </View>

        {/* Phone Input */}
        {showPhoneInput && (
          <View style={styles.phoneInputContainer}>
            <View style={styles.phoneInputWrapper}>
              <Ionicons name="call-outline" size={24} color={colors.textMuted} style={styles.phoneIcon} />
              <TextInput
                testID="phone-input"
                ref={inputRef}
                style={styles.phoneInput}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="Numéro de téléphone"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                autoFocus
                maxLength={10}
              />
              {phone.length >= 4 && (
                <TouchableOpacity
                  testID="phone-submit-button"
                  style={styles.phoneSubmitButton}
                  onPress={handlePhoneSubmit}
                >
                  <Ionicons name="arrow-forward" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.phoneHelpText}>
              Exemple: 0611, 0622, 0633
            </Text>
          </View>
        )}

        {/* Mode Selector - Only show if phone is entered (we'll check role after login) */}
        {!showPhoneInput && (
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                selectedMode === 'sell' && styles.modeButtonActive,
              ]}
              onPress={() => setSelectedMode('sell')}
            >
              <Ionicons
                name="cart-outline"
                size={20}
                color={selectedMode === 'sell' ? colors.textInverse : colors.textSecondary}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  selectedMode === 'sell' && styles.modeButtonTextActive,
                ]}
              >
                Vente
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                selectedMode === 'manage' && styles.modeButtonActiveManage,
              ]}
              onPress={() => setSelectedMode('manage')}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={selectedMode === 'manage' ? colors.textInverse : colors.textSecondary}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  selectedMode === 'manage' && styles.modeButtonTextActive,
                ]}
              >
                Gestion
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Remember Mode Toggle */}
        <View style={styles.rememberContainer}>
          <Text style={styles.rememberText}>Mémoriser le mode</Text>
          <Switch
            value={rememberMode}
            onValueChange={handleRememberModeToggle}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={rememberMode ? colors.primary : colors.textMuted}
          />
        </View>

        {/* PIN Dots */}
        {!showPhoneInput && renderDots()}

        {/* Loading indicator */}
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        )}

        {/* Keypad */}
        {!showPhoneInput && renderKeypad()}

        {/* Help text */}
        <Text style={styles.helpText}>
          Contactez votre administrateur si vous avez oublié votre PIN
        </Text>
      </View>

      {/* Warehouse Selection Modal */}
      <Modal
        visible={showWarehouseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sélectionner un entrepôt</Text>
            <Text style={styles.modalSubtitle}>
              {selectedMode === 'manage' 
                ? 'Mode Gestion : Sélectionnez un entrepôt auquel vous avez accès'
                : 'Mode Vente : Sélectionnez un entrepôt Boutique auquel vous avez accès'}
            </Text>
          </View>

          <FlatList
            data={warehouses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.warehouseList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.warehouseItem,
                  selectedWarehouseId === item.id && styles.warehouseItemSelected,
                ]}
                onPress={() => handleWarehouseSelect(item)}
              >
                <View style={[
                  styles.warehouseIcon,
                  selectedWarehouseId === item.id && styles.warehouseIconSelected,
                ]}>
                  <Ionicons
                    name={(item.type === 'BOUTIQUE' || !item.type) ? 'storefront' : 'archive'}
                    size={24}
                    color={selectedWarehouseId === item.id ? colors.textInverse : ((item.type === 'BOUTIQUE' || !item.type) ? colors.primary : colors.success)}
                  />
                </View>
                <View style={styles.warehouseInfo}>
                  <View style={styles.warehouseTitleRow}>
                    <Text style={[
                      styles.warehouseName,
                      selectedWarehouseId === item.id && styles.warehouseNameSelected,
                    ]}>
                      {item.name}
                    </Text>
                    {(item.type === 'BOUTIQUE' || item.type === 'STOCKAGE') && (
                      <View style={[
                        styles.warehouseTypeBadge,
                        item.type === 'BOUTIQUE' ? styles.warehouseTypeBadgeBoutique : styles.warehouseTypeBadgeStockage
                      ]}>
                        <Text style={[
                          styles.warehouseTypeBadgeText,
                          item.type === 'BOUTIQUE' ? styles.warehouseTypeBadgeTextBoutique : styles.warehouseTypeBadgeTextStockage
                        ]}>
                          {item.type === 'BOUTIQUE' ? 'Boutique' : 'Stockage'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.warehouseCode}>Code: {item.code}</Text>
                  {item.address && (
                    <Text style={styles.warehouseAddress} numberOfLines={1}>
                      {item.address}
                    </Text>
                  )}
                </View>
                {selectedWarehouseId === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedWarehouseId && styles.confirmButtonDisabled,
              ]}
              onPress={handleWarehouseConfirm}
              disabled={!selectedWarehouseId}
            >
              <Text style={styles.confirmButtonText}>Continuer</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeButtonActiveManage: {
    backgroundColor: colors.success,
  },
  modeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeButtonTextActive: {
    color: colors.textInverse,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  rememberText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  loader: {
    marginBottom: spacing.md,
  },
  keypad: {
    width: '100%',
    maxWidth: 300,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  keypadButton: {
    width: 75,
    height: 75,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    ...shadows.sm,
  },
  keypadButtonEmpty: {
    backgroundColor: 'transparent',
    ...{ shadowOpacity: 0, elevation: 0 },
  },
  keypadButtonText: {
    fontSize: 28,
    fontWeight: '500',
    color: colors.text,
  },
  helpText: {
    marginTop: spacing.xxl,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    padding: spacing.xl,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  warehouseList: {
    padding: spacing.lg,
  },
  warehouseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  warehouseItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  warehouseIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  warehouseIconSelected: {
    backgroundColor: colors.primary,
  },
  warehouseInfo: {
    flex: 1,
  },
  warehouseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  warehouseName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  warehouseNameSelected: {
    color: colors.primary,
  },
  warehouseTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  warehouseTypeBadgeBoutique: {
    backgroundColor: colors.primaryLight + '20',
  },
  warehouseTypeBadgeStockage: {
    backgroundColor: colors.successLight + '20',
  },
  warehouseTypeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  warehouseTypeBadgeTextBoutique: {
    color: colors.primary,
  },
  warehouseTypeBadgeTextStockage: {
    color: colors.success,
  },
  warehouseCode: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  warehouseAddress: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalFooter: {
    padding: spacing.lg,
    paddingBottom: 40,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  confirmButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textInverse,
  },
  phoneInputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: spacing.xl,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  phoneIcon: {
    marginRight: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  phoneSubmitButton: {
    padding: spacing.xs,
  },
  phoneHelpText: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

