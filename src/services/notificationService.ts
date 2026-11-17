import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FoodItem, NotificationSettings } from "../types";

/** Per-item id map used by older versions; no longer needed. */
const LEGACY_SCHEDULED_MAP_KEY = "@my_fridge/scheduled_notifications";

/**
 * iOS keeps at most 64 pending local notifications per app and silently
 * drops the rest, so only the nearest reminders are scheduled. The window
 * moves forward because sync runs again on startup and on every resume.
 */
const MAX_SCHEDULED = 60;

const CHANNEL_ID = "expiry-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let channelReady: Promise<void> | null = null;

/** Creates the Android channel once; scheduling on a missing channel fails silently. */
function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return Promise.resolve();
  if (!channelReady) {
    channelReady = Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Scadenze alimenti",
      importance: Notifications.AndroidImportance.DEFAULT,
    })
      .then(() => undefined)
      .catch((error) => {
        channelReady = null;
        throw error;
      });
  }
  return channelReady;
}

/**
 * Asks for notification permission (only prompts if not decided yet) and
 * makes sure the Android channel exists. Called at app startup.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  await ensureChannel();
  const { status: existingStatus, canAskAgain } =
    await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;
  if (!canAskAgain) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function reminderBody(item: FoodItem, daysBefore: number): string {
  const when =
    daysBefore === 0
      ? "scade oggi"
      : daysBefore === 1
        ? "scade domani"
        : `scade tra ${daysBefore} giorni`;
  return `${item.name} ${when} (${item.expiryDate}).`;
}

function triggerDateFor(expiryDateIso: string, daysBefore: number): Date | null {
  const expiry = new Date(`${expiryDateIso}T09:00:00`);
  const trigger = new Date(expiry);
  trigger.setDate(trigger.getDate() - daysBefore);
  return trigger.getTime() > Date.now() ? trigger : null;
}

interface PlannedReminder {
  item: FoodItem;
  daysBefore: number;
  date: Date;
}

/** The reminders that should be pending right now, nearest first, capped. */
export function planReminders(
  items: FoodItem[],
  settings: NotificationSettings
): PlannedReminder[] {
  if (!settings.enabled) return [];
  // Same value twice would fire two identical notifications.
  const offsets = Array.from(
    new Set([settings.firstReminderDaysBefore, settings.secondReminderDaysBefore])
  );
  const planned: PlannedReminder[] = [];
  for (const item of items) {
    for (const daysBefore of offsets) {
      const date = triggerDateFor(item.expiryDate, daysBefore);
      if (date) planned.push({ item, daysBefore, date });
    }
  }
  planned.sort((a, b) => a.date.getTime() - b.date.getTime());
  return planned.slice(0, MAX_SCHEDULED);
}

async function doSync(
  items: FoodItem[],
  settings: NotificationSettings
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(LEGACY_SCHEDULED_MAP_KEY);

  const planned = planReminders(items, settings);
  if (planned.length === 0) return;

  await ensureChannel();
  for (const { item, daysBefore, date } of planned) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "In scadenza nel frigo",
        body: reminderBody(item, daysBefore),
        data: { itemId: item.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: CHANNEL_ID,
      },
    });
  }
}

let syncQueue: Promise<void> = Promise.resolve();

/**
 * Replaces every pending reminder with the ones computed from the current
 * items and settings. Calls are serialized so overlapping syncs can't leave
 * duplicates behind.
 */
export function syncNotifications(
  items: FoodItem[],
  settings: NotificationSettings
): Promise<void> {
  const run = syncQueue.then(() => doSync(items, settings));
  syncQueue = run.catch(() => undefined);
  return run;
}
