import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_NOTIFICATION_KEY = 'last_low_stock_notification';
const NOTIFICATION_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('low-stock', {
      name: 'Stock Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function scheduleLowStockNotification(
  lowStockCount: number,
  outOfStockCount: number
): Promise<void> {
  if (lowStockCount === 0 && outOfStockCount === 0) return;

  // Check if we've sent a notification recently
  const lastNotification = await AsyncStorage.getItem(LAST_NOTIFICATION_KEY);
  if (lastNotification) {
    const lastTime = parseInt(lastNotification, 10);
    if (Date.now() - lastTime < NOTIFICATION_INTERVAL) {
      return; // Don't spam notifications
    }
  }

  let title = '';
  let body = '';

  if (outOfStockCount > 0 && lowStockCount > 0) {
    title = '⚠️ Alerte de stock';
    body = `${outOfStockCount} produit(s) en rupture de stock et ${lowStockCount} avec stock faible`;
  } else if (outOfStockCount > 0) {
    title = '🚨 Rupture de stock';
    body = `${outOfStockCount} produit(s) en rupture de stock`;
  } else {
    title = '📦 Stock faible';
    body = `${lowStockCount} produit(s) avec un niveau de stock faible`;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'low_stock' },
      sound: true,
    },
    trigger: null, // Send immediately
  });

  // Record notification time
  await AsyncStorage.setItem(LAST_NOTIFICATION_KEY, Date.now().toString());
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

