export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string; // ISO 8601 date (YYYY-MM-DD)
  photoUri?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateFoodItemInput = Omit<FoodItem, "id" | "createdAt" | "updatedAt">;
export type UpdateFoodItemInput = Partial<CreateFoodItemInput>;

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  quantity?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  firstReminderDaysBefore: number;
  secondReminderDaysBefore: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  firstReminderDaysBefore: 3,
  secondReminderDaysBefore: 1,
};
