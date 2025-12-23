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
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<AppMode>('sell');
  const [rememberMode, setRememberMode] = useState(false);
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

  const handlePinChange = async (value: string) => {
    if (value.length <= 6) {
      setPin(value);
      hapticImpact(Haptics.ImpactFeedbackStyle.Light);

      // Auto-submit when PIN is 4-6 digits
      if (value.length >= 4) {
        // Small delay to show the last dot
        setTimeout(() => handleLogin(value), 100);
      }
    }
  };

  const handleLogin = async (pinValue: string) => {
    if (pinValue.length < 4) {
      Alert.alert('Erreur', 'Le PIN doit contenir au moins 4 chiffres');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/pin-login', { pin: pinValue });
      const { employee, accessToken, refreshToken } = response.data.data;
      
      // Check if user is admin (can access all warehouses)
      const isAdmin = employee.role.name === 'admin';
      
      if (isAdmin && !employee.warehouseId) {
        // Admin without assigned warehouse - show warehouse selector
        try {
          const warehouseResponse = await api.get('/warehouses', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const availableWarehouses = warehouseResponse.data.data.filter((w: Warehouse) => w);
          
          if (availableWarehouses.length > 1) {
            // Store pending auth data and show warehouse modal
            setPendingAuth({ employee, accessToken, refreshToken });
            setWarehouses(availableWarehouses);
            setShowWarehouseModal(true);
            setIsLoading(false);
            return;
          } else if (availableWarehouses.length === 1) {
            // Only one warehouse, auto-select it
            setSelectedWarehouse(availableWarehouses[0]);
          }
        } catch (err) {
          console.log('Could not fetch warehouses:', err);
        }
      }

      await completeLogin(employee, accessToken, refreshToken);
    } catch (error: any) {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Connexion échouée',
        error.response?.data?.message || 'PIN invalide. Veuillez réessayer.'
      );
      setPin('');
      setIsLoading(false);
    }
  };

  const completeLogin = async (employee: any, accessToken: string, refreshToken: string, warehouse?: Warehouse) => {
    await setAuth(employee, accessToken, refreshToken);
    
    if (warehouse) {
      setSelectedWarehouse(warehouse);
    }
    
    // Check if user has management permissions
    const canManage = employee.role.name === 'admin' || 
      employee.permissions.includes('products:create') ||
      employee.permissions.includes('products:update') ||
      employee.permissions.includes('categories:manage');
    
    // Set the app mode and whether user can switch
    await setMode(selectedMode);
    setCanSwitchMode(canManage);
    
    // If user selected manage mode but doesn't have permission, fallback to sell
    if (selectedMode === 'manage' && !canManage) {
      await setMode('sell');
      Alert.alert('Mode ajusté', 'Vous n\'avez pas les permissions pour le mode Gestion. Mode Vente activé.');
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
    
    setShowWarehouseModal(false);
    setIsLoading(true);
    
    await completeLogin(
      pendingAuth.employee,
      pendingAuth.accessToken,
      pendingAuth.refreshToken,
      selectedWarehouse
    );
  };

  const handleNumberPress = (num: string) => {
    if (pin.length < 6) {
      handlePinChange(pin + num);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
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
      <View style={styles.keypad}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => (
              <TouchableOpacity
                key={keyIndex}
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
          <Text style={styles.subtitle}>Entrez votre PIN pour continuer</Text>
        </View>

        {/* Mode Selector */}
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
        {renderDots()}

        {/* Loading indicator */}
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        )}

        {/* Keypad */}
        {renderKeypad()}

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
              Choisissez l'entrepôt dans lequel vous travaillez
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
                    name="business"
                    size={24}
                    color={selectedWarehouseId === item.id ? colors.textInverse : colors.primary}
                  />
                </View>
                <View style={styles.warehouseInfo}>
                  <Text style={[
                    styles.warehouseName,
                    selectedWarehouseId === item.id && styles.warehouseNameSelected,
                  ]}>
                    {item.name}
                  </Text>
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
  warehouseName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  warehouseNameSelected: {
    color: colors.primary,
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
});

