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
  rescheduleAll,
  rescheduleNotificationsForItem,
} from "../services/notificationService";

interface FoodContextValue {
  items: FoodItem[];
  loading: boolean;
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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedItems, loadedSettings] = await Promise.all([
        foodApi.listItems(),
        getNotificationSettings(),
      ]);
      setItems(loadedItems);
      setSettings(loadedSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (input: CreateFoodItemInput) => {
      const created = await foodApi.createItem(input);
      setItems((prev) => [...prev, created]);
      await rescheduleNotificationsForItem(created, settings);
      return created;
    },
    [settings]
  );

  const editItem = useCallback(
    async (id: string, input: UpdateFoodItemInput) => {
      const updated = await foodApi.updateItem(id, input);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      await rescheduleNotificationsForItem(updated, settings);
      return updated;
    },
    [settings]
  );

  const removeItem = useCallback(async (id: string) => {
    await foodApi.deleteItem(id);
    await cancelNotificationsFor(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      await saveNotificationSettings(newSettings);
      setSettings(newSettings);
      await rescheduleAll(items, newSettings);
    },
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      loading,
      settings,
      refresh,
      addItem,
      editItem,
      removeItem,
      updateSettings,
    }),
    [items, loading, settings, refresh, addItem, editItem, removeItem, updateSettings]
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
