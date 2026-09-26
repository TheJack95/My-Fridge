import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FoodItem, NotificationSettings } from "../types";

const SCHEDULED_MAP_KEY = "@my_fridge/scheduled_notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type ScheduledMap = Record<string, string[]>; // itemId -> notification ids

async function readMap(): Promise<ScheduledMap> {
  const raw = await AsyncStorage.getItem(SCHEDULED_MAP_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function writeMap(map: ScheduledMap): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_MAP_KEY, JSON.stringify(map));
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("expiry-reminders", {
      name: "Scadenze alimenti",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return finalStatus === "granted";
}

async function cancelNotificationsForItem(itemId: string): Promise<void> {
  const map = await readMap();
  const ids = map[itemId] ?? [];
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  delete map[itemId];
  await writeMap(map);
}

function triggerDateFor(expiryDateIso: string, daysBefore: number): Date | null {
  const expiry = new Date(`${expiryDateIso}T09:00:00`);
  const trigger = new Date(expiry);
  trigger.setDate(trigger.getDate() - daysBefore);
  return trigger.getTime() > Date.now() ? trigger : null;
}

/**
 * Cancels any previously scheduled reminders for this item and schedules
 * the two configurable "expiring soon" notifications, if their dates are
 * still in the future.
 */
export async function rescheduleNotificationsForItem(
  item: FoodItem,
  settings: NotificationSettings
): Promise<void> {
  await cancelNotificationsForItem(item.id);

  if (!settings.enabled) {
    return;
  }

  const offsets = [
    settings.firstReminderDaysBefore,
    settings.secondReminderDaysBefore,
  ];

  const scheduledIds: string[] = [];

  for (const daysBefore of offsets) {
    const triggerDate = triggerDateFor(item.expiryDate, daysBefore);
    if (!triggerDate) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "In scadenza nel frigo",
        body: `${item.name} scade tra ${daysBefore} giorno${daysBefore === 1 ? "" : "i"} (${item.expiryDate}).`,
        data: { itemId: item.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: "expiry-reminders",
      },
    });
    scheduledIds.push(id);
  }

  const map = await readMap();
  map[item.id] = scheduledIds;
  await writeMap(map);
}

export async function cancelNotificationsFor(itemId: string): Promise<void> {
  await cancelNotificationsForItem(itemId);
}

/**
 * Re-applies the current settings to every item's reminders, e.g. after
 * the user changes the configurable day offsets.
 */
export async function rescheduleAll(
  items: FoodItem[],
  settings: NotificationSettings
): Promise<void> {
  for (const item of items) {
    await rescheduleNotificationsForItem(item, settings);
  }
}
