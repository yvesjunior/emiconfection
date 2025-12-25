import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';
import { formatCurrency } from '../../src/lib/utils';

export default function SettingsLoyaltyScreen() {
  const router = useRouter();
  const employee = useAuthStore((state) => state.employee);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const queryClient = useQueryClient();

  const [attributionRate, setAttributionRate] = useState<string>('');
  const [conversionRate, setConversionRate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is admin
  const isAdmin = employee?.role?.name === 'admin';

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['loyalty-settings'],
    queryFn: async () => {
      const res = await api.get('/settings/loyalty-points');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setAttributionRate((settings.attributionRate * 100).toString()); // Convert to percentage
      setConversionRate(settings.conversionRate.toString());
    }
  }, [settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { attributionRate: number; conversionRate: number }) => {
      const res = await api.put('/settings/loyalty-points', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Paramètres de points de fidélité enregistrés');
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'enregistrer les paramètres');
    },
  });

  const handleSave = () => {
    if (!isAdmin) {
      Alert.alert('Accès refusé', 'Seuls les administrateurs peuvent modifier ces paramètres');
      return;
    }

    const attribution = parseFloat(attributionRate) / 100; // Convert percentage to decimal
    const conversion = parseFloat(conversionRate);

    if (isNaN(attribution) || attribution < 0 || attribution > 1) {
      Alert.alert('Erreur', 'Le taux d\'attribution doit être entre 0% et 100%');
      return;
    }

    if (isNaN(conversion) || conversion <= 0) {
      Alert.alert('Erreur', 'Le taux de conversion doit être supérieur à 0');
      return;
    }

    setIsSaving(true);
    saveMutation.mutate(
      { attributionRate: attribution, conversionRate: conversion },
      {
        onSettled: () => {
          setIsSaving(false);
        },
      }
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Points de fidélité</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
          <Text style={styles.accessDeniedTitle}>Accès refusé</Text>
          <Text style={styles.accessDeniedText}>
            Seuls les administrateurs peuvent modifier les paramètres de points de fidélité
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points de fidélité</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Configuration des points de fidélité</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Configurez les taux d'attribution et de conversion des points de fidélité pour vos clients.
            </Text>
          </View>

          {/* Attribution Rate */}
          <View style={styles.section}>
            <Text style={styles.label}>Taux d'attribution</Text>
            <Text style={styles.helperText}>
              Pourcentage du montant de vente converti en points (ex: 1% = 1 point par 100 FCFA)
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={attributionRate}
                onChangeText={setAttributionRate}
                placeholder="1"
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
            {attributionRate && !isNaN(parseFloat(attributionRate)) && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Exemple:</Text>
                <Text style={styles.previewText}>
                  Une vente de 10 000 FCFA = {Math.floor(10000 * (parseFloat(attributionRate) / 100))} points
                </Text>
              </View>
            )}
          </View>

          {/* Conversion Rate */}
          <View style={styles.section}>
            <Text style={styles.label}>Taux de conversion</Text>
            <Text style={styles.helperText}>
              Équivalence points → monnaie pour les remises (ex: 1.0 = 1 point = 1 FCFA)
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={conversionRate}
                onChangeText={setConversionRate}
                placeholder="1.0"
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={styles.inputSuffix}>FCFA/point</Text>
            </View>
            {conversionRate && !isNaN(parseFloat(conversionRate)) && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Exemple:</Text>
                <Text style={styles.previewText}>
                  1000 points = {formatCurrency(1000 * parseFloat(conversionRate))} de remise
                </Text>
              </View>
            )}
          </View>

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
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: fontSize.md * 1.5,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: fontSize.sm * 1.4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlign: 'right',
  },
  inputSuffix: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textMuted,
    paddingRight: spacing.md,
  },
  preview: {
    padding: spacing.md,
    backgroundColor: colors.successLight + '20',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  previewLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  previewText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
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

