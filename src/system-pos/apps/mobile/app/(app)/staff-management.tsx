import { useState } from 'react';
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
import { useAuthStore } from '../../src/store/auth';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/lib/theme';

const hapticImpact = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style);
};

export default function StaffManagementScreen() {
  const router = useRouter();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const canManageEmployees = hasPermission('employees:manage');
  const canManageRoles = hasPermission('employees:manage'); // Assuming same permission for now
  const canViewEmployees = hasPermission('employees:view');

  const menuItems = [
    {
      id: 'employees',
      icon: 'people',
      title: 'Employés',
      subtitle: 'Gérer les employés',
      onPress: () => router.push('/(app)/employees-list'),
      enabled: canViewEmployees || canManageEmployees,
    },
    {
      id: 'roles',
      icon: 'shield',
      title: 'Rôles',
      subtitle: 'Gérer les rôles et leurs permissions',
      onPress: () => router.push('/(app)/roles-list'),
      enabled: canManageRoles,
    },
    {
      id: 'permissions',
      icon: 'key',
      title: 'Permissions',
      subtitle: 'Voir toutes les permissions disponibles',
      onPress: () => router.push('/(app)/permissions-list'),
      enabled: canManageRoles,
    },
  ];

  const handleItemPress = (item: typeof menuItems[0]) => {
    if (!item.enabled) {
      Alert.alert('Accès refusé', 'Vous n\'avez pas la permission d\'accéder à cette fonctionnalité');
      return;
    }
    hapticImpact(Haptics.ImpactFeedbackStyle.Light);
    item.onPress();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion du personnel</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestion du personnel</Text>
          <Text style={styles.sectionDescription}>
            Gérez les employés, leurs rôles et leurs permissions d'accès au système.
          </Text>

          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                !item.enabled && styles.menuItemDisabled,
              ]}
              onPress={() => handleItemPress(item)}
              disabled={!item.enabled}
              activeOpacity={0.7}
            >
              <View style={[
                styles.menuItemIcon,
                !item.enabled && styles.menuItemIconDisabled,
              ]}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.enabled ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={[
                  styles.menuItemTitle,
                  !item.enabled && styles.menuItemTitleDisabled,
                ]}>
                  {item.title}
                </Text>
                <Text style={[
                  styles.menuItemSubtitle,
                  !item.enabled && styles.menuItemSubtitleDisabled,
                ]}>
                  {item.subtitle}
                </Text>
              </View>
              {item.enabled && (
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>À propos</Text>
              <Text style={styles.infoText}>
                Les rôles définissent les permissions d'accès. Les employés sont assignés à un rôle et un entrepôt.
              </Text>
            </View>
          </View>
        </View>
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
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemIconDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  menuItemTitleDisabled: {
    color: colors.textMuted,
  },
  menuItemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  menuItemSubtitleDisabled: {
    color: colors.textMuted,
    opacity: 0.7,
  },
  infoSection: {
    padding: spacing.md,
    paddingTop: 0,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
});

