import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/store/auth';
import { useAppModeStore } from '../../src/store/appMode';
import { useOfflineQueueStore } from '../../src/store/offlineQueue';
import { initNetworkListener } from '../../src/lib/offlineSync';
import { registerForPushNotificationsAsync, scheduleLowStockNotification } from '../../src/lib/notifications';
import api from '../../src/lib/api';
import { colors, spacing, fontSize, borderRadius } from '../../src/lib/theme';

const hapticImpact = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export default function AppLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const mode = useAppModeStore((state) => state.mode);
  const canSwitchMode = useAppModeStore((state) => state.canSwitchMode);
  const setMode = useAppModeStore((state) => state.setMode);
  const isOnline = useOfflineQueueStore((state) => state.isOnline);
  const pendingSales = useOfflineQueueStore((state) => state.pendingSales);
  const pendingCount = pendingSales.filter((s) => !s.synced).length;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  // Initialize network listener
  useEffect(() => {
    const unsubscribe = initNetworkListener();
    return () => unsubscribe();
  }, []);

  // Initialize notifications and check low stock
  useEffect(() => {
    const initNotifications = async () => {
      await registerForPushNotificationsAsync();
      
      // Check low stock periodically
      const checkLowStock = async () => {
        try {
          const response = await api.get('/inventory/low-stock');
          const items = response.data.data || [];
          
          const outOfStock = items.filter((item: any) => Number(item.quantity) === 0).length;
          const lowStock = items.filter((item: any) => Number(item.quantity) > 0).length;
          
          if (outOfStock > 0 || lowStock > 0) {
            await scheduleLowStockNotification(lowStock, outOfStock);
          }
        } catch (error) {
          console.log('Could not check low stock:', error);
        }
      };

      // Check on load
      checkLowStock();

      // Check every 30 minutes
      const interval = setInterval(checkLowStock, 30 * 60 * 1000);
      return () => clearInterval(interval);
    };

    initNotifications();
  }, []);

  const handleModeSwitch = async () => {
    if (!canSwitchMode) return;
    const newMode = mode === 'sell' ? 'manage' : 'sell';
    await setMode(newMode);
    hapticImpact();
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const modeColor = mode === 'sell' ? colors.primary : colors.success;
  const modeIcon = mode === 'sell' ? 'cart' : 'create';
  const modeLabel = mode === 'sell' ? 'Vente' : 'Gestion';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: modeColor,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: mode === 'manage' ? colors.successLight : colors.border,
          borderTopWidth: mode === 'manage' ? 2 : 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: mode === 'sell' ? 'POS' : 'Produits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={mode === 'sell' ? 'grid' : 'cube'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          href: mode === 'manage' ? null : '/(app)/cart', // Hide in manage mode
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories-list"
        options={{
          title: 'Catégories',
          href: mode === 'sell' ? null : '/(app)/categories-list', // Only show in manage mode
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="folder-open" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Ventes',
          href: mode === 'manage' ? null : '/(app)/sales', // Hide in manage mode
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shift"
        options={{
          href: null, // Always hidden
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: mode === 'sell' ? 'Plus' : 'Paramètres',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={mode === 'sell' ? 'menu' : 'settings'} size={size} color={color} />
          ),
        }}
      />
      {/* Hidden screens - management */}
      <Tabs.Screen
        name="products-manage"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="products-list"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="categories-manage"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="inventory"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="inventory-adjust"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="expenses"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="expenses-manage"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="customers"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="customers-manage"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="reports"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="settings-printer"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="settings-receipt"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="settings-format"
        options={{ href: null }}
      />
    </Tabs>
  );
}

