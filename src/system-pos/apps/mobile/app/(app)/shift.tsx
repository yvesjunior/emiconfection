import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useShiftStore } from '../../src/store/shift';
import { useAuthStore } from '../../src/store/auth';
import api from '../../src/lib/api';
import { formatCurrency, formatDate, formatTime } from '../../src/lib/utils';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

export default function ShiftScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  const { currentShift, setShift, clearShift } = useShiftStore();
  const employee = useAuthStore((state) => state.employee);

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data.data;
    },
    enabled: !currentShift,
  });

  const warehouses: Warehouse[] = warehousesData || [];

  const handleStartShift = async () => {
    if (!selectedWarehouse) {
      Alert.alert('Error', 'Please select a warehouse');
      return;
    }

    const cash = parseFloat(openingCash) || 0;
    if (cash < 0) {
      Alert.alert('Error', 'Opening cash cannot be negative');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/shifts/start', {
        warehouseId: selectedWarehouse,
        openingCash: cash,
      });

      const shift = response.data.data;
      setShift({
        id: shift.id,
        warehouseId: shift.warehouseId,
        warehouseName: shift.warehouse.name,
        startTime: shift.startTime,
        openingCash: Number(shift.openingCash),
        status: 'open',
      });

      hapticNotification(Haptics.NotificationFeedbackType.Success);
      setOpeningCash('');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to start shift'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndShift = async () => {
    const cash = parseFloat(closingCash) || 0;
    if (cash < 0) {
      Alert.alert('Error', 'Closing cash cannot be negative');
      return;
    }

    Alert.alert('End Shift', 'Are you sure you want to end your shift?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Shift',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            const response = await api.post('/shifts/end', {
              closingCash: cash,
            });

            const result = response.data.data;
            hapticNotification(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
              'Shift Ended',
              `Sales: ${result.stats?.salesCount || 0}\nTotal: ${formatCurrency(result.stats?.totalSales || 0)}\nCash Difference: ${formatCurrency(Number(result.cashDifference) || 0)}`
            );

            clearShift();
            setClosingCash('');
          } catch (error: any) {
            Alert.alert(
              'Error',
              error.response?.data?.message || 'Failed to end shift'
            );
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  if (currentShift) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Active Shift</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Shift Info Card */}
          <View style={styles.shiftCard}>
            <View style={styles.shiftStatusBadge}>
              <View style={styles.shiftStatusDot} />
              <Text style={styles.shiftStatusText}>Active</Text>
            </View>

            <View style={styles.shiftInfoRow}>
              <Ionicons name="storefront-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.shiftInfoLabel}>Warehouse</Text>
              <Text style={styles.shiftInfoValue}>{currentShift.warehouseName}</Text>
            </View>

            <View style={styles.shiftInfoRow}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.shiftInfoLabel}>Employee</Text>
              <Text style={styles.shiftInfoValue}>{employee?.fullName}</Text>
            </View>

            <View style={styles.shiftInfoRow}>
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.shiftInfoLabel}>Started</Text>
              <Text style={styles.shiftInfoValue}>
                {formatTime(currentShift.startTime)}
              </Text>
            </View>

            <View style={styles.shiftInfoRow}>
              <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.shiftInfoLabel}>Opening Cash</Text>
              <Text style={styles.shiftInfoValue}>
                {formatCurrency(currentShift.openingCash)}
              </Text>
            </View>
          </View>

          {/* End Shift Section */}
          <View style={styles.endShiftSection}>
            <Text style={styles.sectionTitle}>End Shift</Text>
            <Text style={styles.inputLabel}>Closing Cash Count</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={closingCash}
              onChangeText={setClosingCash}
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.endButton, isLoading && styles.buttonDisabled]}
              onPress={handleEndShift}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="stop-circle" size={24} color={colors.textInverse} />
                  <Text style={styles.endButtonText}>End Shift</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Start Shift</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.startShiftCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="time" size={48} color={colors.primary} />
          </View>
          <Text style={styles.startTitle}>No Active Shift</Text>
          <Text style={styles.startSubtitle}>
            Start a shift to begin processing sales
          </Text>
        </View>

        {/* Warehouse Selection */}
        <Text style={styles.sectionTitle}>Select Warehouse</Text>
        <View style={styles.warehouseList}>
          {warehouses.map((warehouse) => (
            <TouchableOpacity
              key={warehouse.id}
              style={[
                styles.warehouseItem,
                selectedWarehouse === warehouse.id && styles.warehouseItemActive,
              ]}
              onPress={() => setSelectedWarehouse(warehouse.id)}
            >
              <View style={styles.warehouseIcon}>
                <Ionicons
                  name="storefront"
                  size={24}
                  color={selectedWarehouse === warehouse.id ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={styles.warehouseInfo}>
                <Text
                  style={[
                    styles.warehouseName,
                    selectedWarehouse === warehouse.id && styles.warehouseNameActive,
                  ]}
                >
                  {warehouse.name}
                </Text>
                <Text style={styles.warehouseCode}>{warehouse.code}</Text>
              </View>
              {selectedWarehouse === warehouse.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Opening Cash */}
        <Text style={styles.sectionTitle}>Opening Cash</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={openingCash}
          onChangeText={setOpeningCash}
          placeholderTextColor={colors.textMuted}
        />

        {/* Start Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            (!selectedWarehouse || isLoading) && styles.buttonDisabled,
          ]}
          onPress={handleStartShift}
          disabled={!selectedWarehouse || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <Ionicons name="play-circle" size={24} color={colors.textInverse} />
              <Text style={styles.startButtonText}>Start Shift</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  shiftCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  shiftStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  shiftStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  shiftStatusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.success,
  },
  shiftInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shiftInfoLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  shiftInfoValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  endShiftSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  startShiftCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  startTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  startSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  warehouseList: {
    gap: spacing.sm,
  },
  warehouseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  warehouseItemActive: {
    borderColor: colors.primary,
  },
  warehouseIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warehouseInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  warehouseName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  warehouseNameActive: {
    color: colors.primary,
  },
  warehouseCode: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
    ...shadows.md,
  },
  startButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textInverse,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    ...shadows.md,
  },
  endButtonText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

