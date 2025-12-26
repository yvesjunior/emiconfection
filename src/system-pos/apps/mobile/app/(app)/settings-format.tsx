import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSize, borderRadius } from '../../src/lib/theme';

const FORMAT_SETTINGS_KEY = '@format_settings';

interface FormatSettings {
  currency: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.' | ' ' | '';
  decimalPlaces: 0 | 2;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '24h' | '12h';
}

const defaultSettings: FormatSettings = {
  currency: 'XOF',
  currencySymbol: 'FCFA',
  currencyPosition: 'after',
  decimalSeparator: ',',
  thousandsSeparator: ' ',
  decimalPlaces: 0,
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
};

const currencies = [
  { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA (BCEAO)' },
  { code: 'XAF', symbol: 'FCFA', name: 'Franc CFA (BEAC)' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'Dollar US' },
  { code: 'GNF', symbol: 'GNF', name: 'Franc Guinéen' },
  { code: 'NGN', symbol: '₦', name: 'Naira Nigérian' },
  { code: 'GHS', symbol: 'GH₵', name: 'Cedi Ghanéen' },
];

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

export default function FormatSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<FormatSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(FORMAT_SETTINGS_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading format settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(FORMAT_SETTINGS_KEY, JSON.stringify(settings));
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Paramètres de format enregistrés');
    } catch (error) {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer les paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const formatExample = (value: number) => {
    const parts = value.toFixed(settings.decimalPlaces).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousandsSeparator);
    const decimalPart = parts[1] || '';
    
    const formattedNumber = settings.decimalPlaces > 0 
      ? `${integerPart}${settings.decimalSeparator}${decimalPart}`
      : integerPart;
    
    return settings.currencyPosition === 'before'
      ? `${settings.currencySymbol} ${formattedNumber}`
      : `${formattedNumber} ${settings.currencySymbol}`;
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    switch (settings.dateFormat) {
      case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (settings.timeFormat === '24h') {
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } else {
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes} ${period}`;
    }
  };

  const selectCurrency = (currency: typeof currencies[0]) => {
    setSettings({
      ...settings,
      currency: currency.code,
      currencySymbol: currency.symbol,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          // Navigate back to the more tab (Paramètres)
          // First dismiss any modals, then navigate to the tab
          if (router.canDismiss()) {
            router.dismissAll();
          }
          // Use setTimeout to ensure dismiss completes before navigation
          setTimeout(() => {
            router.push('/(app)/more' as any);
          }, 100);
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Format & Devise</Text>
        <TouchableOpacity onPress={saveSettings} disabled={isSaving}>
          <Text style={[styles.saveText, isSaving && styles.saveTextDisabled]}>
            {isSaving ? '...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Aperçu</Text>
          <Text style={styles.previewAmount}>{formatExample(12500)}</Text>
          <Text style={styles.previewDate}>
            {formatDate(new Date())} à {formatTime(new Date())}
          </Text>
        </View>

        {/* Currency Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Devise</Text>
          <View style={styles.currencyGrid}>
            {currencies.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyCard,
                  settings.currency === currency.code && styles.currencyCardActive
                ]}
                onPress={() => selectCurrency(currency)}
              >
                <Text style={[
                  styles.currencySymbol,
                  settings.currency === currency.code && styles.currencySymbolActive
                ]}>
                  {currency.symbol}
                </Text>
                <Text style={[
                  styles.currencyName,
                  settings.currency === currency.code && styles.currencyNameActive
                ]}>
                  {currency.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Currency Position */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position du symbole</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.currencyPosition === 'before' && styles.optionButtonActive
              ]}
              onPress={() => setSettings({ ...settings, currencyPosition: 'before' })}
            >
              <Text style={[
                styles.optionButtonText,
                settings.currencyPosition === 'before' && styles.optionButtonTextActive
              ]}>
                Avant ({settings.currencySymbol} 1000)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.currencyPosition === 'after' && styles.optionButtonActive
              ]}
              onPress={() => setSettings({ ...settings, currencyPosition: 'after' })}
            >
              <Text style={[
                styles.optionButtonText,
                settings.currencyPosition === 'after' && styles.optionButtonTextActive
              ]}>
                Après (1000 {settings.currencySymbol})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Number Format */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔢 Format des nombres</Text>
          
          <Text style={styles.subLabel}>Séparateur décimal</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.decimalSeparator === ',' && styles.optionButtonActive
              ]}
              onPress={() => setSettings({ ...settings, decimalSeparator: ',' })}
            >
              <Text style={[
                styles.optionButtonText,
                settings.decimalSeparator === ',' && styles.optionButtonTextActive
              ]}>
                Virgule (1,50)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.decimalSeparator === '.' && styles.optionButtonActive
              ]}
              onPress={() => setSettings({ ...settings, decimalSeparator: '.' })}
            >
              <Text style={[
                styles.optionButtonText,
                settings.decimalSeparator === '.' && styles.optionButtonTextActive
              ]}>
                Point (1.50)
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subLabel, { marginTop: spacing.md }]}>Séparateur des milliers</Text>
          <View style={styles.optionRow}>
            {[
              { value: ' ', label: 'Espace (1 000)' },
              { value: ',', label: 'Virgule (1,000)' },
              { value: '.', label: 'Point (1.000)' },
              { value: '', label: 'Aucun (1000)' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButtonSmall,
                  settings.thousandsSeparator === option.value && styles.optionButtonActive
                ]}
                onPress={() => setSettings({ ...settings, thousandsSeparator: option.value as any })}
              >
                <Text style={[
                  styles.optionButtonTextSmall,
                  settings.thousandsSeparator === option.value && styles.optionButtonTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.subLabel, { marginTop: spacing.md }]}>Décimales</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.decimalPlaces === 0 && styles.optionButtonActive
              ]}
              onPress={() => setSettings({ ...settings, decimalPlaces: 0 })}
            >
              <Text style={[
                styles.optionButtonText,
                settings.decimalPlaces === 0 && styles.optionButtonTextActive
              ]}>
                Aucune (1000)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.decimalPlaces === 2 && styles.optionButtonActive
              ]}
              onPress={() => setSettings({ ...settings, decimalPlaces: 2 })}
            >
              <Text style={[
                styles.optionButtonText,
                settings.decimalPlaces === 2 && styles.optionButtonTextActive
              ]}>
                2 décimales (1000,00)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Date & Heure</Text>
          
          <Text style={styles.subLabel}>Format de date</Text>
          <View style={styles.optionRow}>
            {[
              { value: 'DD/MM/YYYY', label: 'JJ/MM/AAAA' },
              { value: 'MM/DD/YYYY', label: 'MM/JJ/AAAA' },
              { value: 'YYYY-MM-DD', label: 'AAAA-MM-JJ' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButtonSmall,
                  settings.dateFormat === option.value && styles.optionButtonActive
                ]}
                onPress={() => setSettings({ ...settings, dateFormat: option.value as any })}
              >
                <Text style={[
                  styles.optionButtonTextSmall,
                  settings.dateFormat === option.value && styles.optionButtonTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.subLabel, { marginTop: spacing.md }]}>Format d'heure</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.timeFormat === '24h' && styles.optionButtonActive
              ]}
              onPress={() => setSettings({ ...settings, timeFormat: '24h' })}
            >
              <Text style={[
                styles.optionButtonText,
                settings.timeFormat === '24h' && styles.optionButtonTextActive
              ]}>
                24h (14:30)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                settings.timeFormat === '12h' && styles.optionButtonActive
              ]}
              onPress={() => setSettings({ ...settings, timeFormat: '12h' })}
            >
              <Text style={[
                styles.optionButtonText,
                settings.timeFormat === '12h' && styles.optionButtonTextActive
              ]}>
                12h (2:30 PM)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: spacing.xxl * 2 }} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  saveText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  saveTextDisabled: {
    color: colors.textMuted,
  },
  content: {
    flex: 1,
  },
  previewCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: fontSize.sm,
    color: colors.textInverse + '80',
    marginBottom: spacing.xs,
  },
  previewAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: spacing.sm,
  },
  previewDate: {
    fontSize: fontSize.sm,
    color: colors.textInverse + '80',
  },
  section: {
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  subLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  currencyCard: {
    width: '30%',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  currencySymbol: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  currencySymbolActive: {
    color: colors.textInverse,
  },
  currencyName: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  currencyNameActive: {
    color: colors.textInverse + '80',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonSmall: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  optionButtonTextSmall: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  optionButtonTextActive: {
    color: colors.textInverse,
  },
});

