import { IFoodApi } from "./IFoodApi";
import {
  BarcodeProduct,
  CreateFoodItemInput,
  FoodItem,
  UpdateFoodItemInput,
} from "../types";

/**
 * Placeholder for the future HTTP client implementing IFoodApi against the
 * real backend described in docs/openapi.yaml. Not wired up yet: the app
 * currently uses LocalFoodApi. Fill this in once the backend exists and
 * swap the export in src/api/index.ts.
 */
export class RemoteFoodApi implements IFoodApi {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`API error ${response.status} on ${path}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }

  listItems(): Promise<FoodItem[]> {
    return this.request<FoodItem[]>("/items");
  }

  getItem(id: string): Promise<FoodItem | null> {
    return this.request<FoodItem | null>(`/items/${id}`);
  }

  createItem(input: CreateFoodItemInput): Promise<FoodItem> {
    return this.request<FoodItem>("/items", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateItem(id: string, input: UpdateFoodItemInput): Promise<FoodItem> {
    return this.request<FoodItem>(`/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteItem(id: string): Promise<void> {
    return this.request<void>(`/items/${id}`, { method: "DELETE" });
  }

  lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
    return this.request<BarcodeProduct | null>(`/barcode/${barcode}`);
  }
}
