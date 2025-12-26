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
import { colors, spacing, fontSize, borderRadius } from '../../src/lib/theme';

const RECEIPT_SETTINGS_KEY = '@receipt_settings';

interface ReceiptSettings {
  // Header
  showLogo: boolean;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  
  // Content
  showItemSku: boolean;
  showItemDiscount: boolean;
  showTaxBreakdown: boolean;
  showPaymentDetails: boolean;
  showCashier: boolean;
  showDateTime: boolean;
  
  // Footer
  showFooter: boolean;
  footerLine1: string;
  footerLine2: string;
  showBarcode: boolean;
  showQrCode: boolean;
}

const defaultSettings: ReceiptSettings = {
  showLogo: true,
  businessName: 'Mon Commerce',
  address: '',
  phone: '',
  email: '',
  
  showItemSku: false,
  showItemDiscount: true,
  showTaxBreakdown: true,
  showPaymentDetails: true,
  showCashier: true,
  showDateTime: true,
  
  showFooter: true,
  footerLine1: 'Merci pour votre achat!',
  footerLine2: 'À bientôt!',
  showBarcode: true,
  showQrCode: false,
};

const hapticNotification = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(type);
};

export default function ReceiptSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<ReceiptSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECEIPT_SETTINGS_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading receipt settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(RECEIPT_SETTINGS_KEY, JSON.stringify(settings));
      hapticNotification(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Paramètres du reçu enregistrés');
    } catch (error) {
      hapticNotification(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible d\'enregistrer les paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const previewReceipt = () => {
    const preview = `
━━━━━━━━━━━━━━━━━━━━━━━━━
${settings.showLogo ? '[LOGO]' : ''}
${settings.businessName}
${settings.address}
${settings.phone}
━━━━━━━━━━━━━━━━━━━━━━━━━
${settings.showDateTime ? 'Date: 22/12/2024 14:30' : ''}
${settings.showCashier ? 'Vendeur: Jean Dupont' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━
Produit A x2          5000 FCFA
${settings.showItemSku ? '  SKU: PRD-001' : ''}
${settings.showItemDiscount ? '  Remise: -500 FCFA' : ''}
Produit B x1          3000 FCFA
━━━━━━━━━━━━━━━━━━━━━━━━━
Sous-total:           8000 FCFA
${settings.showItemDiscount ? 'Remise:             -500 FCFA' : ''}
${settings.showTaxBreakdown ? 'TVA (18%):          1350 FCFA' : ''}
TOTAL:               8850 FCFA
━━━━━━━━━━━━━━━━━━━━━━━━━
${settings.showPaymentDetails ? 'Paiement: Espèces\nReçu: 10000 FCFA\nRendu: 1150 FCFA' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━
${settings.showFooter ? settings.footerLine1 : ''}
${settings.showFooter && settings.footerLine2 ? settings.footerLine2 : ''}
${settings.showBarcode ? '[|||||||||||||||]' : ''}
${settings.showQrCode ? '[QR CODE]' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    
    Alert.alert('Aperçu du reçu', preview);
  };

  const ToggleOption = ({ 
    title, 
    subtitle, 
    value, 
    onChange 
  }: { 
    title: string; 
    subtitle?: string; 
    value: boolean; 
    onChange: (v: boolean) => void;
  }) => (
    <View style={styles.optionRow}>
      <View style={styles.optionInfo}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );

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
        <Text style={styles.headerTitle}>Format du reçu</Text>
        <TouchableOpacity onPress={saveSettings} disabled={isSaving}>
          <Text style={[styles.saveText, isSaving && styles.saveTextDisabled]}>
            {isSaving ? '...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview Button */}
        <TouchableOpacity style={styles.previewButton} onPress={previewReceipt}>
          <Ionicons name="eye-outline" size={20} color={colors.primary} />
          <Text style={styles.previewButtonText}>Aperçu du reçu</Text>
        </TouchableOpacity>

        {/* Header Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 En-tête</Text>
          
          <ToggleOption
            title="Afficher le logo"
            value={settings.showLogo}
            onChange={(v) => setSettings({ ...settings, showLogo: v })}
          />
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom de l'entreprise</Text>
            <TextInput
              style={styles.input}
              value={settings.businessName}
              onChangeText={(text) => setSettings({ ...settings, businessName: text })}
              placeholder="Mon Commerce"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Adresse</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={settings.address}
              onChangeText={(text) => setSettings({ ...settings, address: text })}
              placeholder="123 Rue Example, Ville"
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              style={styles.input}
              value={settings.phone}
              onChangeText={(text) => setSettings({ ...settings, phone: text })}
              placeholder="+225 XX XX XX XX"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={settings.email}
              onChangeText={(text) => setSettings({ ...settings, email: text })}
              placeholder="contact@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Contenu</Text>
          
          <ToggleOption
            title="Afficher le SKU"
            subtitle="Référence produit sous chaque article"
            value={settings.showItemSku}
            onChange={(v) => setSettings({ ...settings, showItemSku: v })}
          />
          
          <ToggleOption
            title="Afficher les remises"
            subtitle="Détail des remises par article"
            value={settings.showItemDiscount}
            onChange={(v) => setSettings({ ...settings, showItemDiscount: v })}
          />
          
          <ToggleOption
            title="Détail des taxes"
            subtitle="Afficher le montant de la TVA"
            value={settings.showTaxBreakdown}
            onChange={(v) => setSettings({ ...settings, showTaxBreakdown: v })}
          />
          
          <ToggleOption
            title="Détails du paiement"
            subtitle="Mode de paiement et rendu monnaie"
            value={settings.showPaymentDetails}
            onChange={(v) => setSettings({ ...settings, showPaymentDetails: v })}
          />
          
          <ToggleOption
            title="Nom du vendeur"
            value={settings.showCashier}
            onChange={(v) => setSettings({ ...settings, showCashier: v })}
          />
          
          <ToggleOption
            title="Date et heure"
            value={settings.showDateTime}
            onChange={(v) => setSettings({ ...settings, showDateTime: v })}
          />
        </View>

        {/* Footer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👇 Pied de page</Text>
          
          <ToggleOption
            title="Afficher le pied de page"
            value={settings.showFooter}
            onChange={(v) => setSettings({ ...settings, showFooter: v })}
          />
          
          {settings.showFooter && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ligne 1</Text>
                <TextInput
                  style={styles.input}
                  value={settings.footerLine1}
                  onChangeText={(text) => setSettings({ ...settings, footerLine1: text })}
                  placeholder="Merci pour votre achat!"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ligne 2</Text>
                <TextInput
                  style={styles.input}
                  value={settings.footerLine2}
                  onChangeText={(text) => setSettings({ ...settings, footerLine2: text })}
                  placeholder="À bientôt!"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </>
          )}
          
          <ToggleOption
            title="Code-barres"
            subtitle="Code-barres du numéro de vente"
            value={settings.showBarcode}
            onChange={(v) => setSettings({ ...settings, showBarcode: v })}
          />
          
          <ToggleOption
            title="QR Code"
            subtitle="QR code pour vérification"
            value={settings.showQrCode}
            onChange={(v) => setSettings({ ...settings, showQrCode: v })}
          />
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
  previewButton: {
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
  previewButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
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
  inputGroup: {
    marginTop: spacing.md,
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
});

