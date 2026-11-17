import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { foodApi } from "../api/LocalFoodApi";
import {
  CreateFoodItemInput,
  FoodItem,
  NotificationSettings,
  UpdateFoodItemInput,
} from "../types";
import {
  getNotificationSettings,
  saveNotificationSettings,
} from "../services/settingsRepository";
import {
  cancelNotificationsFor,
  requestNotificationPermissions,
  rescheduleAll,
  rescheduleNotificationsForItem,
} from "../services/notificationService";
import { deletePhoto, persistPhoto } from "../services/photoStorage";

/** Keeps the list in the same order LocalFoodApi.listItems returns. */
function sortByExpiry(items: FoodItem[]): FoodItem[] {
  return [...items].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

interface FoodContextValue {
  items: FoodItem[];
  loading: boolean;
  /** True once the first load from storage has finished (successfully or not). */
  ready: boolean;
  settings: NotificationSettings;
  refresh: () => Promise<void>;
  addItem: (input: CreateFoodItemInput) => Promise<FoodItem>;
  editItem: (id: string, input: UpdateFoodItemInput) => Promise<FoodItem>;
  removeItem: (id: string) => Promise<void>;
  updateSettings: (settings: NotificationSettings) => Promise<void>;
}

const FoodContext = createContext<FoodContextValue | undefined>(undefined);

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    firstReminderDaysBefore: 3,
    secondReminderDaysBefore: 1,
  });
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const load = useCallback(async (): Promise<NotificationSettings> => {
    setLoading(true);
    try {
      const [loadedItems, loadedSettings] = await Promise.all([
        foodApi.listItems(),
        getNotificationSettings(),
      ]);
      setItems(loadedItems);
      setSettings(loadedSettings);
      return loadedSettings;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  useEffect(() => {
    load()
      .then((loadedSettings) => {
        // Without this, users who never open Settings never get reminders.
        if (loadedSettings.enabled) {
          requestNotificationPermissions().catch((error) =>
            console.warn("Permessi notifiche non ottenuti", error)
          );
        }
      })
      .catch((error) => console.warn("Caricamento iniziale fallito", error))
      .finally(() => setReady(true));
  }, [load]);

  const addItem = useCallback(
    async (input: CreateFoodItemInput) => {
      const photoUri = await persistPhoto(input.photoUri);
      const created = await foodApi.createItem({ ...input, photoUri });
      setItems((prev) => sortByExpiry([...prev, created]));
      await rescheduleNotificationsForItem(created, settings);
      return created;
    },
    [settings]
  );

  const editItem = useCallback(
    async (id: string, input: UpdateFoodItemInput) => {
      const previous = await foodApi.getItem(id);
      const patch = { ...input };
      if ("photoUri" in input) {
        patch.photoUri = await persistPhoto(input.photoUri);
      }
      const updated = await foodApi.updateItem(id, patch);
      if (previous?.photoUri && previous.photoUri !== updated.photoUri) {
        await deletePhoto(previous.photoUri);
      }
      setItems((prev) =>
        sortByExpiry(prev.map((item) => (item.id === id ? updated : item)))
      );
      await rescheduleNotificationsForItem(updated, settings);
      return updated;
    },
    [settings]
  );

  const removeItem = useCallback(async (id: string) => {
    const previous = await foodApi.getItem(id);
    await foodApi.deleteItem(id);
    await cancelNotificationsFor(id);
    await deletePhoto(previous?.photoUri);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      await saveNotificationSettings(newSettings);
      setSettings(newSettings);
      if (newSettings.enabled) {
        await requestNotificationPermissions();
      }
      await rescheduleAll(items, newSettings);
    },
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      ready,
      settings,
      refresh,
      addItem,
      editItem,
      removeItem,
      updateSettings,
    }),
    [items, loading, ready, settings, refresh, addItem, editItem, removeItem, updateSettings]
  );

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFood(): FoodContextValue {
  const ctx = useContext(FoodContext);
  if (!ctx) {
    throw new Error("useFood must be used within a FoodProvider");
  }
  return ctx;
}
