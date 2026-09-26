import {
  BarcodeProduct,
  CreateFoodItemInput,
  FoodItem,
  UpdateFoodItemInput,
} from "../types";

/**
 * Contract shared with the future backend. The mobile app is written
 * against this interface only, so `LocalFoodApi` (AsyncStorage) can be
 * swapped for an HTTP implementation later without touching screens.
 * See docs/openapi.yaml and docs/API_CONTRACTS.md for the wire format.
 */
export interface IFoodApi {
  listItems(): Promise<FoodItem[]>;
  getItem(id: string): Promise<FoodItem | null>;
  createItem(input: CreateFoodItemInput): Promise<FoodItem>;
  updateItem(id: string, input: UpdateFoodItemInput): Promise<FoodItem>;
  deleteItem(id: string): Promise<void>;
  lookupBarcode(barcode: string): Promise<BarcodeProduct | null>;
}
