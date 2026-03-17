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
      name: 'ObraMaster',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync('urgent', {
      name: 'Alertas Urgentes',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  try {
    await api('/notifications/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
  } catch {
    // Silently fail
  }

  return token;
}
