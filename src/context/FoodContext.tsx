import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { foodApi } from "../api";
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
  requestNotificationPermissions,
  syncNotifications,
} from "../services/notificationService";
import {
  deletePhoto,
  persistPhoto,
  repairStoredPhoto,
} from "../services/photoStorage";

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
  // Bumped after the permission prompt so reminders are scheduled again.
  const [permissionVersion, setPermissionVersion] = useState(0);

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
          requestNotificationPermissions()
            .then(() => setPermissionVersion((v) => v + 1))
            .catch((error) =>
              console.warn("Permessi notifiche non ottenuti", error)
            );
        }
      })
      .catch((error) => console.warn("Caricamento iniziale fallito", error))
      .finally(() => setReady(true));
  }, [load]);

  // Photos saved by older versions point to the image picker cache, which
  // the OS may clear: move them to permanent storage once.
  useEffect(() => {
    if (!ready) return;
    const legacy = items.filter((item) => item.photoUri);
    if (legacy.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const item of legacy) {
        const repaired = await repairStoredPhoto(item.photoUri);
        if (cancelled || repaired === item.photoUri) continue;
        const updated = await foodApi.updateItem(item.id, { photoUri: repaired });
        setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      }
    })().catch((error) => console.warn("Migrazione foto fallita", error));
    return () => {
      cancelled = true;
    };
    // Only on the first ready render: later photos are persisted on save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Reminders are derived from items + settings: resync whenever they change.
  useEffect(() => {
    if (!ready) return;
    syncNotifications(items, settings).catch((error) =>
      console.warn("Programmazione notifiche fallita", error)
    );
  }, [ready, items, settings, permissionVersion]);

  // Only the nearest reminders fit in the OS queue: refill it on resume.
  const latest = useRef({ items, settings });
  latest.current = { items, settings };
  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      syncNotifications(latest.current.items, latest.current.settings).catch(
        (error) => console.warn("Programmazione notifiche fallita", error)
      );
    });
    return () => sub.remove();
  }, [ready]);

  const addItem = useCallback(
    async (input: CreateFoodItemInput) => {
      const photoUri = await persistPhoto(input.photoUri);
      const created = await foodApi.createItem({ ...input, photoUri });
      setItems((prev) => sortByExpiry([...prev, created]));
      return created;
    },
    []
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
      return updated;
    },
    []
  );

  const removeItem = useCallback(async (id: string) => {
    const previous = await foodApi.getItem(id);
    await foodApi.deleteItem(id);
    await deletePhoto(previous?.photoUri);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      await saveNotificationSettings(newSettings);
      setSettings(newSettings);
      if (newSettings.enabled) {
        await requestNotificationPermissions();
        setPermissionVersion((v) => v + 1);
      }
    },
    []
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
