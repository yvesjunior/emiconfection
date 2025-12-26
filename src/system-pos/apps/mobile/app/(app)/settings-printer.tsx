import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const PRINTER_SETTINGS_KEY = '@printer_settings';

interface PrinterSettings {
  enabled: boolean;
  printerType: 'thermal' | 'network' | 'bluetooth' | 'none';
  printerName: string;
  ipAddress: string;
  port: string;
  paperWidth: '58' | '80';
  autoPrint: boolean;
  copies: number;
  showLogo: boolean;
  showFooter: boolean;
  footerText: string;
}

const defaultSettings: PrinterSettings = {
  enabled: false,
  printerType: 'none',
  printerName: '',
  ipAddress: '',
  port: '9100',
  paperWidth: '80',
  autoPrint: false,
  copies: 1,
  showLogo: true,
  showFooter: true,
  footerText: 'Merci pour votre achat!',
};

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

export default function PrinterSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrinterSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(PRINTER_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading printer settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(settings));
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Paramètres d\'impression enregistrés');
    } catch (error) {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer les paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const testPrint = async () => {
    if (!settings.enabled || settings.printerType === 'none') {
      Alert.alert('Imprimante désactivée', 'Veuillez d\'abord activer et configurer une imprimante');
      return;
    }

    Alert.alert(
      'Test d\'impression',
      `Envoi du test vers:\n${settings.printerName || settings.ipAddress || 'Imprimante configurée'}\n\nNote: Le test nécessite une imprimante physique connectée.`,
      [{ text: 'OK' }]
    );
    hapticNotification(Haptics.NotificationFeedbackType.Success);
  };

  const printerTypes = [
    { value: 'none', label: 'Aucune', icon: 'close-circle-outline' },
    { value: 'thermal', label: 'Thermique USB', icon: 'print-outline' },
    { value: 'network', label: 'Réseau (IP)', icon: 'wifi-outline' },
    { value: 'bluetooth', label: 'Bluetooth', icon: 'bluetooth-outline' },
  ];

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
        <Text style={styles.headerTitle}>Imprimante</Text>
        <TouchableOpacity onPress={saveSettings} disabled={isSaving}>
          <Text style={[styles.saveText, isSaving && styles.saveTextDisabled]}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enable Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="print" size={24} color={colors.primary} />
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Impression activée</Text>
                <Text style={styles.toggleSubtitle}>
                  {settings.enabled ? 'Les reçus seront imprimés' : 'Impression désactivée'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => setSettings({ ...settings, enabled: value })}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.enabled ? colors.primary : colors.textMuted}
            />
          </View>
        </View>

        {/* Printer Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type d'imprimante</Text>
          <View style={styles.printerTypeGrid}>
            {printerTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.printerTypeCard,
                  settings.printerType === type.value && styles.printerTypeCardActive
                ]}
                onPress={() => setSettings({ ...settings, printerType: type.value as any })}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={settings.printerType === type.value ? colors.textInverse : colors.textSecondary}
                />
                <Text style={[
                  styles.printerTypeText,
                  settings.printerType === type.value && styles.printerTypeTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Network Settings */}
        {settings.printerType === 'network' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration réseau</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresse IP</Text>
              <TextInput
                style={styles.input}
                value={settings.ipAddress}
                onChangeText={(text) => setSettings({ ...settings, ipAddress: text })}
                placeholder="192.168.1.100"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Port</Text>
              <TextInput
                style={styles.input}
                value={settings.port}
                onChangeText={(text) => setSettings({ ...settings, port: text })}
                placeholder="9100"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />
            </View>
          </View>
        )}

        {/* Bluetooth/USB Settings */}
        {(settings.printerType === 'bluetooth' || settings.printerType === 'thermal') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {settings.printerType === 'bluetooth' ? 'Imprimante Bluetooth' : 'Imprimante USB'}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom de l'imprimante</Text>
              <TextInput
                style={styles.input}
                value={settings.printerName}
                onChangeText={(text) => setSettings({ ...settings, printerName: text })}
                placeholder="Ex: Epson TM-T20"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <TouchableOpacity style={styles.scanButton}>
              <Ionicons name="search" size={20} color={colors.primary} />
              <Text style={styles.scanButtonText}>Rechercher des imprimantes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Paper Settings */}
        {settings.printerType !== 'none' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Papier</Text>
            <View style={styles.paperSizeRow}>
              <TouchableOpacity
                style={[
                  styles.paperSizeButton,
                  settings.paperWidth === '58' && styles.paperSizeButtonActive
                ]}
                onPress={() => setSettings({ ...settings, paperWidth: '58' })}
              >
                <Text style={[
                  styles.paperSizeText,
                  settings.paperWidth === '58' && styles.paperSizeTextActive
                ]}>58mm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paperSizeButton,
                  settings.paperWidth === '80' && styles.paperSizeButtonActive
                ]}
                onPress={() => setSettings({ ...settings, paperWidth: '80' })}
              >
                <Text style={[
                  styles.paperSizeText,
                  settings.paperWidth === '80' && styles.paperSizeTextActive
                ]}>80mm</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Print Options */}
        {settings.printerType !== 'none' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options</Text>
            
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Impression automatique</Text>
                <Text style={styles.optionSubtitle}>Imprimer après chaque vente</Text>
              </View>
              <Switch
                value={settings.autoPrint}
                onValueChange={(value) => setSettings({ ...settings, autoPrint: value })}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={settings.autoPrint ? colors.primary : colors.textMuted}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Afficher le logo</Text>
                <Text style={styles.optionSubtitle}>Logo de l'entreprise sur le reçu</Text>
              </View>
              <Switch
                value={settings.showLogo}
                onValueChange={(value) => setSettings({ ...settings, showLogo: value })}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={settings.showLogo ? colors.primary : colors.textMuted}
              />
            </View>

            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Pied de page</Text>
                <Text style={styles.optionSubtitle}>Message en bas du reçu</Text>
              </View>
              <Switch
                value={settings.showFooter}
                onValueChange={(value) => setSettings({ ...settings, showFooter: value })}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={settings.showFooter ? colors.primary : colors.textMuted}
              />
            </View>

            {settings.showFooter && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Texte du pied de page</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={settings.footerText}
                  onChangeText={(text) => setSettings({ ...settings, footerText: text })}
                  placeholder="Merci pour votre achat!"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre de copies</Text>
              <View style={styles.copiesRow}>
                <TouchableOpacity
                  style={styles.copiesButton}
                  onPress={() => setSettings({ ...settings, copies: Math.max(1, settings.copies - 1) })}
                >
                  <Ionicons name="remove" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.copiesValue}>{settings.copies}</Text>
                <TouchableOpacity
                  style={styles.copiesButton}
                  onPress={() => setSettings({ ...settings, copies: Math.min(5, settings.copies + 1) })}
                >
                  <Ionicons name="add" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Test Print */}
        {settings.printerType !== 'none' && (
          <TouchableOpacity style={styles.testButton} onPress={testPrint}>
            <Ionicons name="print-outline" size={20} color={colors.primary} />
            <Text style={styles.testButtonText}>Test d'impression</Text>
          </TouchableOpacity>
        )}

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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  toggleSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  printerTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  printerTypeCard: {
    width: '48%',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  printerTypeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  printerTypeText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  printerTypeTextActive: {
    color: colors.textInverse,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  scanButtonText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.primary,
  },
  paperSizeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  paperSizeButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  paperSizeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paperSizeText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paperSizeTextActive: {
    color: colors.textInverse,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  optionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  copiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  copiesButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  copiesValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  testButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
});

