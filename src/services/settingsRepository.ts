import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_NOTIFICATION_SETTINGS, NotificationSettings } from "../types";

const STORAGE_KEY = "@my_fridge/notification_settings";

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
}

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
