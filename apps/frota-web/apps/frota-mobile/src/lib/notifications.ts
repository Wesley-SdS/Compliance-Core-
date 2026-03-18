import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Geral',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      lightColor: '#0EA5E9',
    });
    await Notifications.setNotificationChannelAsync('urgente', {
      name: 'Urgente',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500],
      lightColor: '#EF4444',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: 'frota-leve' });
  const pushToken = tokenData.data;

  try {
    await api('/api/push-tokens', {
      method: 'POST',
      body: JSON.stringify({ token: pushToken, platform: Platform.OS, device: Platform.OS }),
    });
  } catch { /* silent */ }

  return pushToken;
}

export const addNotificationListener = Notifications.addNotificationReceivedListener;
export const addResponseListener = Notifications.addNotificationResponseReceivedListener;

export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
